import { albums, tracks, playlists, playlistTracks, users, trackPlays, type User, type InsertUser, type Album, type Track, type Playlist, type PlaylistTrack, type TrackPlay } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPremiumStatus(userId: number, isPremium: boolean, expiryDate?: Date): Promise<User | undefined>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User | undefined>;
  updateStripeInfo(userId: number, data: { stripeCustomerId?: string, stripeSubscriptionId?: string }): Promise<User | undefined>;
  
  getAllAlbums(): Promise<Album[]>;
  getAlbum(id: number): Promise<Album | undefined>;
  getFeaturedAlbums(limit?: number): Promise<Album[]>;
  getRecentAlbums(limit?: number): Promise<Album[]>;
  createAlbum(album: Omit<Album, 'id'>): Promise<Album>;
  
  getAllTracks(): Promise<Track[]>;
  getTrack(id: number): Promise<Track | undefined>;
  getTracksByAlbumId(albumId: number): Promise<Track[]>;
  getFeaturedTracks(limit?: number): Promise<Track[]>;
  createTrack(track: Omit<Track, 'id'>): Promise<Track>;
  
  getUserPlaylists(userId: number): Promise<Playlist[]>;
  getPlaylist(id: number): Promise<Playlist | undefined>;
  createPlaylist(playlist: Partial<Playlist>): Promise<Playlist>;
  deletePlaylist(id: number): Promise<boolean>;
  
  getPlaylistTracks(playlistId: number): Promise<Track[]>;
  addTrackToPlaylist(playlistId: number, trackId: number, position: number): Promise<PlaylistTrack>;
  removeTrackFromPlaylist(playlistId: number, trackId: number): Promise<boolean>;
  
  // Analytics related methods
  recordTrackPlay(userId: number, trackId: number): Promise<TrackPlay>;
  getTrackPlays(trackId: number): Promise<number>;
  getTopTracks(limit?: number): Promise<{track: Track; plays: number}[]>;
  getTrackPlaysByAlbum(albumId: number): Promise<{albumId: number; plays: number}>;
  getPlaysByTimeRange(startDate: Date, endDate: Date): Promise<{date: string; plays: number}[]>;
  getUserListeningHistory(userId: number, limit?: number): Promise<{track: Track; album: Album; playedAt: Date}[]>;
  
  sessionStore: any; // Type for session store
}

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private albums: Map<number, Album>;
  private tracks: Map<number, Track>;
  private playlists: Map<number, Playlist>;
  private playlistTracks: Map<number, PlaylistTrack>;
  private trackPlays: Map<number, TrackPlay>;
  
  userId: number;
  albumId: number;
  trackId: number;
  playlistId: number;
  playlistTrackId: number;
  trackPlayId: number;
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.albums = new Map();
    this.tracks = new Map();
    this.playlists = new Map();
    this.playlistTracks = new Map();
    this.trackPlays = new Map();
    
    this.userId = 1;
    this.albumId = 1;
    this.trackId = 1;
    this.playlistId = 1;
    this.playlistTrackId = 1;
    this.trackPlayId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Seed with some initial data
    this.seedData();
  }

  private async seedData() {
    // Create a demo user with a known password for testing
    const demoUser: User = {
      id: this.userId++,
      username: "demo",
      email: "demo@example.com",
      password: "$2b$10$dXNmcGZHaGJsZHVqaGtraUlnTnZyNDMrcy5lOU9Va2lITU56VUZRRmZlbFhsZFFpMXM5dGVCc1RKMkNhTVowamVybnRsMw==.7177bfdf1ec70da0ea9b3585649a08f2", // password is "password"
      isPremium: false,
      premiumExpiry: null,
    };
    this.users.set(demoUser.id, demoUser);
    
    // Create sample albums
    const album1: Album = {
      id: this.albumId++,
      title: "Midnight Memories",
      artist: "MeloStream Artist",
      coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
      description: "An immersive journey through late night soundscapes",
      releaseDate: new Date("2023-05-15"),
      customAlbum: null,
    };
    
    const album2: Album = {
      id: this.albumId++,
      title: "Urban Echoes",
      artist: "MeloStream Artist",
      coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
      description: "Electronic fusion with urban influences",
      releaseDate: new Date("2023-08-20"),
      customAlbum: null,
    };
    
    const album3: Album = {
      id: this.albumId++,
      title: "Sound Waves",
      artist: "MeloStream Artist",
      coverUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
      description: "Ambient collection for relaxation",
      releaseDate: new Date("2023-02-10"),
      customAlbum: null,
    };
    
    const album4: Album = {
      id: this.albumId++,
      title: "Neon Nights",
      artist: "MeloStream Artist",
      coverUrl: "https://images.unsplash.com/photo-1593697972672-b1c1356e32f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
      description: "Synthwave inspired by 80s nostalgia",
      releaseDate: new Date("2023-09-05"),
      customAlbum: null,
    };
    
    const album5: Album = {
      id: this.albumId++,
      title: "Acoustic Dreams",
      artist: "MeloStream Artist",
      coverUrl: "https://images.unsplash.com/photo-1602848597941-0d3f3415bfa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
      description: "Peaceful instrumental acoustic melodies",
      releaseDate: new Date("2023-06-30"),
      customAlbum: null,
    };
    
    this.albums.set(album1.id, album1);
    this.albums.set(album2.id, album2);
    this.albums.set(album3.id, album3);
    this.albums.set(album4.id, album4);
    this.albums.set(album5.id, album5);
    
    // Create sample tracks
    const createTracks = (albumId: number, count: number, featured = false) => {
      const tracks: Track[] = [];
      for (let i = 1; i <= count; i++) {
        const track: Track = {
          id: this.trackId++,
          title: `Track ${i}`,
          albumId,
          trackNumber: i,
          duration: 180 + Math.floor(Math.random() * 120), // 3-5 minutes
          audioUrl: `/audio/track-${albumId}-${i}.wav`,
          isFeatured: featured && i <= 2, // First two tracks of featured albums are featured
        };
        tracks.push(track);
        this.tracks.set(track.id, track);
      }
      return tracks;
    };
    
    createTracks(album1.id, 8, true);
    createTracks(album2.id, 6, true);
    createTracks(album3.id, 5);
    createTracks(album4.id, 7);
    createTracks(album5.id, 6, true);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id,
      isPremium: false,
      premiumExpiry: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserPremiumStatus(userId: number, isPremium: boolean, expiryDate?: Date): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      isPremium,
      premiumExpiry: expiryDate || null
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateStripeCustomerId(userId: number, customerId: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      stripeCustomerId: customerId
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateStripeInfo(userId: number, data: { stripeCustomerId?: string, stripeSubscriptionId?: string }): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      stripeCustomerId: data.stripeCustomerId ?? user.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId ?? user.stripeSubscriptionId
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getAllAlbums(): Promise<Album[]> {
    return Array.from(this.albums.values());
  }

  async getAlbum(id: number): Promise<Album | undefined> {
    return this.albums.get(id);
  }

  async getFeaturedAlbums(limit = 5): Promise<Album[]> {
    return Array.from(this.albums.values())
      .sort(() => 0.5 - Math.random()) // Shuffle
      .slice(0, limit);
  }
  
  async getRecentAlbums(limit = 10): Promise<Album[]> {
    return Array.from(this.albums.values())
      .sort((a, b) => {
        // Sort by releaseDate in descending order (newest first)
        if (a.releaseDate && b.releaseDate) {
          return b.releaseDate.getTime() - a.releaseDate.getTime();
        }
        // If releaseDate is not available, sort by id in descending order
        return b.id - a.id;
      })
      .slice(0, limit);
  }
  
  async createAlbum(album: Omit<Album, 'id'>): Promise<Album> {
    const id = this.albumId++;
    const newAlbum: Album = {
      id,
      ...album
    };
    
    this.albums.set(id, newAlbum);
    return newAlbum;
  }

  async getAllTracks(): Promise<Track[]> {
    return Array.from(this.tracks.values());
  }

  async getTrack(id: number): Promise<Track | undefined> {
    return this.tracks.get(id);
  }

  async getTracksByAlbumId(albumId: number): Promise<Track[]> {
    return Array.from(this.tracks.values())
      .filter(track => track.albumId === albumId)
      .sort((a, b) => a.trackNumber - b.trackNumber);
  }

  async getFeaturedTracks(limit = 5): Promise<Track[]> {
    return Array.from(this.tracks.values())
      .filter(track => track.isFeatured)
      .slice(0, limit);
  }
  
  async createTrack(track: Omit<Track, 'id'>): Promise<Track> {
    const id = this.trackId++;
    const newTrack: Track = {
      id,
      ...track
    };
    
    this.tracks.set(id, newTrack);
    return newTrack;
  }

  async getUserPlaylists(userId: number): Promise<Playlist[]> {
    return Array.from(this.playlists.values())
      .filter(playlist => playlist.userId === userId);
  }

  async getPlaylist(id: number): Promise<Playlist | undefined> {
    return this.playlists.get(id);
  }

  async createPlaylist(playlist: Partial<Playlist>): Promise<Playlist> {
    const id = this.playlistId++;
    const newPlaylist: Playlist = {
      id,
      name: playlist.name || "New Playlist",
      userId: playlist.userId!,
      coverUrl: playlist.coverUrl || "",
      description: playlist.description || ""
    };
    
    this.playlists.set(id, newPlaylist);
    return newPlaylist;
  }

  async deletePlaylist(id: number): Promise<boolean> {
    // Delete the playlist tracks first
    Array.from(this.playlistTracks.values())
      .filter(pt => pt.playlistId === id)
      .forEach(pt => this.playlistTracks.delete(pt.id));
    
    // Delete the playlist
    return this.playlists.delete(id);
  }

  async getPlaylistTracks(playlistId: number): Promise<Track[]> {
    const playlistTracksList = Array.from(this.playlistTracks.values())
      .filter(pt => pt.playlistId === playlistId)
      .sort((a, b) => a.position - b.position);
    
    return Promise.all(
      playlistTracksList.map(async pt => {
        const track = await this.getTrack(pt.trackId);
        return track!;
      })
    );
  }

  async addTrackToPlaylist(playlistId: number, trackId: number, position: number): Promise<PlaylistTrack> {
    // Check if track is already in playlist
    const existingTrack = Array.from(this.playlistTracks.values())
      .find(pt => pt.playlistId === playlistId && pt.trackId === trackId);
    
    if (existingTrack) {
      return existingTrack;
    }
    
    const id = this.playlistTrackId++;
    const playlistTrack: PlaylistTrack = {
      id,
      playlistId,
      trackId,
      position
    };
    
    this.playlistTracks.set(id, playlistTrack);
    return playlistTrack;
  }

  async removeTrackFromPlaylist(playlistId: number, trackId: number): Promise<boolean> {
    const playlistTrack = Array.from(this.playlistTracks.values())
      .find(pt => pt.playlistId === playlistId && pt.trackId === trackId);
    
    if (!playlistTrack) {
      return false;
    }
    
    return this.playlistTracks.delete(playlistTrack.id);
  }

  // Analytics methods
  async recordTrackPlay(userId: number, trackId: number): Promise<TrackPlay> {
    const id = this.trackPlayId++;
    const trackPlay: TrackPlay = {
      id,
      trackId,
      userId,
      playedAt: new Date()
    };
    
    this.trackPlays.set(id, trackPlay);
    return trackPlay;
  }

  async getTrackPlays(trackId: number): Promise<number> {
    return Array.from(this.trackPlays.values())
      .filter(play => play.trackId === trackId)
      .length;
  }

  async getTopTracks(limit = 10): Promise<{track: Track; plays: number}[]> {
    // Count plays for each track
    const playCounts = new Map<number, number>();
    
    Array.from(this.trackPlays.values()).forEach(play => {
      const count = playCounts.get(play.trackId) || 0;
      playCounts.set(play.trackId, count + 1);
    });
    
    // Convert to array and sort by play count
    const trackCounts = Array.from(playCounts.entries())
      .map(([trackId, count]) => ({
        track: this.tracks.get(trackId)!,
        plays: count
      }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, limit);
    
    return trackCounts;
  }

  async getTrackPlaysByAlbum(albumId: number): Promise<{albumId: number; plays: number}> {
    // Get all tracks for this album
    const albumTracks = await this.getTracksByAlbumId(albumId);
    const trackIds = albumTracks.map(track => track.id);
    
    // Count plays for each track in this album
    const plays = Array.from(this.trackPlays.values())
      .filter(play => trackIds.includes(play.trackId))
      .length;
    
    return {
      albumId,
      plays
    };
  }

  async getPlaysByTimeRange(startDate: Date, endDate: Date): Promise<{date: string; plays: number}[]> {
    // Filter plays within the given time range
    const playsInRange = Array.from(this.trackPlays.values())
      .filter(play => play.playedAt >= startDate && play.playedAt <= endDate);
    
    // Group plays by date
    const playsByDate = new Map<string, number>();
    
    playsInRange.forEach(play => {
      const dateStr = play.playedAt.toISOString().split('T')[0]; // YYYY-MM-DD
      const count = playsByDate.get(dateStr) || 0;
      playsByDate.set(dateStr, count + 1);
    });
    
    // Convert to array and sort by date
    return Array.from(playsByDate.entries())
      .map(([date, count]) => ({
        date,
        plays: count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getUserListeningHistory(userId: number, limit = 20): Promise<{track: Track; album: Album; playedAt: Date}[]> {
    // Get plays for this user and sort by date (newest first)
    const userPlays = Array.from(this.trackPlays.values())
      .filter(play => play.userId === userId)
      .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
      .slice(0, limit);
    
    // Map plays to track and album info
    const history = await Promise.all(
      userPlays.map(async play => {
        const track = await this.getTrack(play.trackId);
        if (!track) throw new Error(`Track not found: ${play.trackId}`);
        
        const album = await this.getAlbum(track.albumId);
        if (!album) throw new Error(`Album not found: ${track.albumId}`);
        
        return {
          track,
          album,
          playedAt: play.playedAt
        };
      })
    );
    
    return history;
  }
}

export const storage = new MemStorage();
