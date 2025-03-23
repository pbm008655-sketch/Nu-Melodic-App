import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { importPersonalTracks } from "./add-personal-tracks";
import { insertPlaylistSchema, insertTrackPlaySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

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

  // Get track details
  app.get("/api/tracks/:id", async (req, res) => {
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
    res.json({ ...track, album });
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
  // Record a track play
  app.post("/api/analytics/track-play", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const data = insertTrackPlaySchema.parse(req.body);
      // Override userId with the authenticated user's ID for security
      const trackPlay = await storage.recordTrackPlay(req.user!.id, data.trackId);
      res.status(201).json(trackPlay);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
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
        releaseDate: new Date()
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
        coverUrl: albumCoverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80"
      } : undefined;
      
      const result = await importPersonalTracks(customAlbum);
      
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

  const httpServer = createServer(app);
  return httpServer;
}
