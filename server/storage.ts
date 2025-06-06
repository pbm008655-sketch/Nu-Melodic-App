import { albums, tracks, playlists, playlistTracks, users, trackPlays, type User, type InsertUser, type Album, type Track, type Playlist, type PlaylistTrack, type TrackPlay } from "@shared/schema";
import { db, pool } from "./db";
import { eq, sql, inArray } from "drizzle-orm";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import session from "express-session";
import * as fs from "fs";
import * as path from "path";

// Session store setup
const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPremiumStatus(userId: number, isPremium: boolean, expiryDate?: Date): Promise<User | undefined>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User | undefined>;
  updateStripeInfo(userId: number, data: { stripeCustomerId?: string, stripeSubscriptionId?: string }): Promise<User | undefined>;
  updatePaypalInfo(userId: number, data: { paypalSubscriptionId?: string, paymentProvider?: string }): Promise<User | undefined>;
  
  getAllAlbums(): Promise<Album[]>;
  getAlbum(id: number): Promise<Album | undefined>;
  getFeaturedAlbums(limit?: number): Promise<Album[]>;
  getRecentAlbums(limit?: number): Promise<Album[]>;
  createAlbum(album: Omit<Album, 'id'>): Promise<Album>;
  clearAlbumsAndTracks(): Promise<void>; // Method to clear all albums and tracks
  
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

// In-memory storage implementation (keeping for reference)
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
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      paypalSubscriptionId: null,
      paymentProvider: 'stripe',
    };
    this.users.set(demoUser.id, demoUser);
    
    // Create demo albums with actual track titles from past uploads
    const demoAlbum: Album = {
      id: this.albumId++,
      title: "Melodic Journeys",
      artist: "Sonic Landscapes",
      coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
      description: "A captivating collection of melodic soundscapes",
      releaseDate: new Date(),
      customAlbum: null
    };
    this.albums.set(demoAlbum.id, demoAlbum);
    
    // Add a second demo album
    const electronicAlbum: Album = {
      id: this.albumId++,
      title: "Electronic Dreams",
      artist: "Digital Harmony",
      coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
      description: "Cutting-edge electronic beats and rhythms",
      releaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      customAlbum: null
    };
    this.albums.set(electronicAlbum.id, electronicAlbum);
    
    // Add tracks using existing files in the public/audio directory with correct track titles
    const albumOneTracks = [
      { title: "Acoustic Dreams", fileName: "track-1-1.mp3", duration: 244 },
      { title: "Morning Light", fileName: "track-1-2.mp3", duration: 281 },
      { title: "Endless Horizon", fileName: "track-1-3.mp3", duration: 367 },
      { title: "Deep Reflections", fileName: "track-1-4.mp3", duration: 198 },
      { title: "Evening Stars", fileName: "track-1-5.mp3", duration: 319 }
    ];
    
    // Electronic album tracks
    const albumTwoTracks = [
      { title: "Digital Pulse", fileName: "track-2-1.mp3", duration: 258 },
      { title: "Circuit Rhythm", fileName: "track-2-2.mp3", duration: 312 },
      { title: "Synthetic Waves", fileName: "track-2-3.mp3", duration: 285 },
      { title: "Binary Beat", fileName: "track-2-4.mp3", duration: 221 },
      { title: "Electric Horizon", fileName: "track-2-5.mp3", duration: 347 },
      { title: "Cyber Dreams", fileName: "track-2-6.mp3", duration: 274 }
    ];
    
    try {
      // Process first album tracks
      for (let i = 0; i < albumOneTracks.length; i++) {
        const { title, fileName, duration } = albumOneTracks[i];
        const trackNumber = i + 1;
        const audioFilePath = path.join(process.cwd(), 'public', 'audio', fileName);
        
        // Check if file exists
        if (!fs.existsSync(audioFilePath)) {
          console.log(`File not found: ${audioFilePath}, using it anyway`);
        }
        
        const track: Track = {
          id: this.trackId++,
          albumId: demoAlbum.id,
          title,
          trackNumber,
          duration,
          audioUrl: `/audio/${fileName}`,
          isFeatured: i < 2
        };
        this.tracks.set(track.id, track);
      }
      
      // Process second album tracks
      for (let i = 0; i < albumTwoTracks.length; i++) {
        const { title, fileName, duration } = albumTwoTracks[i];
        const trackNumber = i + 1;
        const audioFilePath = path.join(process.cwd(), 'public', 'audio', fileName);
        
        // Check if file exists
        if (!fs.existsSync(audioFilePath)) {
          console.log(`File not found: ${audioFilePath}, using it anyway`);
        }
        
        const track: Track = {
          id: this.trackId++,
          albumId: electronicAlbum.id,
          title,
          trackNumber,
          duration,
          audioUrl: `/audio/${fileName}`,
          isFeatured: i < 2
        };
        this.tracks.set(track.id, track);
      }
      
      console.log('Initialized storage with demo user and sample albums with tracks.');
    } catch (error) {
      console.error('Error initializing storage with demo data:', error);
      console.log('Falling back to basic initialization...');
      
      // Create a basic track in case of errors
      const track: Track = {
        id: this.trackId++,
        albumId: demoAlbum.id,
        title: "Demo Track",
        trackNumber: 1,
        duration: 180,
        audioUrl: `/audio/track-1-1.mp3`,
        isFeatured: true
      };
      this.tracks.set(track.id, track);
    }
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
      premiumExpiry: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      paypalSubscriptionId: null,
      paymentProvider: 'stripe'
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

  async updatePaypalInfo(userId: number, data: { paypalSubscriptionId?: string, paymentProvider?: string }): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      paypalSubscriptionId: data.paypalSubscriptionId ?? user.paypalSubscriptionId,
      paymentProvider: data.paymentProvider ?? user.paymentProvider
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
  
  async clearAlbumsAndTracks(): Promise<void> {
    this.albums.clear();
    this.tracks.clear();
    this.trackPlays.clear();
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
    const albumTracks = await this.getTracksByAlbumId(albumId);
    const trackIds = albumTracks.map(track => track.id);
    
    const albumPlays = Array.from(this.trackPlays.values())
      .filter(play => trackIds.includes(play.trackId))
      .length;
    
    return {
      albumId,
      plays: albumPlays
    };
  }
  
  async getPlaysByTimeRange(startDate: Date, endDate: Date): Promise<{date: string; plays: number}[]> {
    // Filter plays by date range
    const filteredPlays = Array.from(this.trackPlays.values())
      .filter(play => {
        const playDate = play.playedAt;
        return playDate >= startDate && playDate <= endDate;
      });
    
    // Group by date
    const playsByDate = new Map<string, number>();
    
    filteredPlays.forEach(play => {
      const dateStr = play.playedAt.toISOString().split('T')[0]; // YYYY-MM-DD
      const count = playsByDate.get(dateStr) || 0;
      playsByDate.set(dateStr, count + 1);
    });
    
    // Convert to array and sort by date
    return Array.from(playsByDate.entries())
      .map(([date, plays]) => ({ date, plays }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  
  async getUserListeningHistory(userId: number, limit = 20): Promise<{track: Track; album: Album; playedAt: Date}[]> {
    // Get track plays for this user
    const userPlays = Array.from(this.trackPlays.values())
      .filter(play => play.userId === userId)
      .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime()) // Newest first
      .slice(0, limit);
    
    // Map to track and album info
    return userPlays.map(play => {
      const track = this.tracks.get(play.trackId)!;
      const album = this.albums.get(track.albumId)!;
      
      return {
        track,
        album,
        playedAt: play.playedAt
      };
    });
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        isPremium: false,
        premiumExpiry: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null
      })
      .returning();
    return user;
  }

  async updateUserPremiumStatus(userId: number, isPremium: boolean, expiryDate?: Date): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        isPremium, 
        premiumExpiry: expiryDate || null 
      })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateStripeInfo(userId: number, data: { stripeCustomerId?: string, stripeSubscriptionId?: string }): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const [updatedUser] = await db
      .update(users)
      .set({
        stripeCustomerId: data.stripeCustomerId ?? user.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId ?? user.stripeSubscriptionId
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
  }

  async getAllAlbums(): Promise<Album[]> {
    return await db.select().from(albums);
  }

  async getAlbum(id: number): Promise<Album | undefined> {
    const [album] = await db.select().from(albums).where(eq(albums.id, id));
    return album || undefined;
  }

  async getFeaturedAlbums(limit = 5): Promise<Album[]> {
    // In a real database we would use ORDER BY RANDOM(), but for simplicity we'll
    // just get all albums and shuffle them in-memory
    const allAlbums = await this.getAllAlbums();
    // Shuffle array
    const shuffled = [...allAlbums].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }

  async getRecentAlbums(limit = 10): Promise<Album[]> {
    return await db
      .select()
      .from(albums)
      .orderBy(albums.releaseDate ?? albums.id)
      .limit(limit);
  }

  async createAlbum(album: Omit<Album, 'id'>): Promise<Album> {
    const [newAlbum] = await db
      .insert(albums)
      .values(album)
      .returning();
    return newAlbum;
  }

  async clearAlbumsAndTracks(): Promise<void> {
    // First clear track plays
    await db.delete(trackPlays);
    // Then clear tracks
    await db.delete(tracks);
    // Then clear albums
    await db.delete(albums);
  }

  async getAllTracks(): Promise<Track[]> {
    return await db.select().from(tracks);
  }

  async getTrack(id: number): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
    return track || undefined;
  }

  async getTracksByAlbumId(albumId: number): Promise<Track[]> {
    return await db
      .select()
      .from(tracks)
      .where(eq(tracks.albumId, albumId))
      .orderBy(tracks.trackNumber);
  }

  async getFeaturedTracks(limit = 5): Promise<Track[]> {
    return await db
      .select()
      .from(tracks)
      .where(eq(tracks.isFeatured, true))
      .limit(limit);
  }

  async createTrack(track: Omit<Track, 'id'>): Promise<Track> {
    const [newTrack] = await db
      .insert(tracks)
      .values(track)
      .returning();
    return newTrack;
  }

  async getUserPlaylists(userId: number): Promise<Playlist[]> {
    return await db
      .select()
      .from(playlists)
      .where(eq(playlists.userId, userId));
  }

  async getPlaylist(id: number): Promise<Playlist | undefined> {
    const [playlist] = await db
      .select()
      .from(playlists)
      .where(eq(playlists.id, id));
    return playlist || undefined;
  }

  async createPlaylist(playlist: Partial<Playlist>): Promise<Playlist> {
    const [newPlaylist] = await db
      .insert(playlists)
      .values({
        name: playlist.name || "New Playlist",
        userId: playlist.userId!,
        coverUrl: playlist.coverUrl || "",
        description: playlist.description || ""
      })
      .returning();
    return newPlaylist;
  }

  async deletePlaylist(id: number): Promise<boolean> {
    // First delete playlist tracks
    await db
      .delete(playlistTracks)
      .where(eq(playlistTracks.playlistId, id));
    
    // Then delete the playlist
    const result = await db
      .delete(playlists)
      .where(eq(playlists.id, id));
    
    return result.count > 0;
  }

  async getPlaylistTracks(playlistId: number): Promise<Track[]> {
    const playlistTrackItems = await db
      .select()
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, playlistId))
      .orderBy(playlistTracks.position);
    
    const trackIds = playlistTrackItems.map(item => item.trackId);
    
    if (trackIds.length === 0) {
      return [];
    }
    
    // We need to get all tracks and sort them according to the order in playlist
    const allTracks = await Promise.all(
      trackIds.map(async trackId => {
        const track = await this.getTrack(trackId);
        return track!;
      })
    );
    
    return allTracks.filter(Boolean);
  }

  async addTrackToPlaylist(playlistId: number, trackId: number, position: number): Promise<PlaylistTrack> {
    // Check if track is already in playlist
    const existingTrackItems = await db
      .select()
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, playlistId))
      .where(eq(playlistTracks.trackId, trackId));
    
    if (existingTrackItems.length > 0) {
      return existingTrackItems[0];
    }
    
    const [playlistTrack] = await db
      .insert(playlistTracks)
      .values({
        playlistId,
        trackId,
        position
      })
      .returning();
    
    return playlistTrack;
  }

  async removeTrackFromPlaylist(playlistId: number, trackId: number): Promise<boolean> {
    const result = await db
      .delete(playlistTracks)
      .where(eq(playlistTracks.playlistId, playlistId))
      .where(eq(playlistTracks.trackId, trackId));
    
    return result.count > 0;
  }

  async recordTrackPlay(userId: number, trackId: number): Promise<TrackPlay> {
    const [trackPlay] = await db
      .insert(trackPlays)
      .values({
        trackId,
        userId,
        playedAt: new Date()
      })
      .returning();
    
    return trackPlay;
  }

  async getTrackPlays(trackId: number): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(trackPlays)
      .where(eq(trackPlays.trackId, trackId));
    
    return result[0]?.count || 0;
  }

  async getTopTracks(limit = 10): Promise<{track: Track; plays: number}[]> {
    // Group by trackId and count plays
    const playCount = await db
      .select({
        trackId: trackPlays.trackId,
        plays: sql`count(*)`
      })
      .from(trackPlays)
      .groupBy(trackPlays.trackId)
      .orderBy(sql`count(*)`)
      .limit(limit);
    
    // Get track details for each track
    const topTracks = await Promise.all(
      playCount.map(async ({ trackId, plays }) => {
        const track = await this.getTrack(trackId);
        if (!track) throw new Error(`Track not found: ${trackId}`);
        return { track, plays };
      })
    );
    
    return topTracks;
  }

  async getTrackPlaysByAlbum(albumId: number): Promise<{albumId: number; plays: number}> {
    // Get all tracks for this album
    const albumTracks = await this.getTracksByAlbumId(albumId);
    const trackIds = albumTracks.map(track => track.id);
    
    if (trackIds.length === 0) {
      return { albumId, plays: 0 };
    }
    
    // Count plays for each track in this album
    const result = await db
      .select({ count: sql`count(*)` })
      .from(trackPlays)
      .where(inArray(trackPlays.trackId, trackIds));
    
    return {
      albumId,
      plays: result[0]?.count || 0
    };
  }

  async getPlaysByTimeRange(startDate: Date, endDate: Date): Promise<{date: string; plays: number}[]> {
    // Group by date and count plays
    const result = await db
      .select({
        date: sql`to_char(${trackPlays.playedAt}, 'YYYY-MM-DD')`,
        plays: sql`count(*)`
      })
      .from(trackPlays)
      .where(sql`${trackPlays.playedAt} >= ${startDate} AND ${trackPlays.playedAt} <= ${endDate}`)
      .groupBy(sql`to_char(${trackPlays.playedAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${trackPlays.playedAt}, 'YYYY-MM-DD')`);
    
    return result;
  }

  async getUserListeningHistory(userId: number, limit = 20): Promise<{track: Track; album: Album; playedAt: Date}[]> {
    // Get plays for this user and sort by date (newest first)
    const userPlays = await db
      .select()
      .from(trackPlays)
      .where(eq(trackPlays.userId, userId))
      .orderBy(sql`${trackPlays.playedAt} desc`)
      .limit(limit);
    
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

// Create a seed function for the database
async function seedDatabase(storage: DatabaseStorage) {
  try {
    // Check if we already have users
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log('Database already has data, skipping seed');
      return;
    }
    
    console.log('Seeding database with initial data...');
    
    // Create a demo user
    const demoUser = await storage.createUser({
      username: "demo",
      email: "demo@example.com",
      password: "$2b$10$dXNmcGZHaGJsZHVqaGtraUlnTnZyNDMrcy5lOU9Va2lITU56VUZRRmZlbFhsZFFpMXM5dGVCc1RKMkNhTVowamVybnRsMw==.7177bfdf1ec70da0ea9b3585649a08f2" // password is "password"
    });
    
    // Create first album
    const demoAlbum = await storage.createAlbum({
      title: "Melodic Journeys",
      artist: "Sonic Landscapes",
      coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
      description: "A captivating collection of melodic soundscapes",
      releaseDate: new Date(),
      customAlbum: null
    });
    
    // Create second album
    const electronicAlbum = await storage.createAlbum({
      title: "Electronic Dreams",
      artist: "Digital Harmony",
      coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
      description: "Cutting-edge electronic beats and rhythms",
      releaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      customAlbum: null
    });
    
    // Add tracks for first album
    const albumOneTracks = [
      { title: "Acoustic Dreams", fileName: "track-1-1.mp3", duration: 244 },
      { title: "Morning Light", fileName: "track-1-2.mp3", duration: 281 },
      { title: "Endless Horizon", fileName: "track-1-3.mp3", duration: 367 },
      { title: "Deep Reflections", fileName: "track-1-4.mp3", duration: 198 },
      { title: "Evening Stars", fileName: "track-1-5.mp3", duration: 319 }
    ];
    
    for (let i = 0; i < albumOneTracks.length; i++) {
      const { title, fileName, duration } = albumOneTracks[i];
      const trackNumber = i + 1;
      
      await storage.createTrack({
        albumId: demoAlbum.id,
        title,
        trackNumber,
        duration,
        audioUrl: `/audio/${fileName}`,
        isFeatured: i < 2 // First two tracks are featured
      });
    }
    
    // Add tracks for second album
    const albumTwoTracks = [
      { title: "Digital Pulse", fileName: "track-2-1.mp3", duration: 258 },
      { title: "Circuit Rhythm", fileName: "track-2-2.mp3", duration: 312 },
      { title: "Synthetic Waves", fileName: "track-2-3.mp3", duration: 285 },
      { title: "Binary Beat", fileName: "track-2-4.mp3", duration: 221 },
      { title: "Electric Horizon", fileName: "track-2-5.mp3", duration: 347 },
      { title: "Cyber Dreams", fileName: "track-2-6.mp3", duration: 274 }
    ];
    
    for (let i = 0; i < albumTwoTracks.length; i++) {
      const { title, fileName, duration } = albumTwoTracks[i];
      const trackNumber = i + 1;
      
      await storage.createTrack({
        albumId: electronicAlbum.id,
        title,
        trackNumber,
        duration,
        audioUrl: `/audio/${fileName}`,
        isFeatured: i < 2 // First two tracks are featured
      });
    }
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Initialize storage with database
export const storage = new DatabaseStorage();

// Immediately invoke async function to seed database
(async () => {
  try {
    await seedDatabase(storage as DatabaseStorage);
  } catch (error) {
    console.error('Error during database initialization:', error);
    console.log('Falling back to in-memory storage');
  }
})();