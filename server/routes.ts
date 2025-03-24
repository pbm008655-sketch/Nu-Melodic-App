import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { importPersonalTracks } from "./add-personal-tracks";
import { insertPlaylistSchema, insertTrackPlaySchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import fs from "fs";
import path from "path";

// Define common directory paths
const audioUploadDir = path.join(process.cwd(), 'public', 'audio');
const coverUploadDir = path.join(process.cwd(), 'public', 'covers');

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Add specific route for audio files with proper headers
  // This endpoint does NOT require authentication to allow for direct audio streaming
  app.get('/audio/:filename', (req, res) => {
    const audioFilePath = path.join(process.cwd(), 'public', 'audio', req.params.filename);
    
    // Check if file exists
    if (!fs.existsSync(audioFilePath)) {
      console.error(`Audio file not found: ${audioFilePath}`);
      return res.status(404).send('Audio file not found');
    }
    
    // Log access for debugging
    console.log(`Audio file accessed: ${req.params.filename}, file size: ${fs.statSync(audioFilePath).size} bytes`);
    
    // Set appropriate headers for browser compatibility
    res.set({
      'Content-Type': 'audio/wav',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Use simple file streaming for maximum compatibility
    fs.createReadStream(audioFilePath).pipe(res);
  });
  
  // For testing: simple audio test endpoint that delivers a static file
  app.get('/test-audio', (req, res) => {
    const testFilePath = path.join(process.cwd(), 'public', 'audio', 'track-6-1.wav');
    
    if (!fs.existsSync(testFilePath)) {
      console.error(`Test audio file not found: ${testFilePath}`);
      return res.status(404).send('Test audio file not found');
    }
    
    // Log access for debugging
    console.log(`Test audio endpoint accessed, file size: ${fs.statSync(testFilePath).size} bytes`);
    
    // Set appropriate headers for browser compatibility
    res.set({
      'Content-Type': 'audio/wav',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Use simple file streaming for maximum compatibility
    fs.createReadStream(testFilePath).pipe(res);
  });

  // Get all albums
  app.get("/api/albums", async (_req, res) => {
    const albums = await storage.getAllAlbums();
    
    // Log all album IDs to help with debugging
    console.log("All album IDs:", albums.map(a => a.id));
    
    res.json(albums);
  });
  
  // Get all sample albums (for debugging)
  app.get("/api/sample-albums", async (_req, res) => {
    const allAlbums = await storage.getAllAlbums();
    // Find albums that contain "Sample" in the title
    const sampleAlbums = allAlbums.filter(album => album.title.includes("Sample"));
    
    console.log("Sample albums found:", sampleAlbums.length);
    
    res.json(sampleAlbums);
  });

  // Get a specific album with its tracks
  app.get("/api/albums/:id", async (req, res) => {
    const albumId = parseInt(req.params.id);
    if (isNaN(albumId)) {
      return res.status(400).json({ message: "Invalid album ID" });
    }

    const album = await storage.getAlbum(albumId);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    const tracks = await storage.getTracksByAlbumId(albumId);
    res.json({ album, tracks });
  });

  // Get featured albums
  app.get("/api/featured-albums", async (_req, res) => {
    const featuredAlbums = await storage.getFeaturedAlbums();
    res.json(featuredAlbums);
  });

  // Get recently added albums
  app.get("/api/recent-albums", async (_req, res) => {
    const recentAlbums = await storage.getRecentAlbums(10); // Increased limit to 10
    
    // Verify in logs that we're getting the expected albums
    console.log(`Recent albums count: ${recentAlbums.length}`);
    
    res.json(recentAlbums);
  });

  // Get track details with album information for audio mixer (authenticated version)
  app.get("/api/tracks/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const trackId = parseInt(req.params.id);
    if (isNaN(trackId)) {
      return res.status(400).json({ message: "Invalid track ID" });
    }

    const track = await storage.getTrack(trackId);
    if (!track) {
      return res.status(404).json({ message: "Track not found" });
    }

    // Get the album info for this track
    const album = await storage.getAlbum(track.albumId);
    
    // Return in a format suitable for the mixer
    res.json({ track, album });
  });
  
  // Public version of track API that doesn't require authentication (for mixer)
  app.get("/api/track/:id", async (req, res) => {
    const trackId = parseInt(req.params.id);
    if (isNaN(trackId)) {
      return res.status(400).json({ message: "Invalid track ID" });
    }

    const track = await storage.getTrack(trackId);
    if (!track) {
      return res.status(404).json({ message: "Track not found" });
    }

    // Get the album info for this track
    const album = await storage.getAlbum(track.albumId);
    
    // Log access for debugging
    console.log(`Public track API accessed for track ${trackId} (${track.title})`);
    
    // Return in a format suitable for the mixer
    res.json({ track, album });
  });

  // Get featured tracks
  app.get("/api/featured-tracks", async (_req, res) => {
    const featuredTracks = await storage.getFeaturedTracks();
    const tracksWithAlbums = await Promise.all(
      featuredTracks.map(async (track) => {
        const album = await storage.getAlbum(track.albumId);
        return { ...track, album };
      })
    );
    res.json(tracksWithAlbums);
  });

  // PLAYLIST ROUTES - Protected Routes
  // Get user's playlists
  app.get("/api/playlists", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const playlists = await storage.getUserPlaylists(req.user!.id);
    res.json(playlists);
  });

  // Get a specific playlist with its tracks
  app.get("/api/playlists/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const playlistId = parseInt(req.params.id);
    if (isNaN(playlistId)) {
      return res.status(400).json({ message: "Invalid playlist ID" });
    }

    const playlist = await storage.getPlaylist(playlistId);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // Check if the playlist belongs to the user
    if (playlist.userId !== req.user!.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const tracks = await storage.getPlaylistTracks(playlistId);
    const tracksWithAlbums = await Promise.all(
      tracks.map(async (track) => {
        const album = await storage.getAlbum(track.albumId);
        return { ...track, album };
      })
    );
    
    res.json({ playlist, tracks: tracksWithAlbums });
  });

  // Create a new playlist
  app.post("/api/playlists", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const playlistData = insertPlaylistSchema.parse(req.body);
      const playlist = await storage.createPlaylist({
        ...playlistData,
        userId: req.user!.id,
      });
      res.status(201).json(playlist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid playlist data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Delete a playlist
  app.delete("/api/playlists/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const playlistId = parseInt(req.params.id);
    if (isNaN(playlistId)) {
      return res.status(400).json({ message: "Invalid playlist ID" });
    }

    const playlist = await storage.getPlaylist(playlistId);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // Check if the playlist belongs to the user
    if (playlist.userId !== req.user!.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const success = await storage.deletePlaylist(playlistId);
    if (success) {
      res.sendStatus(204);
    } else {
      res.status(500).json({ message: "Failed to delete playlist" });
    }
  });

  // Add a track to a playlist
  app.post("/api/playlists/:id/tracks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const playlistId = parseInt(req.params.id);
    if (isNaN(playlistId)) {
      return res.status(400).json({ message: "Invalid playlist ID" });
    }

    const trackId = parseInt(req.body.trackId);
    if (isNaN(trackId)) {
      return res.status(400).json({ message: "Invalid track ID" });
    }

    const playlist = await storage.getPlaylist(playlistId);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // Check if the playlist belongs to the user
    if (playlist.userId !== req.user!.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get the current track count to determine position
    const tracks = await storage.getPlaylistTracks(playlistId);
    const position = tracks.length;

    // Add track to playlist
    try {
      const playlistTrack = await storage.addTrackToPlaylist(playlistId, trackId, position);
      res.status(201).json(playlistTrack);
    } catch (error) {
      res.status(500).json({ message: "Failed to add track to playlist" });
    }
  });

  // Remove a track from a playlist
  app.delete("/api/playlists/:playlistId/tracks/:trackId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const playlistId = parseInt(req.params.playlistId);
    const trackId = parseInt(req.params.trackId);
    
    if (isNaN(playlistId) || isNaN(trackId)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const playlist = await storage.getPlaylist(playlistId);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // Check if the playlist belongs to the user
    if (playlist.userId !== req.user!.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const success = await storage.removeTrackFromPlaylist(playlistId, trackId);
    if (success) {
      res.sendStatus(204);
    } else {
      res.status(404).json({ message: "Track not found in playlist" });
    }
  });

  // SUBSCRIPTION ROUTES
  app.post("/api/subscribe", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Validate subscription data
      const { plan } = req.body;
      if (plan !== "premium") {
        return res.status(400).json({ message: "Invalid subscription plan" });
      }

      // In a real app, this would handle payment processing
      // For this demo, we'll just update the user's premium status
      
      // Set premium expiry to 30 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      const updatedUser = await storage.updateUserPremiumStatus(req.user!.id, true, expiryDate);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Exclude password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Subscription failed" });
    }
  });

  // Cancel subscription
  app.post("/api/cancel-subscription", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const updatedUser = await storage.updateUserPremiumStatus(req.user!.id, false);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Exclude password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // ANALYTICS ROUTES
  // Record a track play - simplified for better reliability
  app.post("/api/analytics/track-play", async (req, res) => {
    // Authentication check
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized: User must be logged in to record track plays" });
    }

    try {
      console.log("Track play request body:", req.body);
      
      // Simple validation first
      if (!req.body || req.body.trackId === undefined || req.body.trackId === null) {
        return res.status(400).json({ message: "Missing trackId in request body" });
      }
      
      // Convert to number if needed
      let trackId: number;
      if (typeof req.body.trackId === 'string') {
        trackId = parseInt(req.body.trackId, 10);
        if (isNaN(trackId)) {
          return res.status(400).json({ message: "trackId must be a valid number" });
        }
      } else if (typeof req.body.trackId === 'number') {
        trackId = req.body.trackId;
      } else {
        return res.status(400).json({ message: "trackId must be a number or string containing a number" });
      }
      
      // Check if track exists
      const track = await storage.getTrack(trackId);
      if (!track) {
        console.log(`Track with ID ${trackId} not found when recording play`);
        return res.status(404).json({ message: `Track with ID ${trackId} not found` });
      }
      
      // Record the play using the authenticated user
      const trackPlay = await storage.recordTrackPlay(req.user!.id, trackId);
      console.log(`Successfully recorded play of track ${trackId} by user ${req.user!.id}`);
      return res.status(201).json(trackPlay);
        
    } catch (error) {
      console.error("Error recording track play:", error);
      return res.status(500).json({ 
        message: "Server error while recording track play",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get play count for a specific track
  app.get("/api/analytics/tracks/:id/plays", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const trackId = parseInt(req.params.id);
    if (isNaN(trackId)) {
      return res.status(400).json({ message: "Invalid track ID" });
    }

    const plays = await storage.getTrackPlays(trackId);
    res.json({ trackId, plays });
  });

  // Get top tracks by play count
  app.get("/api/analytics/top-tracks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const topTracks = await storage.getTopTracks(limit);
    
    // Enhance with album information
    const topTracksWithAlbums = await Promise.all(
      topTracks.map(async ({ track, plays }) => {
        const album = await storage.getAlbum(track.albumId);
        return { track, album, plays };
      })
    );
    
    res.json(topTracksWithAlbums);
  });

  // Get play count for a specific album
  app.get("/api/analytics/albums/:id/plays", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const albumId = parseInt(req.params.id);
    if (isNaN(albumId)) {
      return res.status(400).json({ message: "Invalid album ID" });
    }

    const album = await storage.getAlbum(albumId);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    const plays = await storage.getTrackPlaysByAlbum(albumId);
    res.json({ album, ...plays });
  });

  // Get plays by time range (for charts/graphs)
  app.get("/api/analytics/plays-by-date", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Default to last 30 days if no dates provided
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Override with query params if provided
    if (req.query.startDate) {
      startDate.setTime(Date.parse(req.query.startDate as string));
    }
    if (req.query.endDate) {
      endDate.setTime(Date.parse(req.query.endDate as string));
    }

    const playsByDate = await storage.getPlaysByTimeRange(startDate, endDate);
    res.json({ startDate, endDate, data: playsByDate });
  });

  // Get user's listening history (for personalized recommendations)
  app.get("/api/analytics/listening-history", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const history = await storage.getUserListeningHistory(req.user!.id, limit);
    res.json(history);
  });
  
  // ADMIN ROUTES - For adding personal albums and tracks
  app.post("/api/admin/add-album", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Only allow admin users to add albums
    // In a real app, you would check for admin role
    // For this demo, we'll just check if the user is the demo user
    if (req.user!.id !== 1) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      const { title, artist, coverUrl, description } = req.body;
      
      // Validate required fields
      if (!title || !artist) {
        return res.status(400).json({ message: "Title and artist are required" });
      }
      
      const album = await storage.createAlbum({
        title,
        artist,
        coverUrl: coverUrl || "",
        description: description || "",
        releaseDate: new Date(),
        customAlbum: null
      });
      
      res.status(201).json(album);
    } catch (error) {
      res.status(500).json({ message: "Failed to create album" });
    }
  });
  
  app.post("/api/admin/add-track", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Only allow admin users to add tracks
    if (req.user!.id !== 1) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      const { title, albumId, trackNumber, duration, audioUrl, isFeatured = false } = req.body;
      
      // Validate required fields
      if (!title || !albumId || !trackNumber || !audioUrl) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if album exists
      const album = await storage.getAlbum(albumId);
      if (!album) {
        return res.status(404).json({ message: "Album not found" });
      }
      
      const track = await storage.createTrack({
        title,
        albumId,
        trackNumber,
        duration: duration || 180,
        audioUrl,
        isFeatured
      });
      
      res.status(201).json(track);
    } catch (error) {
      res.status(500).json({ message: "Failed to create track" });
    }
  });
  
  // Use imported personal tracks function
  
  // Make sure the directories exist
  if (!fs.existsSync(audioUploadDir)) {
    fs.mkdirSync(audioUploadDir, { recursive: true });
  }
  
  if (!fs.existsSync(coverUploadDir)) {
    fs.mkdirSync(coverUploadDir, { recursive: true });
  }
  
  // Storage for audio files
  const audioStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, audioUploadDir);
    },
    filename: function (req, file, cb) {
      // Rename files to match the expected pattern for importPersonalTracks
      // Create a timestamp-based unique identifier
      const timestamp = Date.now();
      const uniqueId = Math.floor(Math.random() * 1000);
      // Format: my-track-{timestamp}-{position}.wav
      const filename = `my-track-${timestamp}-${uniqueId}${path.extname(file.originalname)}`;
      cb(null, filename);
    }
  });
  
  // Storage for cover images
  const coverStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, coverUploadDir);
    },
    filename: function (req, file, cb) {
      // Create a timestamp-based unique identifier
      const timestamp = Date.now();
      const uniqueId = Math.floor(Math.random() * 1000);
      // Format: album-cover-{timestamp}-{uniqueId}.{ext}
      const filename = `album-cover-${timestamp}-${uniqueId}${path.extname(file.originalname)}`;
      cb(null, filename);
    }
  });
  
  // Audio upload configuration
  const upload = multer({ 
    storage: audioStorage,
    fileFilter: function(req, file, cb) {
      // Accept only WAV files
      if (file.mimetype !== 'audio/wav' && !file.originalname.endsWith('.wav')) {
        return cb(new Error('Only WAV files are allowed'));
      }
      cb(null, true);
    },
    limits: {
      fileSize: 200 * 1024 * 1024 // 200MB limit for larger audio files
    }
  });
  
  // Cover image upload configuration
  const uploadCover = multer({
    storage: coverStorage,
    fileFilter: function(req, file, cb) {
      // Accept only image files
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'));
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });
  
  // Special multer configuration just for the album creation endpoint
  const albumUpload = multer({
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
      if (file.fieldname.startsWith('track-') && (file.mimetype !== 'audio/wav' && !file.originalname.endsWith('.wav'))) {
        return cb(new Error('Only WAV files are allowed for tracks'));
      }
      // Accept image files from the cover field
      if (file.fieldname === 'cover' && !file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed for cover'));
      }
      cb(null, true);
    },
    limits: {
      fileSize: 200 * 1024 * 1024 // 200MB limit for larger audio files
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
    { name: 'track-9', maxCount: 1 }
  ]);

  // Album creation endpoint - matches client-side expectation
  app.post('/api/albums', albumUpload, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      console.log("Album creation request body keys:", Object.keys(req.body));
      console.log("Album creation request files:", req.files ? Object.keys(req.files) : "No files");
      
      // Extract album data from request body
      const { title, artist, description, releaseDate } = req.body;
      let { coverUrl } = req.body;
      
      // Validate required fields
      if (!title || !artist) {
        return res.status(400).json({ message: "Title and artist are required" });
      }
      
      // Process cover file if uploaded
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      
      if (files && files['cover'] && files['cover'].length > 0) {
        const coverFile = files['cover'][0];
        // Generate cover URL
        coverUrl = `/covers/${coverFile.filename}`;
        console.log(`Using uploaded cover image: ${coverUrl}`);
      }
      // Process base64 cover image if provided
      else if (req.body.cover && typeof req.body.cover === 'string' && req.body.cover.startsWith('data:image')) {
        try {
          // Extract the base64 data
          const base64Data = req.body.cover.split(';base64,').pop();
          const imageBuffer = Buffer.from(base64Data, 'base64');
          
          // Generate a unique filename
          const timestamp = Date.now();
          const imageExt = '.jpg'; // Default to jpg
          const filename = `cover-${timestamp}${imageExt}`;
          const imagePath = path.join(coverUploadDir, filename);
          
          // Write the file
          fs.writeFileSync(imagePath, imageBuffer);
          coverUrl = `/covers/${filename}`;
          console.log(`Saved cover image to: ${imagePath}`);
        } catch (error) {
          console.error('Error processing base64 image:', error);
        }
      }
      
      // Create the album
      const album = await storage.createAlbum({
        title,
        artist,
        description: description || "",
        releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
        coverUrl: coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
        customAlbum: null
      });
      
      // Process track files if any were uploaded
      if (files) {
        const trackFiles: Array<{ index: number, file: Express.Multer.File }> = [];
        
        // Collect all track files from the request
        for (let i = 0; i < 10; i++) {
          const fieldName = `track-${i}`;
          if (files[fieldName] && files[fieldName].length > 0) {
            trackFiles.push({ index: i, file: files[fieldName][0] });
          }
        }
        
        // Process each track file
        if (trackFiles.length > 0) {
          console.log(`Processing ${trackFiles.length} track files for album ${album.id}`);
          
          for (const { index, file } of trackFiles) {
            const trackNumber = parseInt(req.body[`trackNumber-${index}`]) || index + 1;
            
            // Generate a filename based on album ID and track number
            const filename = `track-${album.id}-${trackNumber}.wav`;
            const filePath = path.join(audioUploadDir, filename);
            
            // Rename the uploaded file if needed
            if (file.path !== filePath) {
              fs.renameSync(file.path, filePath);
            }
            
            // Extract track title from request body or use defaults
            let trackTitle = req.body[`trackTitle-${index}`];
            if (!trackTitle && file.originalname) {
              // Extract title from filename (remove extension and clean up)
              trackTitle = file.originalname.replace(/\.wav$/i, '').replace(/_/g, ' ');
            }
            if (!trackTitle) {
              trackTitle = `Track ${trackNumber}`;
            }
            
            console.log(`Creating track ${trackNumber}: ${trackTitle} for album ${album.id}`);
            
            // Create the track in storage
            await storage.createTrack({
              title: trackTitle,
              albumId: album.id,
              trackNumber,
              duration: 180, // Default duration
              audioUrl: `/audio/${filename}`,
              isFeatured: false
            });
          }
        }
      }
      
      res.status(200).json(album);
    } catch (error) {
      console.error("Error creating album:", error);
      res.status(500).json({ 
        message: "Failed to create album", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Album import endpoint
  app.post('/api/albums/import', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { title, artist, description } = req.body;
      
      // Validate required fields
      if (!title || !artist) {
        return res.status(400).json({ message: "Title and artist are required" });
      }
      
      // Import personal tracks
      const result = await importPersonalTracks({
        customAlbum: {
          title,
          artist,
          description: description || "",
        }
      });
      
      res.status(200).json({ album: result.album, trackCount: result.tracks.length });
    } catch (error) {
      console.error("Error importing personal tracks:", error);
      res.status(500).json({ message: "Failed to import tracks" });
    }
  });
  
  // Handle file uploads (legacy endpoint)
  app.post('/api/admin/upload-tracks', upload.array('tracks', 10), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Only allow admin users to upload tracks
    if (req.user!.id !== 1) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      
      // Return the list of uploaded files
      const uploadedFiles = files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        size: file.size
      }));
      
      // Log uploaded files for debugging
      console.log(`Successfully uploaded ${files.length} files:`, uploadedFiles);
      
      // Add the uploaded files to the featured tracks list for better visibility
      try {
        const lastUploadedFile = files[files.length - 1];
        if (lastUploadedFile) {
          // Find the album name from the filename pattern (if possible)
          const fileMatch = lastUploadedFile.filename.match(/my-track-(\d+)/);
          const uniqueId = fileMatch ? fileMatch[1] : Date.now().toString();
          
          // Add to track-plays to ensure it shows up in analytics
          if (req.user) {
            storage.recordTrackPlay(req.user.id, 1);
          }
        }
      } catch (e) {
        console.error("Error processing uploaded file:", e);
      }
      
      res.status(201).json({ 
        message: `Successfully uploaded ${files.length} files`,
        files: uploadedFiles
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });
  
  // Endpoint to import personal tracks (WAV files)
  app.post("/api/admin/import-personal-tracks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Only allow admin users to import tracks
    if (req.user!.id !== 1) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      const { albumTitle, albumArtist, albumDescription, albumCoverUrl } = req.body;
      
      // Import tracks with custom album details if provided
      const customAlbum = albumTitle ? {
        title: albumTitle,
        artist: albumArtist || "Demo Artist",
        description: albumDescription || "",
        coverUrl: albumCoverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
        // Store the custom album info in the customAlbum field as a JSON string
        customAlbum: JSON.stringify({
          title: albumTitle,
          artist: albumArtist || "Demo Artist",
          description: albumDescription || "A collection of imported tracks",
          coverUrl: albumCoverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80"
        })
      } : undefined;
      
      console.log("Starting import of personal tracks with custom album:", customAlbum);
      
      const result = await importPersonalTracks({
        customAlbum
      });
      
      // Mark first track as featured to ensure it appears on the homepage
      if (result.tracks.length > 0) {
        const firstTrack = result.tracks[0];
        try {
          // Update track to be featured
          await storage.createTrack({
            ...firstTrack,
            isFeatured: true
          });
          console.log(`Updated track ${firstTrack.id} to be featured`);
        } catch (e) {
          console.error("Error updating track as featured:", e);
        }
      }
      
      // If no tracks were created, return a more specific message
      if (result.tracks.length === 0) {
        return res.status(400).json({ 
          message: "No tracks were imported. Please ensure WAV files exist in public/audio with names like my-track-1.wav",
          album: result.album
        });
      }
      
      res.status(201).json({ 
        message: `Successfully imported ${result.tracks.length} tracks`,
        album: result.album,
        tracks: result.tracks
      });
    } catch (error) {
      console.error("Error importing personal tracks:", error);
      res.status(500).json({ message: "Failed to import personal tracks" });
    }
  });

  // Handle album cover uploads
  app.post('/api/admin/upload-cover', uploadCover.single('cover'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Only allow admin users to upload covers
    if (req.user!.id !== 1) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      const file = req.file as Express.Multer.File;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Generate the URL path for the uploaded cover
      const coverUrl = `/covers/${file.filename}`;
      
      // Log uploaded file for debugging
      console.log(`Successfully uploaded album cover:`, {
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        coverUrl
      });
      
      res.status(201).json({ 
        message: "Successfully uploaded album cover",
        coverUrl: coverUrl,
        filename: file.filename,
        originalname: file.originalname,
        size: file.size
      });
    } catch (error) {
      console.error('Error uploading album cover:', error);
      res.status(500).json({ message: "Failed to upload album cover" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
