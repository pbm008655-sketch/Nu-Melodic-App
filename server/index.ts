import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import uploadRouter from './upload-router';

const app = express();
app.use(express.json({ limit: '2gb' }));
app.use(express.urlencoded({ extended: false, limit: '2gb' }));

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
      
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
      
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
        const newFilename = `track-${createdAlbum.id}-${trackNumber}.wav`;
        const oldPath = path.join(audioUploadDir, trackFile.filename);
        const newPath = path.join(audioUploadDir, newFilename);
        
        fs.renameSync(oldPath, newPath);
        
        // Create track in storage
        const trackTitle = req.body[`title-${i}`] || `Track ${trackNumber}`;
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
    } catch (error) {
      console.error("Error in album upload:", error);
      res.status(500).json({
        success: false,
        message: `Upload failed: ${error.message}`,
        error: error.stack
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
