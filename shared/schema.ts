import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  isPremium: boolean("is_premium").notNull().default(false),
  premiumExpiry: timestamp("premium_expiry", { mode: 'date' }),
});

export const albums = pgTable("albums", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  coverUrl: text("cover_url").notNull(),
  description: text("description"),
  releaseDate: timestamp("release_date"),
  // We'll store customAlbum as JSON in the database for imported tracks
  customAlbum: text("custom_album"),
});

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  albumId: integer("album_id").notNull(),
  trackNumber: integer("track_number").notNull(),
  duration: integer("duration").notNull(), // in seconds
  audioUrl: text("audio_url").notNull(),
  isFeatured: boolean("is_featured").default(false),
});

export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull(),
  coverUrl: text("cover_url"),
  description: text("description"),
});

export const playlistTracks = pgTable("playlist_tracks", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").notNull(),
  trackId: integer("track_id").notNull(),
  position: integer("position").notNull(),
});

export const trackPlays = pgTable("track_plays", {
  id: serial("id").primaryKey(),
  trackId: integer("track_id").notNull(),
  userId: integer("user_id").notNull(),
  playedAt: timestamp("played_at", { mode: 'date' }).defaultNow().notNull(),
});

// Schema for user registration and login
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

// Schema for creating a playlist
export const insertPlaylistSchema = createInsertSchema(playlists).pick({
  name: true,
  description: true,
});

// Schema for adding a track to a playlist
export const insertPlaylistTrackSchema = createInsertSchema(playlistTracks).pick({
  playlistId: true,
  trackId: true,
});

// Schema for recording a track play
export const insertTrackPlaySchema = createInsertSchema(trackPlays).pick({
  trackId: true,
  userId: true,
});

// Schema for subscription
export const subscriptionSchema = z.object({
  plan: z.enum(["free", "premium"]),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Album = typeof albums.$inferSelect;
export type Track = typeof tracks.$inferSelect;
export type Playlist = typeof playlists.$inferSelect;
export type PlaylistTrack = typeof playlistTracks.$inferSelect;
export type TrackPlay = typeof trackPlays.$inferSelect;
