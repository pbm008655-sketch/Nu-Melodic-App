import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export interface StorageInfo {
  totalSize: number;
  audioSize: number;
  imageSize: number;
  fileCount: number;
  audioCount: number;
  imageCount: number;
  files: {
    name: string;
    path: string;
    size: number;
    type: 'audio' | 'image' | 'other';
  }[];
  databaseSize?: number;
}

/**
 * Calculates the size of directories and their contents
 * @param directoryPath The directory to analyze
 * @returns Promise with storage information
 */
export async function getStorageInfo(): Promise<StorageInfo> {
  const publicDir = path.join(process.cwd(), 'public');
  const audioDir = path.join(publicDir, 'audio');
  const coversDir = path.join(publicDir, 'covers');
  
  const result: StorageInfo = {
    totalSize: 0,
    audioSize: 0,
    imageSize: 0,
    fileCount: 0,
    audioCount: 0,
    imageCount: 0,
    files: []
  };
  
  // Process audio files
  try {
    if (fs.existsSync(audioDir)) {
      const audioFiles = await readdir(audioDir);
      for (const file of audioFiles) {
        const filePath = path.join(audioDir, file);
        const stats = await stat(filePath);
        if (stats.isFile()) {
          const size = stats.size;
          result.totalSize += size;
          result.audioSize += size;
          result.fileCount++;
          result.audioCount++;
          
          const isAudio = file.toLowerCase().endsWith('.mp3') || 
                          file.toLowerCase().endsWith('.wav') || 
                          file.toLowerCase().endsWith('.ogg');
          
          result.files.push({
            name: file,
            path: `/audio/${file}`,
            size,
            type: isAudio ? 'audio' : 'other'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing audio directory:', error);
  }
  
  // Process cover images
  try {
    if (fs.existsSync(coversDir)) {
      const imageFiles = await readdir(coversDir);
      for (const file of imageFiles) {
        const filePath = path.join(coversDir, file);
        const stats = await stat(filePath);
        if (stats.isFile()) {
          const size = stats.size;
          result.totalSize += size;
          result.imageSize += size;
          result.fileCount++;
          result.imageCount++;
          
          const isImage = file.toLowerCase().endsWith('.jpg') || 
                          file.toLowerCase().endsWith('.jpeg') || 
                          file.toLowerCase().endsWith('.png') ||
                          file.toLowerCase().endsWith('.gif') ||
                          file.toLowerCase().endsWith('.webp');
          
          result.files.push({
            name: file,
            path: `/covers/${file}`,
            size,
            type: isImage ? 'image' : 'other'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing covers directory:', error);
  }
  
  // Sort files by size (largest first)
  result.files.sort((a, b) => b.size - a.size);
  
  return result;
}

/**
 * Formats bytes into a human-readable format
 * @param bytes Number of bytes
 * @param decimals Number of decimal places to show
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}