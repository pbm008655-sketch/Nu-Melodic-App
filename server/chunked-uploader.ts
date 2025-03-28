import express from 'express';
import fs from 'fs';
import path from 'path';
import { storage } from './storage';

const router = express.Router();

// Create temp directory for chunks
const tempDir = path.join(process.cwd(), 'public', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Create audio directory if it doesn't exist
const audioDir = path.join(process.cwd(), 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Create covers directory if it doesn't exist
const coverDir = path.join(process.cwd(), 'public', 'covers');
if (!fs.existsSync(coverDir)) {
  fs.mkdirSync(coverDir, { recursive: true });
}

// Initiate a chunked upload
router.post('/api/chunked-upload/init', (req, res) => {
  const { filename, fileSize, fileType } = req.body;
  
  if (!filename || !fileSize) {
    return res.status(400).json({ 
      success: false, 
      message: 'Filename and fileSize are required' 
    });
  }
  
  // Generate a unique upload ID
  const uploadId = Date.now() + '-' + Math.random().toString(36).substring(2, 15);
  const uploadDir = path.join(tempDir, uploadId);
  
  // Create directory for this upload's chunks
  fs.mkdirSync(uploadDir, { recursive: true });
  
  // Store metadata about the upload
  fs.writeFileSync(
    path.join(uploadDir, 'metadata.json'), 
    JSON.stringify({ 
      filename, 
      fileSize, 
      fileType, 
      chunks: 0,
      completed: false 
    })
  );
  
  res.json({ 
    success: true, 
    uploadId, 
    chunkSize: 5 * 1024 * 1024 // 5MB chunks
  });
});

// Upload a chunk
router.post('/api/chunked-upload/chunk', express.raw({ limit: '10mb', type: 'application/octet-stream' }), (req, res) => {
  const uploadId = req.query.uploadId as string;
  const chunkIndex = parseInt(req.query.chunkIndex as string);
  const totalChunks = parseInt(req.query.totalChunks as string);
  
  if (!uploadId || isNaN(chunkIndex)) {
    return res.status(400).json({ 
      success: false, 
      message: 'uploadId and chunkIndex are required' 
    });
  }
  
  const uploadDir = path.join(tempDir, uploadId);
  
  if (!fs.existsSync(uploadDir)) {
    return res.status(404).json({ 
      success: false, 
      message: 'Upload not found' 
    });
  }
  
  const metadataPath = path.join(uploadDir, 'metadata.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  
  // Write the chunk to disk
  const chunkPath = path.join(uploadDir, `chunk-${chunkIndex}`);
  fs.writeFileSync(chunkPath, req.body);
  
  // Update the metadata
  metadata.chunks = Math.max(metadata.chunks, chunkIndex + 1);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata));
  
  // Check if this was the last chunk
  if (metadata.chunks === totalChunks) {
    res.json({ 
      success: true, 
      complete: true,
      message: 'All chunks received'
    });
  } else {
    res.json({ 
      success: true, 
      complete: false,
      chunksReceived: metadata.chunks,
      message: `Chunk ${chunkIndex} received` 
    });
  }
});

// Complete the upload and process the file
router.post('/api/chunked-upload/complete', async (req, res) => {
  const { uploadId, fileType, albumId, trackNumber, isTrack, isCover } = req.body;
  
  if (!uploadId) {
    return res.status(400).json({ 
      success: false, 
      message: 'uploadId is required' 
    });
  }
  
  const uploadDir = path.join(tempDir, uploadId);
  
  if (!fs.existsSync(uploadDir)) {
    return res.status(404).json({ 
      success: false, 
      message: 'Upload not found' 
    });
  }
  
  // Read metadata
  const metadataPath = path.join(uploadDir, 'metadata.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  
  try {
    // Combine all chunks into the final file
    let targetPath = '';
    
    if (isTrack) {
      // For audio tracks - determine file extension based on file type
      const fileExt = path.extname(metadata.filename).toLowerCase();
      const ext = (fileExt === '.mp3' || metadata.fileType === 'audio/mpeg') ? '.mp3' : '.wav';
      const finalFilename = `track-${albumId}-${trackNumber}${ext}`;
      targetPath = path.join(audioDir, finalFilename);
    } else if (isCover) {
      // For album covers
      const ext = path.extname(metadata.filename);
      const finalFilename = `album-${albumId}${ext}`;
      targetPath = path.join(coverDir, finalFilename);
    } else {
      // For other files
      targetPath = path.join(tempDir, metadata.filename);
    }
    
    // Create write stream to final file
    const writeStream = fs.createWriteStream(targetPath);
    
    // Combine chunks in order
    for (let i = 0; i < metadata.chunks; i++) {
      const chunkPath = path.join(uploadDir, `chunk-${i}`);
      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
    }
    
    writeStream.end();
    
    // Wait for stream to finish
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    
    // Update metadata to mark as completed
    metadata.completed = true;
    fs.writeFileSync(metadataPath, JSON.stringify(metadata));
    
    // Generate the appropriate URL based on file type
    let fileUrl = '';
    if (isTrack) {
      const fileExt = path.extname(metadata.filename).toLowerCase();
      const ext = (fileExt === '.mp3' || metadata.fileType === 'audio/mpeg') ? '.mp3' : '.wav';
      fileUrl = `/audio/track-${albumId}-${trackNumber}${ext}`;
    } else if (isCover) {
      const ext = path.extname(metadata.filename);
      fileUrl = `/covers/album-${albumId}${ext}`;
    }
    
    res.json({ 
      success: true, 
      message: 'File reassembled successfully',
      fileUrl: fileUrl,
      fileSize: metadata.fileSize
    });
    
    // Clean up chunks after successful completion (can be done asynchronously)
    for (let i = 0; i < metadata.chunks; i++) {
      const chunkPath = path.join(uploadDir, `chunk-${i}`);
      fs.unlinkSync(chunkPath);
    }
    fs.unlinkSync(metadataPath);
    fs.rmdirSync(uploadDir);
    
  } catch (error: any) {
    console.error('Error completing upload:', error);
    res.status(500).json({ 
      success: false, 
      message: `Error completing upload: ${error.message}` 
    });
  }
});

// API to create an album with tracks that were uploaded via the chunked uploader
router.post('/api/chunked-upload/create-album', async (req, res) => {
  try {
    const { title, artist, description, coverUrl, trackInfo } = req.body;
    
    if (!title || !artist || !Array.isArray(trackInfo) || trackInfo.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required album information"
      });
    }
    
    // Create the album
    const album = await storage.createAlbum({
      title,
      artist,
      description: description || "",
      coverUrl: coverUrl || "/covers/default-cover.jpg",
      releaseDate: new Date(),
      customAlbum: true
    });
    
    // Create the tracks
    const tracks = [];
    for (const track of trackInfo) {
      const { title: trackTitle, audioUrl, trackNumber } = track;
      
      if (!trackTitle || !audioUrl) {
        continue;
      }
      
      const newTrack = await storage.createTrack({
        albumId: album.id,
        title: trackTitle,
        trackNumber: trackNumber || tracks.length + 1,
        duration: 180, // Default duration
        audioUrl,
        isFeatured: false
      });
      
      tracks.push(newTrack);
    }
    
    res.status(200).json({
      success: true,
      album,
      tracks,
      message: `Album "${title}" created with ${tracks.length} tracks`
    });
    
  } catch (error: any) {
    console.error('Error creating album:', error);
    res.status(500).json({
      success: false,
      message: `Error creating album: ${error.message}`
    });
  }
});

console.log('📦 Chunked file uploader registered');

export default router;