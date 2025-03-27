import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { storage } from './storage.js';

// Create Express app
const app = express();

// Set up middleware with higher limits
app.use(express.json({ limit: '2gb' }));
app.use(express.urlencoded({ extended: false, limit: '2gb' }));
app.use(express.static('public'));

// Create necessary directories
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
const audioDir = path.join(process.cwd(), 'public', 'audio');
const coverDir = path.join(process.cwd(), 'public', 'covers');

[uploadDir, audioDir, coverDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Set up authentication (simplified version of auth.ts)
const sessionSettings = {
  secret: 'enhanced-upload-server-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
  store: storage.sessionStore
};

app.use(session(sessionSettings));
app.use(passport.initialize());
app.use(passport.session());

// Simplified authentication - always authenticate as demo user
app.use((req, res, next) => {
  // Skip for public routes
  if (req.path === '/api/health' || req.path === '/api/diagnostics') {
    return next();
  }
  
  // For testing purposes, we simulate the user is already authenticated
  req.isAuthenticated = () => true;
  req.user = { id: 1, username: 'demo' };
  next();
});

// Configure multer for different upload types
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const filename = `file-${timestamp}${path.extname(file.originalname)}`;
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: 400 * 1024 * 1024, // 400MB limit
  }
}).single('file');

// Audio upload middleware
const audioUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, audioDir);
    },
    filename: (req, file, cb) => {
      const { albumId, trackNumber } = req.body;
      const filename = `track-${albumId}-${trackNumber}.wav`;
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: 400 * 1024 * 1024, // 400MB limit for audio files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/wav' || file.originalname.endsWith('.wav')) {
      cb(null, true);
    } else {
      cb(new Error('Only WAV files are allowed'));
    }
  }
}).single('audio');

// Cover upload middleware
const coverUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, coverDir);
    },
    filename: (req, file, cb) => {
      const albumId = req.body.albumId;
      const ext = path.extname(file.originalname);
      const filename = `album-${albumId}${ext}`;
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for cover images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
}).single('cover');

// Album upload middleware with multiple fields
const albumUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'cover') {
        cb(null, coverDir);
      } else if (file.fieldname.startsWith('track')) {
        cb(null, audioDir);
      } else {
        cb(null, uploadDir);
      }
    },
    filename: (req, file, cb) => {
      if (file.fieldname === 'cover') {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `temp-cover-${timestamp}${ext}`);
      } else if (file.fieldname.startsWith('track')) {
        const timestamp = Date.now();
        cb(null, `temp-track-${timestamp}.wav`);
      } else {
        const timestamp = Date.now();
        cb(null, `file-${timestamp}${path.extname(file.originalname)}`);
      }
    }
  }),
  limits: {
    fileSize: 400 * 1024 * 1024, // 400MB limit for each file
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
]);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Generic file upload endpoint
app.post('/api/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ 
        success: false, 
        message: `Upload error: ${err.message}` 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file was uploaded'
      });
    }
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`
      }
    });
  });
});

// Audio upload endpoint
app.post('/api/upload/audio', (req, res) => {
  audioUpload(req, res, (err) => {
    if (err) {
      console.error('Audio upload error:', err);
      return res.status(400).json({ 
        success: false, 
        message: `Audio upload error: ${err.message}` 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file was uploaded'
      });
    }
    
    const { albumId, trackNumber } = req.body;
    const audioUrl = `/audio/track-${albumId}-${trackNumber}.wav`;
    
    res.json({
      success: true,
      message: 'Audio file uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        path: audioUrl
      }
    });
  });
});

// Cover upload endpoint
app.post('/api/upload/cover', (req, res) => {
  coverUpload(req, res, (err) => {
    if (err) {
      console.error('Cover upload error:', err);
      return res.status(400).json({ 
        success: false, 
        message: `Cover upload error: ${err.message}` 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No cover image was uploaded'
      });
    }
    
    const albumId = req.body.albumId;
    const ext = path.extname(req.file.originalname);
    const coverUrl = `/covers/album-${albumId}${ext}`;
    
    res.json({
      success: true,
      message: 'Cover image uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        path: coverUrl
      }
    });
  });
});

// Album upload endpoint from admin page
app.post('/api/albums', (req, res) => {
  console.log('Files uploaded successfully');
  console.log('Body keys:', Object.keys(req.body));
  
  albumUpload(req, res, async (err) => {
    if (err) {
      console.error('Album upload error:', err);
      return res.status(400).json({
        success: false,
        message: `Album upload error: ${err.message}`
      });
    }
    
    try {
      const { title, artist, description } = req.body;
      
      // Log what files were uploaded
      if (req.files) {
        console.log('Files:', Object.keys(req.files));
      }
      
      // Create album in the database
      const album = await storage.createAlbum({
        title: title || 'New Album',
        artist: artist || 'Unknown Artist',
        description: description || null,
        coverUrl: '/covers/default-cover.jpg', // Will be updated after file processing
        releaseDate: new Date(),
        customAlbum: 'true'
      });
      
      // Process cover file if provided
      let coverUrl = '/covers/default-cover.jpg';
      if (req.files && req.files.cover && req.files.cover[0]) {
        const cover = req.files.cover[0];
        const ext = path.extname(cover.originalname);
        const newFilename = `album-${album.id}${ext}`;
        const newPath = path.join(coverDir, newFilename);
        
        // Rename the temp file
        fs.renameSync(cover.path, newPath);
        coverUrl = `/covers/${newFilename}`;
        
        // Update album with cover URL
        album.coverUrl = coverUrl;
      }
      
      // Process track files
      const trackCount = Object.keys(req.files || {})
        .filter(key => key.startsWith('track-'))
        .length;
      
      const tracks = [];
      
      // Find all track fields
      const trackFields = Object.keys(req.files || {})
        .filter(key => key.startsWith('track-'))
        .sort();
      
      for (let i = 0; i < trackFields.length; i++) {
        const fieldName = trackFields[i];
        const trackNumber = i + 1;
        
        if (req.files[fieldName] && req.files[fieldName][0]) {
          const track = req.files[fieldName][0];
          const newFilename = `track-${album.id}-${trackNumber}.wav`;
          const newPath = path.join(audioDir, newFilename);
          
          // Rename the temp file
          fs.renameSync(track.path, newPath);
          
          // Create track in database
          const trackTitle = req.body[`${fieldName}Title`] || `Track ${trackNumber}`;
          
          const newTrack = await storage.createTrack({
            title: trackTitle,
            albumId: album.id,
            trackNumber,
            duration: 180, // Mock duration
            audioUrl: `/audio/${newFilename}`,
            isFeatured: false
          });
          
          tracks.push(newTrack);
        }
      }
      
      // Return success response with album and track information
      res.status(200).json({
        id: album.id,
        title: album.title,
        artist: album.artist,
        coverUrl: album.coverUrl,
        trackCount
      });
      
    } catch (error) {
      console.error('Error processing album upload:', error);
      res.status(500).json({
        success: false,
        message: `Error processing album upload: ${error.message}`
      });
    }
  });
});

// Album upload endpoint with multiple tracks
app.post('/api/upload/album', (req, res) => {
  albumUpload(req, res, async (err) => {
    if (err) {
      console.error('Album upload error:', err);
      return res.status(400).json({
        success: false,
        message: `Album upload error: ${err.message}`
      });
    }
    
    try {
      // For testing purposes, we'll just return the files that were uploaded
      // In a real implementation, you would create the album in the database first
      // Then rename the files to match the album ID and track numbers
      
      const files = req.files;
      const albumData = JSON.parse(req.body.albumData || '{}');
      
      // Mock albumId for testing
      const albumId = Date.now();
      
      // Process cover image
      let coverUrl = '';
      if (files.cover && files.cover[0]) {
        const cover = files.cover[0];
        const ext = path.extname(cover.originalname);
        const newFilename = `album-${albumId}${ext}`;
        const newPath = path.join(coverDir, newFilename);
        
        // Rename the temp file
        fs.renameSync(cover.path, newPath);
        coverUrl = `/covers/${newFilename}`;
      }
      
      // Process tracks
      const tracks = [];
      let trackNumber = 1;
      
      // Find all track fields
      const trackFields = Object.keys(files).filter(field => field.startsWith('track'));
      
      for (const fieldName of trackFields) {
        if (files[fieldName] && files[fieldName][0]) {
          const track = files[fieldName][0];
          const newFilename = `track-${albumId}-${trackNumber}.wav`;
          const newPath = path.join(audioDir, newFilename);
          
          // Rename the temp file
          fs.renameSync(track.path, newPath);
          
          // Get track title from form data or use a default
          const trackTitle = req.body[`${fieldName}Title`] || `Track ${trackNumber}`;
          
          tracks.push({
            trackNumber,
            title: trackTitle,
            duration: 180, // Mock duration
            audioUrl: `/audio/${newFilename}`,
            originalname: track.originalname,
            size: track.size
          });
          
          trackNumber++;
        }
      }
      
      // Return success response with album and track information
      res.json({
        success: true,
        message: 'Album uploaded successfully',
        album: {
          id: albumId,
          title: albumData.title || 'New Album',
          artist: albumData.artist || 'Unknown Artist',
          coverUrl,
          description: albumData.description || '',
          releaseDate: new Date(),
          trackCount: tracks.length
        },
        tracks
      });
      
    } catch (error) {
      console.error('Error processing album upload:', error);
      res.status(500).json({
        success: false,
        message: `Error processing album upload: ${error.message}`
      });
    }
  });
});

// Diagnostics endpoint to check file upload limits
app.get('/api/diagnostics', (req, res) => {
  res.json({
    limits: {
      bodyParser: {
        json: '2gb',
        urlencoded: '2gb'
      },
      uploads: {
        general: '400MB',
        audio: '400MB',
        cover: '5MB'
      },
      directories: {
        uploads: fs.existsSync(uploadDir),
        audio: fs.existsSync(audioDir),
        covers: fs.existsSync(coverDir)
      },
      authentication: {
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        user: req.user || null
      }
    }
  });
});

// Start server
const port = 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Enhanced upload server running on port ${port}`);
  console.log(`File size limits: 2GB for requests, 400MB for audio files, 5MB for images`);
  console.log(`Directories created: ${uploadDir}, ${audioDir}, ${coverDir}`);
});