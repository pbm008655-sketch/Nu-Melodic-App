import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(express.json({ limit: '2gb' }));
app.use(express.urlencoded({ extended: false, limit: '2gb' }));
app.use(express.static('public'));

// Create the upload directories if they don't exist
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
const audioDir = path.join(process.cwd(), 'public', 'audio');
const coverDir = path.join(process.cwd(), 'public', 'covers');

// Create all necessary directories
[uploadDir, audioDir, coverDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure a simplified upload middleware
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
    fileSize: 400 * 1024 * 1024, // 400MB limit for audio files
  }
}).single('file');

// Simple health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Configure specific upload middlewares
const audioUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, audioDir);
    },
    filename: (req, file, cb) => {
      // Format: track-{albumId}-{trackNumber}.wav
      const { albumId, trackNumber } = req.body;
      const filename = `track-${albumId}-${trackNumber}.wav`;
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: 400 * 1024 * 1024, // 400MB limit for audio files
  },
  fileFilter: (req, file, cb) => {
    // Accept only wav files
    if (file.mimetype === 'audio/wav' || file.originalname.endsWith('.wav')) {
      cb(null, true);
    } else {
      cb(new Error('Only WAV files are allowed'));
    }
  }
}).single('audio');

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
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
}).single('cover');

// Simple upload endpoint (generic)
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

// Album upload with multiple tracks
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
        // We'll rename after getting the album ID
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `temp-cover-${timestamp}${ext}`);
      } else if (file.fieldname.startsWith('track')) {
        // We'll rename after getting the album ID and track number
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
  { name: 'track1', maxCount: 1 },
  { name: 'track2', maxCount: 1 },
  { name: 'track3', maxCount: 1 },
  { name: 'track4', maxCount: 1 },
  { name: 'track5', maxCount: 1 },
  { name: 'track6', maxCount: 1 },
  { name: 'track7', maxCount: 1 },
  { name: 'track8', maxCount: 1 },
  { name: 'track9', maxCount: 1 },
  { name: 'track10', maxCount: 1 },
  // Add more tracks as needed
]);

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
      }
    }
  });
});

// Start server
const port = 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Simple server running on port ${port} with upload functionality`);
});