import { Album, Track } from '@shared/schema';
import { storage } from './storage';
import * as fs from 'fs';
import * as path from 'path';

/**
 * This module adds personal WAV files to the application.
 * 
 * Instructions:
 * 1. Upload your WAV files to public/audio directory
 * 2. Name them following this pattern: my-track-1.wav, my-track-2.wav, etc.
 * 3. Update the album details and track details below if needed
 * 4. Call the importPersonalTracks function from the routes.ts
 */

// Default album configuration
const defaultAlbum: Omit<Album, 'id'> = {
  title: "Sample Demo Album",
  artist: "Demo Artist",
  coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
  description: "A sample demo album with test tracks",
  releaseDate: new Date()
};

// Default track details
const defaultTrackDetails: Array<{ title: string; duration: number; sourceFile: string }> = [
  { title: "Sample Tone 440Hz", duration: 5, sourceFile: "my-track-1.wav" },
  { title: "Sample Tone 880Hz", duration: 3, sourceFile: "my-track-2.wav" }
];

/**
 * Creates a new album and adds tracks for the WAV files in the public/audio directory
 * that match the specified prefix pattern.
 * 
 * @param customAlbum Optional album details to override defaults
 * @param customTrackDetails Optional track details to override defaults
 * @returns Promise with the created album and tracks
 */
export async function importPersonalTracks({
  customAlbum,
  customTrackDetails
}: {
  customAlbum?: Partial<Omit<Album, 'id'>>;
  customTrackDetails?: Array<{ title: string; duration: number; sourceFile: string }>;
} = {}) {
  // Use custom album details or defaults
  const albumData = {
    ...defaultAlbum,
    ...(customAlbum || {}),
    releaseDate: new Date() // Always use current date
  };
  
  // Use custom track details or defaults
  const trackDetails = customTrackDetails || defaultTrackDetails;
  
  // Create a new album
  const album = await storage.createAlbum(albumData);
  console.log(`Created album: ${album.title} (ID: ${album.id})`);
  
  // Find all matching audio files
  const audioDir = path.join(process.cwd(), 'public', 'audio');
  const files = fs.readdirSync(audioDir);
  const matchingFiles = files.filter(file => file.startsWith('my-track-') && file.endsWith('.wav'));
  
  if (matchingFiles.length === 0) {
    console.log('No matching audio files found. Please upload your WAV files to public/audio with names like my-track-1.wav');
    return { album, tracks: [] };
  }
  
  // Sort files by track number
  matchingFiles.sort((a, b) => {
    const numA = parseInt(a.replace('my-track-', '').replace('.wav', ''));
    const numB = parseInt(b.replace('my-track-', '').replace('.wav', ''));
    return numA - numB;
  });
  
  const createdTracks = [];
  
  // Create tracks for each file
  for (let i = 0; i < matchingFiles.length; i++) {
    const file = matchingFiles[i];
    const trackNumber = i + 1;
    
    // Find track details or use defaults
    const details = trackDetails.find(t => t.sourceFile === file) || {
      title: `Track ${trackNumber}`,
      duration: 180, // Default 3 minutes
      sourceFile: file
    };
    
    // Create new target filename that follows the application's pattern
    const targetFileName = `track-${album.id}-${trackNumber}.wav`;
    const sourcePath = path.join(audioDir, file);
    const targetPath = path.join(audioDir, targetFileName);
    
    // Copy the file to the target path if it doesn't exist
    if (!fs.existsSync(targetPath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied ${file} to ${targetFileName}`);
    }
    
    // Add the track to the database
    const track: Omit<Track, 'id'> = {
      title: details.title,
      albumId: album.id,
      trackNumber,
      duration: details.duration,
      audioUrl: `/audio/${targetFileName}`,
      isFeatured: i < 2 // First two tracks are featured
    };
    
    const newTrack = await storage.createTrack(track);
    console.log(`Created track: ${newTrack.title} (ID: ${newTrack.id})`);
    createdTracks.push(newTrack);
  }
  
  console.log('Finished adding personal tracks!');
  return { album, tracks: createdTracks };
}

// This section runs only when this file is executed directly with `npx tsx`
// Check if this file is being executed directly (not imported)
// We'll use a different approach for ES modules
if (import.meta.url === `file://${process.cwd()}/server/add-personal-tracks.ts`) {
  console.log('Running add-personal-tracks.ts directly...');
  importPersonalTracks().then(async ({ album }) => {
    // Verify that the album and tracks were created
    const verifiedAlbum = await storage.getAlbum(album.id);
    console.log('Verification - Album:', verifiedAlbum);
    
    const tracks = await storage.getTracksByAlbumId(album.id);
    console.log('Verification - Tracks:', tracks);
  }).catch(err => {
    console.error('Error adding personal tracks:', err);
  });
}