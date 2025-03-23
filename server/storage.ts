import { albums, tracks, playlists, playlistTracks, users, type User, type InsertUser, type Album, type Track, type Playlist, type PlaylistTrack } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPremiumStatus(userId: number, isPremium: boolean, expiryDate?: Date): Promise<User | undefined>;
  
  getAllAlbums(): Promise<Album[]>;
  getAlbum(id: number): Promise<Album | undefined>;
  getFeaturedAlbums(limit?: number): Promise<Album[]>;
  getRecentAlbums(limit?: number): Promise<Album[]>;
  
  getAllTracks(): Promise<Track[]>;
  getTrack(id: number): Promise<Track | undefined>;
  getTracksByAlbumId(albumId: number): Promise<Track[]>;
  getFeaturedTracks(limit?: number): Promise<Track[]>;
  
  getUserPlaylists(userId: number): Promise<Playlist[]>;
  getPlaylist(id: number): Promise<Playlist | undefined>;
  createPlaylist(playlist: Partial<Playlist>): Promise<Playlist>;
  deletePlaylist(id: number): Promise<boolean>;
  
  getPlaylistTracks(playlistId: number): Promise<Track[]>;
  addTrackToPlaylist(playlistId: number, trackId: number, position: number): Promise<PlaylistTrack>;
  removeTrackFromPlaylist(playlistId: number, trackId: number): Promise<boolean>;
  
  sessionStore: any; // Type for session store
}

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private albums: Map<number, Album>;
  private tracks: Map<number, Track>;
  private playlists: Map<number, Playlist>;
  private playlistTracks: Map<number, PlaylistTrack>;
  
  userId: number;
  albumId: number;
  trackId: number;
  playlistId: number;
  playlistTrackId: number;
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.albums = new Map();
    this.tracks = new Map();
    this.playlists = new Map();
    this.playlistTracks = new Map();
    
    this.userId = 1;
    this.albumId = 1;
    this.trackId = 1;
    this.playlistId = 1;
    this.playlistTrackId = 1;
    
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
    };
    
    const album2: Album = {
      id: this.albumId++,
      title: "Urban Echoes",
      artist: "MeloStream Artist",
      coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
      description: "Electronic fusion with urban influences",
      releaseDate: new Date("2023-08-20"),
    };
    
    const album3: Album = {
      id: this.albumId++,
      title: "Sound Waves",
      artist: "MeloStream Artist",
      coverUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
      description: "Ambient collection for relaxation",
      releaseDate: new Date("2023-02-10"),
    };
    
    const album4: Album = {
      id: this.albumId++,
      title: "Neon Nights",
      artist: "MeloStream Artist",
      coverUrl: "https://images.unsplash.com/photo-1593697972672-b1c1356e32f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
      description: "Synthwave inspired by 80s nostalgia",
      releaseDate: new Date("2023-09-05"),
    };
    
    const album5: Album = {
      id: this.albumId++,
      title: "Acoustic Dreams",
      artist: "MeloStream Artist",
      coverUrl: "https://images.unsplash.com/photo-1602848597941-0d3f3415bfa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
      description: "Peaceful instrumental acoustic melodies",
      releaseDate: new Date("2023-06-30"),
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
  
  async getRecentAlbums(limit = 5): Promise<Album[]> {
    return Array.from(this.albums.values())
      .sort((a, b) => b.releaseDate!.getTime() - a.releaseDate!.getTime())
      .slice(0, limit);
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
}

export const storage = new MemStorage();
