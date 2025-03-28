import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Track, Album } from "@shared/schema";

interface DownloadButtonProps {
  track?: Track;
  album?: Album;
  variant?: "default" | "ghost" | "link" | "outline" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  id?: string;
}

export function DownloadButton({ 
  track, 
  album, 
  variant = "outline", 
  size = "icon",
  className = "",
  id
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  // Function to download a single track
  const downloadTrack = async (trackId: number) => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/tracks/${trackId}/download`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download track');
      }
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a download link and trigger a click
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Get the filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'track.mp3';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: "Your track is downloading...",
      });
    } catch (error: any) {
      console.error('Error downloading track:', error);
      toast({
        title: "Download Failed",
        description: error.message || "There was an error downloading your track.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Function to download an entire album
  const downloadAlbum = async (albumId: number) => {
    setIsDownloading(true);
    try {
      // First get all tracks in the album
      const response = await fetch(`/api/albums/${albumId}/download`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download album');
      }
      
      const albumData = await response.json();
      
      if (!albumData.tracks || albumData.tracks.length === 0) {
        throw new Error('No tracks found in this album');
      }
      
      // Show download started toast
      toast({
        title: "Album Download Started",
        description: `Downloading ${albumData.tracks.length} tracks from "${albumData.album.title}"...`,
      });

      // For each track, initiate a download
      // Use a small delay between downloads to avoid overwhelming the browser
      for (let i = 0; i < albumData.tracks.length; i++) {
        const track = albumData.tracks[i];
        
        // Create a small delay between each download
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Download the track
        await downloadTrack(track.id);
      }
      
      toast({
        title: "Album Download Complete",
        description: `All tracks from "${albumData.album.title}" have been downloaded.`,
      });
    } catch (error: any) {
      console.error('Error downloading album:', error);
      toast({
        title: "Album Download Failed",
        description: error.message || "There was an error downloading your album.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClick = () => {
    if (track) {
      downloadTrack(track.id);
    } else if (album) {
      downloadAlbum(album.id);
    } else {
      toast({
        title: "Download Error",
        description: "No track or album specified for download.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      id={id}
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isDownloading}
      className={className}
      title={track ? "Download track" : "Download album"}
    >
      {isDownloading ? (
        <span className="animate-spin">
          <Download className="h-4 w-4" />
        </span>
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  );
}