import express, { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from './storage';

// Create necessary directories
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
const audioDir = path.join(process.cwd(), 'public', 'audio');
const coverDir = path.join(process.cwd(), 'public', 'covers');

[uploadDir, audioDir, coverDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
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
  { name: 'track-10', maxCount: 1 },
  { name: 'track-11', maxCount: 1 },
  { name: 'track-12', maxCount: 1 },
  { name: 'track-13', maxCount: 1 },
  { name: 'track-14', maxCount: 1 },
]);

// Create router
const router = Router();

// Diagnostics endpoint to check file upload limits
router.get('/api/diagnostics', (req, res) => {
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

// Generic file upload endpoint
router.post('/api/upload', (req, res) => {
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
router.post('/api/upload/audio', (req, res) => {
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
router.post('/api/upload/cover', (req, res) => {
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

// Album with tracks upload endpoint
router.post('/api/upload/album', (req, res) => {
  albumUpload(req, res, async (err) => {
    if (err) {
      console.error('Album upload error:', err);
      return res.status(400).json({
        success: false,
        message: `Album upload error: ${err.message}`
      });
    }
    
    try {
      let albumData;
      if (req.body.albumData) {
        try {
          albumData = JSON.parse(req.body.albumData);
        } catch (e) {
          console.error('Error parsing album data:', e);
          albumData = {
            title: 'New Album',
            artist: 'Unknown Artist',
            description: ''
          };
        }
      } else {
        albumData = {
          title: req.body.title || 'New Album',
          artist: req.body.artist || 'Unknown Artist',
          description: req.body.description || ''
        };
      }
      
      // Create album in the database
      const album = await storage.createAlbum({
        title: albumData.title,
        artist: albumData.artist,
        description: albumData.description,
        coverUrl: '/covers/default-cover.jpg', // Will be updated after file processing
        releaseDate: new Date(),
        customAlbum: true
      });
      
      console.log('Album created:', album);
      
      // Process cover file if provided
      let coverUrl = '/covers/default-cover.jpg';
      if (req.files && 'cover' in req.files && req.files.cover[0]) {
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
      const tracks = [];
      
      // Find all track fields
      const trackFields = req.files ? Object.keys(req.files)
        .filter(key => key.startsWith('track'))
        .sort() : [];
      
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
        success: true,
        album: {
          id: album.id,
          title: album.title,
          artist: album.artist,
          coverUrl: album.coverUrl,
          description: album.description,
          releaseDate: album.releaseDate,
        },
        trackCount: tracks.length
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

// Adding the route for specific album creation from admin panel
router.post('/api/albums', (req, res) => {
  albumUpload(req, res, async (err) => {
    if (err) {
      console.error('Album upload error from admin:', err);
      return res.status(400).json({
        success: false,
        message: `Album upload error: ${err.message}`
      });
    }
    
    try {
      // Process similarly to the /api/upload/album endpoint
      const { title, artist, description } = req.body;
      
      // Create album in the database
      const album = await storage.createAlbum({
        title: title || 'New Album',
        artist: artist || 'Unknown Artist',
        description: description || '',
        coverUrl: '/covers/default-cover.jpg', // Will be updated after file processing
        releaseDate: new Date(),
        customAlbum: true
      });
      
      console.log('Album created from admin:', album);
      
      // Process cover file if provided
      let coverUrl = '/covers/default-cover.jpg';
      if (req.files && 'cover' in req.files && req.files.cover[0]) {
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
      const tracks = [];
      
      // Find all track fields
      const trackFields = req.files ? Object.keys(req.files)
        .filter(key => key.startsWith('track'))
        .sort() : [];
      
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
        album: {
          id: album.id,
          title: album.title,
          artist: album.artist,
          coverUrl: album.coverUrl,
          description: album.description,
          releaseDate: album.releaseDate,
        },
        trackCount: tracks.length
      });
      
    } catch (error) {
      console.error('Error processing album upload from admin:', error);
      res.status(500).json({
        success: false,
        message: `Error processing album upload: ${error.message}`
      });
    }
  });
});

console.log('💾 High-capacity album upload endpoint registered');

export default router;