import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import uploadRouter from './upload-router';
import chunkedUploader from './chunked-uploader';
import Alexa from 'ask-sdk-core';
import { ExpressAdapter } from 'ask-sdk-express-adapter';
import { storage } from './storage';

const app = express();

// Base URL for audio files - use production URL
const AUDIO_BASE_URL = process.env.REPLIT_DEV_DOMAIN 
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : 'https://music-stream-pro-pbm2.replit.app';

// Simple in-memory state for audio playback (single user app)
interface PlaybackState {
  trackId: number;
  token: string;
  audioUrl: string;
  offsetInMilliseconds: number;
  trackTitle: string;
  artistName: string;
}
let currentPlaybackState: PlaybackState | null = null;

// Register Alexa endpoint BEFORE body parsers (SDK needs raw body)
const LaunchRequestHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput: Alexa.HandlerInput) {
    return handlerInput.responseBuilder
      .speak('Welcome to NU Melodic! You can say play music to start streaming, or ask about featured albums.')
      .reprompt('Say play music to start listening.')
      .getResponse();
  }
};

const PlayMusicIntentHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlayMusicIntent';
  },
  async handle(handlerInput: Alexa.HandlerInput) {
    try {
      let tracks = await storage.getFeaturedTracks();
      if (tracks.length === 0) {
        tracks = await storage.getAllTracks();
      }
      if (tracks.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(tracks.length, 10));
        const track = tracks[randomIndex];
        const album = await storage.getAlbum(track.albumId);
        const artistName = album?.artist || 'Unknown Artist';
        
        const audioUrl = `${AUDIO_BASE_URL}${track.audioUrl}`;
        const token = `track-${track.id}-${Date.now()}`;
        
        // Store playback state for resume
        currentPlaybackState = {
          trackId: track.id,
          token,
          audioUrl,
          offsetInMilliseconds: 0,
          trackTitle: track.title,
          artistName
        };
        
        return handlerInput.responseBuilder
          .speak(`Now playing ${track.title} by ${artistName}`)
          .addAudioPlayerPlayDirective('REPLACE_ALL', audioUrl, token, 0, undefined, {
            title: track.title,
            subtitle: artistName,
            art: album?.coverUrl ? {
              sources: [{ url: `${AUDIO_BASE_URL}${album.coverUrl}` }]
            } : undefined
          })
          .getResponse();
      }
      return handlerInput.responseBuilder.speak('I couldn\'t find any tracks in your library right now.').getResponse();
    } catch (error) {
      console.error('PlayMusicIntent error:', error);
      return handlerInput.responseBuilder.speak('Sorry, I had trouble playing music.').getResponse();
    }
  }
};

const GetFeaturedAlbumsIntentHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetFeaturedAlbumsIntent';
  },
  async handle(handlerInput: Alexa.HandlerInput) {
    try {
      const albums = await storage.getFeaturedAlbums();
      if (albums.length > 0) {
        const albumNames = albums.slice(0, 3).map(a => a.title).join(', ');
        return handlerInput.responseBuilder
          .speak(`Here are some featured albums: ${albumNames}. Say play music to start listening.`)
          .reprompt('Would you like me to play some music?')
          .getResponse();
      }
      return handlerInput.responseBuilder.speak('There are no featured albums at the moment.').getResponse();
    } catch {
      return handlerInput.responseBuilder.speak('Sorry, I had trouble getting the featured albums.').getResponse();
    }
  }
};

const GetRecentAlbumsIntentHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetRecentAlbumsIntent';
  },
  async handle(handlerInput: Alexa.HandlerInput) {
    try {
      const albums = await storage.getRecentAlbums();
      if (albums.length > 0) {
        const albumNames = albums.slice(0, 3).map(a => `${a.title} by ${a.artist}`).join(', ');
        return handlerInput.responseBuilder.speak(`Recently added albums include: ${albumNames}.`).getResponse();
      }
      return handlerInput.responseBuilder.speak('There are no recent albums at the moment.').getResponse();
    } catch {
      return handlerInput.responseBuilder.speak('Sorry, I couldn\'t get the recent albums.').getResponse();
    }
  }
};

// AudioPlayer Pause Intent
const PauseIntentHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.PauseIntent';
  },
  handle(handlerInput: Alexa.HandlerInput) {
    return handlerInput.responseBuilder
      .addAudioPlayerStopDirective()
      .getResponse();
  }
};

// AudioPlayer Resume Intent
const ResumeIntentHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.ResumeIntent';
  },
  async handle(handlerInput: Alexa.HandlerInput) {
    // Resume from where we left off using stored state
    if (currentPlaybackState) {
      return handlerInput.responseBuilder
        .speak(`Resuming ${currentPlaybackState.trackTitle}`)
        .addAudioPlayerPlayDirective(
          'REPLACE_ALL',
          currentPlaybackState.audioUrl,
          currentPlaybackState.token,
          currentPlaybackState.offsetInMilliseconds,
          undefined,
          {
            title: currentPlaybackState.trackTitle,
            subtitle: currentPlaybackState.artistName
          }
        )
        .getResponse();
    }
    
    // No previous state, play a new track
    try {
      const tracks = await storage.getAllTracks();
      if (tracks.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(tracks.length, 10));
        const track = tracks[randomIndex];
        const album = await storage.getAlbum(track.albumId);
        const artistName = album?.artist || 'Unknown Artist';
        const audioUrl = `${AUDIO_BASE_URL}${track.audioUrl}`;
        const token = `track-${track.id}-${Date.now()}`;
        
        currentPlaybackState = {
          trackId: track.id,
          token,
          audioUrl,
          offsetInMilliseconds: 0,
          trackTitle: track.title,
          artistName
        };
        
        return handlerInput.responseBuilder
          .speak(`Playing ${track.title}`)
          .addAudioPlayerPlayDirective('REPLACE_ALL', audioUrl, token, 0, undefined, {
            title: track.title,
            subtitle: artistName
          })
          .getResponse();
      }
      return handlerInput.responseBuilder.speak('No tracks available.').getResponse();
    } catch {
      return handlerInput.responseBuilder.speak('Sorry, I couldn\'t resume playback.').getResponse();
    }
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput: Alexa.HandlerInput) {
    return handlerInput.responseBuilder
      .speak('You can say play music to stream audio, or ask about featured albums and recent albums.')
      .reprompt('Say play music to start listening.')
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput: Alexa.HandlerInput) {
    return handlerInput.responseBuilder
      .speak('Thanks for using NU Melodic. Goodbye!')
      .addAudioPlayerStopDirective()
      .getResponse();
  }
};

// AudioPlayer Event Handlers
const AudioPlayerEventHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope).startsWith('AudioPlayer.');
  },
  async handle(handlerInput: Alexa.HandlerInput) {
    const audioPlayerEventName = Alexa.getRequestType(handlerInput.requestEnvelope);
    const request = handlerInput.requestEnvelope.request as any;
    console.log(`AudioPlayer event: ${audioPlayerEventName}`);
    
    switch (audioPlayerEventName) {
      case 'AudioPlayer.PlaybackStarted':
        break;
      case 'AudioPlayer.PlaybackFinished':
        // Clear state when playback finishes naturally
        currentPlaybackState = null;
        break;
      case 'AudioPlayer.PlaybackStopped':
        // Save the offset for resume
        if (currentPlaybackState && request.offsetInMilliseconds !== undefined) {
          currentPlaybackState.offsetInMilliseconds = request.offsetInMilliseconds;
          console.log(`Saved offset: ${request.offsetInMilliseconds}ms`);
        }
        break;
      case 'AudioPlayer.PlaybackNearlyFinished':
        // Could queue the next track here for continuous playback
        break;
      case 'AudioPlayer.PlaybackFailed':
        console.error('Playback failed:', request.error);
        break;
    }
    return handlerInput.responseBuilder.getResponse();
  }
};

// PlaybackController for physical buttons on Echo devices
const PlaybackControllerHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope).startsWith('PlaybackController.');
  },
  async handle(handlerInput: Alexa.HandlerInput) {
    const controllerEventName = Alexa.getRequestType(handlerInput.requestEnvelope);
    console.log(`PlaybackController event: ${controllerEventName}`);
    
    if (controllerEventName === 'PlaybackController.PlayCommandIssued') {
      // Play a random track
      try {
        const tracks = await storage.getAllTracks();
        if (tracks.length > 0) {
          const randomIndex = Math.floor(Math.random() * Math.min(tracks.length, 10));
          const track = tracks[randomIndex];
          const audioUrl = `${AUDIO_BASE_URL}${track.audioUrl}`;
          const token = `track-${track.id}-${Date.now()}`;
          
          return handlerInput.responseBuilder
            .addAudioPlayerPlayDirective('REPLACE_ALL', audioUrl, token, 0)
            .getResponse();
        }
      } catch {
        // Fall through
      }
    } else if (controllerEventName === 'PlaybackController.PauseCommandIssued') {
      return handlerInput.responseBuilder.addAudioPlayerStopDirective().getResponse();
    }
    
    return handlerInput.responseBuilder.getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput: Alexa.HandlerInput) {
    return handlerInput.responseBuilder.getResponse();
  }
};

const AlexaErrorHandler = {
  canHandle() { return true; },
  handle(handlerInput: Alexa.HandlerInput, error: Error) {
    console.error('Alexa error:', error);
    return handlerInput.responseBuilder
      .speak('Sorry, I had trouble doing what you asked. Please try again.')
      .getResponse();
  }
};

const alexaSkill = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    PlayMusicIntentHandler,
    GetFeaturedAlbumsIntentHandler,
    GetRecentAlbumsIntentHandler,
    PauseIntentHandler,
    ResumeIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    AudioPlayerEventHandler,
    PlaybackControllerHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(AlexaErrorHandler)
  .create();

const alexaAdapter = new ExpressAdapter(alexaSkill, false, false);

app.post('/api/alexa', alexaAdapter.getRequestHandlers());
app.get('/api/alexa', (req, res) => {
  res.json({ status: 'Alexa AudioPlayer endpoint active', message: 'Supports audio streaming' });
});
console.log('Alexa skill with AudioPlayer registered at /api/alexa');

app.use(express.json({ limit: '5gb' }));
app.use(express.urlencoded({ extended: true, limit: '5gb' }));

// Increase maximum request size for large file uploads
app.use((req, res, next) => {
  // Set timeouts for large file uploads - 15 minutes
  req.setTimeout(900000);
  res.setTimeout(900000);
  next();
});
app.use(express.static('public'));

// Use the enhanced upload router for file uploads
app.use(uploadRouter);

// Use the chunked uploader for large file uploads
app.use(chunkedUploader);

// Set up our own high-capacity file upload endpoint

// Create the upload directories if they don't exist
const audioUploadDir = path.join(process.cwd(), 'public', 'audio');
const coverUploadDir = path.join(process.cwd(), 'public', 'covers');

if (!fs.existsSync(audioUploadDir)) {
  fs.mkdirSync(audioUploadDir, { recursive: true });
}

if (!fs.existsSync(coverUploadDir)) {
  fs.mkdirSync(coverUploadDir, { recursive: true });
}

// Configure upload middleware with reduced limits to avoid memory issues
const highCapacityUpload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      if (file.fieldname.startsWith('track-')) {
        cb(null, audioUploadDir);
      } else if (file.fieldname === 'cover') {
        cb(null, coverUploadDir);
      } else {
        cb(new Error(`Unknown field type: ${file.fieldname}`), '');
      }
    },
    filename: function(req, file, cb) {
      const timestamp = Date.now();
      const uniqueId = Math.floor(Math.random() * 1000);
      const filename = `${file.fieldname}-${timestamp}-${uniqueId}${path.extname(file.originalname)}`;
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: 400 * 1024 * 1024, // 400MB limit per file
    fieldSize: 400 * 1024 * 1024, // 400MB field size limit
    files: 20, // Maximum 20 files
    fields: 100 // Maximum 100 fields
  },
  fileFilter: function(req, file, cb) {
    if (file.fieldname.startsWith('track-')) {
      // Allow both WAV and MP3 files for tracks
      if (file.mimetype === 'audio/wav' || 
          file.originalname.endsWith('.wav') || 
          file.mimetype === 'audio/mpeg' || 
          file.originalname.endsWith('.mp3')) {
        cb(null, true);
      } else {
        cb(new Error('Only WAV and MP3 files are allowed for audio tracks'), false);
      }
    } else if (file.fieldname === 'cover') {
      // Check if it's an image file
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for album covers'), false);
      }
    } else {
      cb(null, true);
    }
  }
}).fields([
  { name: 'cover', maxCount: 1 },
  { name: 'track-0', maxCount: 1 },
  { name: 'track-1', maxCount: 1 },
  { name: 'track-2', maxCount: 1 },
  { name: 'track-3', maxCount: 1 },
  { name: 'track-4', maxCount: 1 },
  { name: 'track-5', maxCount: 1 },
  { name: 'track-6', maxCount: 1 },
  { name: 'track-7', maxCount: 1 },
  { name: 'track-8', maxCount: 1 },
  { name: 'track-9', maxCount: 1 },
  { name: 'track-10', maxCount: 1 },
  { name: 'track-11', maxCount: 1 },
  { name: 'track-12', maxCount: 1 },
  { name: 'track-13', maxCount: 1 },
  { name: 'track-14', maxCount: 1 },
  { name: 'track-15', maxCount: 1 }
]);

// Register the high-capacity album upload endpoint
app.post('/api/high-capacity-album-upload', (req, res) => {
  highCapacityUpload(req, res, async (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    }
    
    try {
      console.log("Files uploaded successfully");
      console.log("Body keys:", Object.keys(req.body || {}));
      console.log("Files:", req.files ? Object.keys(req.files) : "No files");
      
      // Print all body keys and values to diagnose the issue
      console.log("Body contents:");
      Object.entries(req.body || {}).forEach(([key, value]) => {
        console.log(`  ${key} = ${value}`);
      });
      
      // Skip authentication check for now to allow uploads
      // We'll add proper authentication once we connect passport middleware
      /*
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
      */
      
      // Load storage
      const { storage } = await import('./storage.js');
      
      // Get album data
      const { title, artist } = req.body;
      if (!title || !artist) {
        return res.status(400).json({
          success: false,
          message: "Album title and artist are required"
        });
      }
      
      const files = req.files || {};
      const trackFiles = Object.entries(files)
        .filter(([key]) => key.startsWith('track-'))
        .sort((a, b) => {
          const numA = parseInt(a[0].split('-')[1]);
          const numB = parseInt(b[0].split('-')[1]);
          return numA - numB;
        })
        .map(([_, fileArray]) => fileArray[0]);
      
      if (trackFiles.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one track is required"
        });
      }
      
      // Create album
      let coverUrl = '';
      if (files.cover && files.cover.length > 0) {
        coverUrl = `/covers/${files.cover[0].filename}`;
      }
      
      console.log("Creating album...");
      const createdAlbum = await storage.createAlbum({
        title,
        artist,
        coverUrl,
        releaseDate: new Date(),
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Rename and save track files
      const createdTracks = [];
      for (let i = 0; i < trackFiles.length; i++) {
        const trackFile = trackFiles[i];
        const trackNumber = i + 1;
        
        // Rename the track to follow our naming convention
        // Get the file extension from the original file
        const fileExt = path.extname(trackFile.originalname).toLowerCase();
        const ext = (fileExt === '.mp3' || trackFile.mimetype === 'audio/mpeg') ? '.mp3' : '.wav';
        const newFilename = `track-${createdAlbum.id}-${trackNumber}${ext}`;
        const oldPath = path.join(audioUploadDir, trackFile.filename);
        const newPath = path.join(audioUploadDir, newFilename);
        
        fs.renameSync(oldPath, newPath);
        
        // Create track in storage
        // Log the entire request.body for debugging track titles
        console.log(`Full request.body keys: ${Object.keys(req.body).join(', ')}`);
        console.log(`Request body:`, req.body);
        
        // Check multiple format patterns for track title
        let trackTitle;
        
        // Check title-{i} format from admin panel
        const titleIndexKey = `title-${i}`;
        if (req.body[titleIndexKey]) {
          if (Array.isArray(req.body[titleIndexKey])) {
            trackTitle = req.body[titleIndexKey][0];
          } else {
            trackTitle = req.body[titleIndexKey];
          }
        }
        
        // Check track-{i}Title format from older code
        if (!trackTitle) {
          const trackFieldName = `track-${i}`;
          const fieldTitleKey = `${trackFieldName}Title`;
          if (req.body[fieldTitleKey]) {
            if (Array.isArray(req.body[fieldTitleKey])) {
              trackTitle = req.body[fieldTitleKey][0];
            } else {
              trackTitle = req.body[fieldTitleKey];
            }
          }
        }
        
        // Log all debug information for this track title lookup
        console.log(`Track ${i} title lookup:`, {
          titleIndexKey,
          titleIndexValue: req.body[titleIndexKey],
          trackFieldTitleKey: `track-${i}Title`,
          trackFieldTitleValue: req.body[`track-${i}Title`],
          finalTrackTitle: trackTitle || `Track ${trackNumber}`
        });
        
        // Default fallback 
        if (!trackTitle) {
          trackTitle = `Track ${trackNumber}`;
        }
        
        // If the track title is exactly the default, check if the user intended to customize it
        if (trackTitle === `Track ${trackNumber}` && req.body[titleIndexKey] && req.body[titleIndexKey] !== `Track ${trackNumber}`) {
          console.log(`Using custom title for track ${i}: ${req.body[titleIndexKey]}`);
          trackTitle = req.body[titleIndexKey];
        }
        
        console.log(`Track ${i} title (${titleIndexKey}): ${trackTitle}`);
        const trackUrl = `/audio/${newFilename}`;
        
        const createdTrack = await storage.createTrack({
          albumId: createdAlbum.id,
          title: trackTitle,
          artist: artist,
          trackNumber: trackNumber,
          duration: 180, // We don't know actual duration without audio analysis
          audioUrl: trackUrl,
          isFeatured: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        createdTracks.push(createdTrack);
      }
      
      res.status(200).json({
        success: true,
        message: `Album '${title}' created with ${createdTracks.length} tracks`,
        albumId: createdAlbum.id,
        trackCount: createdTracks.length,
        album: createdAlbum,
        tracks: createdTracks
      });
    } catch (error: any) {
      console.error("Error in album upload:", error);
      res.status(500).json({
        success: false,
        message: `Upload failed: ${error.message || 'Unknown error'}`,
        error: error.stack || 'No stack trace available'
      });
    }
  });
});

console.log('💾 High-capacity album upload endpoint registered');

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
