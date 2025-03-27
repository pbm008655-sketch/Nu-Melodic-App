import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from './storage';

// Create the upload directories if they don't exist
const audioUploadDir = path.join(process.cwd(), 'public', 'audio');
const coverUploadDir = path.join(process.cwd(), 'public', 'covers');

if (!fs.existsSync(audioUploadDir)) {
  fs.mkdirSync(audioUploadDir, { recursive: true });
}

if (!fs.existsSync(coverUploadDir)) {
  fs.mkdirSync(coverUploadDir, { recursive: true });
}

// Configure high-capacity upload middleware for album uploads
const highCapacityUpload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      // Send track files to audio directory and cover files to cover directory
      if (file.fieldname.startsWith('track-')) {
        cb(null, audioUploadDir);
      } else if (file.fieldname === 'cover') {
        cb(null, coverUploadDir);
      } else {
        cb(new Error(`Unknown field type: ${file.fieldname}`), '');
      }
    },
    filename: function(req, file, cb) {
      if (file.fieldname.startsWith('track-')) {
        // Tracks will be renamed later in the request handler once we have the album ID
        const timestamp = Date.now();
        const uniqueId = Math.floor(Math.random() * 1000);
        const filename = `temp-track-${timestamp}-${uniqueId}${path.extname(file.originalname)}`;
        cb(null, filename);
      } else if (file.fieldname === 'cover') {
        // Create a unique filename for the cover image
        const timestamp = Date.now();
        const filename = `cover-${timestamp}${path.extname(file.originalname)}`;
        cb(null, filename);
      } else {
        cb(new Error(`Unknown field type: ${file.fieldname}`), '');
      }
    }
  }),
  fileFilter: function(req, file, cb) {
    // Accept wav files from the track fields
    if (file.fieldname.startsWith('track-')) {
      if (file.mimetype !== 'audio/wav' && !file.originalname.endsWith('.wav')) {
        return cb(new Error('Only WAV files are allowed for tracks'));
      }
    }
    // Accept image files from the cover field
    else if (file.fieldname === 'cover') {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed for cover'));
      }
    }
    cb(null, true);
  },
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB limit
    fieldSize: 2 * 1024 * 1024 * 1024, // 2GB field size limit
    files: 20, // Maximum 20 files
    fields: 100, // Maximum 100 fields
    parts: 1200 // Maximum 1200 parts (headers + files)
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

// Create a router to handle album uploads
const router = express.Router();

router.post('/api/high-capacity-album-upload', highCapacityUpload, async (req, res) => {
  try {
    console.log("High-capacity album upload received");
    console.log("Body keys:", Object.keys(req.body));
    console.log("Files:", req.files ? Object.keys(req.files) : "No files");
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    
    const { title, artist } = req.body;
    if (!title || !artist) {
      return res.status(400).json({
        success: false,
        message: "Album title and artist are required"
      });
    }
    
    // Type assertion for multer files 
    const files = req.files as Record<string, Express.Multer.File[]> || {};
    const trackFiles = Object.entries(files)
      .filter(([key]) => key.startsWith('track-'))
      .sort((a, b) => {
        const numA = parseInt(a[0].split('-')[1]);
        const numB = parseInt(b[0].split('-')[1]);
        return numA - numB;
      })
      .map(([_, files]) => files[0]);
    
    if (trackFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one track is required"
      });
    }
    
    // Create album
    let coverUrl = '';
    if (files['cover'] && files['cover'].length > 0) {
      coverUrl = `/covers/${files['cover'][0].filename}`;
    }
    
    console.log("Creating album in storage...");
    const createdAlbum = await storage.createAlbum({
      title,
      artist,
      coverUrl,
      releaseDate: new Date(),
      description: null,
      customAlbum: null
    });
    
    console.log("Album created:", createdAlbum);
    
    // Rename and save track files
    const createdTracks = [];
    for (let i = 0; i < trackFiles.length; i++) {
      const trackFile = trackFiles[i];
      const trackNumber = i + 1;
      
      // Rename the track to follow our naming convention
      const newFilename = `track-${createdAlbum.id}-${trackNumber}.wav`;
      const oldPath = path.join(audioUploadDir, trackFile.filename);
      const newPath = path.join(audioUploadDir, newFilename);
      
      console.log(`Renaming track ${i+1} from ${trackFile.filename} to ${newFilename}`);
      fs.renameSync(oldPath, newPath);
      
      // Create track in storage
      const trackTitle = req.body[`title-${i}`] || `Track ${trackNumber}`;
      const trackUrl = `/audio/${newFilename}`;
      
      const createdTrack = await storage.createTrack({
        albumId: createdAlbum.id,
        title: trackTitle,
        trackNumber: trackNumber,
        duration: 180, // We don't know actual duration without audio analysis
        audioUrl: trackUrl,
        isFeatured: false
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
    console.error("Error in high-capacity upload:", error);
    res.status(500).json({
      success: false,
      message: `Upload failed: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.stack : String(error)
    });
  }
});

export default router;