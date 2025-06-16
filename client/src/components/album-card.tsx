import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Play, Pause, Crown } from "lucide-react";
import { Album } from "@shared/schema";
import { usePlayer } from "@/hooks/use-player";
import { useQuery } from "@tanstack/react-query";
import { Track } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface AlbumCardProps {
  album: Album;
  variant?: "default" | "compact";
}

// Helper function to parse customAlbum JSON if it exists
function getCustomAlbumData(album: Album): { title: string; artist: string; description: string; coverUrl: string } | null {
  if (!album.customAlbum) return null;
  try {
    return JSON.parse(album.customAlbum);
  } catch (e) {
    console.error("Failed to parse customAlbum JSON:", e);
    return null;
  }
}

export function AlbumCard({ album, variant = "default" }: AlbumCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [displayAlbum, setDisplayAlbum] = useState(album);
  const { 
    currentTrack, 
    isPlaying, 
    playAlbum,
    togglePlay
  } = usePlayer();
  const { user } = useAuth();
  
  const isPreviewMode = !user?.isPremium;
  
  // Process album data to use customAlbum properties if available
  useEffect(() => {
    const customData = getCustomAlbumData(album);
    if (customData) {
      setDisplayAlbum({
        ...album,
        title: customData.title,
        artist: customData.artist,
        description: customData.description || album.description,
        coverUrl: customData.coverUrl || album.coverUrl
      });
    } else {
      setDisplayAlbum(album);
    }
  }, [album]);
  
  // Check if this album is currently playing
  const isThisAlbumPlaying = currentTrack?.albumId === album.id && isPlaying;
  
  // Get album tracks
  const { data: albumData } = useQuery<{ album: Album; tracks: Track[] }>({
    queryKey: [`/api/albums/${album.id}`],
    enabled: false, // We'll manually fetch this when needed
  });

  const handlePlayButton = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isThisAlbumPlaying) {
      togglePlay();
      return;
    }
    
    // If this album isn't playing, start playing it
    if (albumData?.tracks) {
      playAlbum(albumData.tracks, displayAlbum);
    } else {
      // Fetch tracks first then play
      fetch(`/api/albums/${album.id}`)
        .then(res => res.json())
        .then(data => {
          playAlbum(data.tracks, displayAlbum);
        });
    }
  };

  if (variant === "compact") {
    return (
      <Link href={`/album/${album.id}`}>
        <a className="flex items-center bg-zinc-800/40 rounded-md overflow-hidden hover:bg-zinc-800 transition-colors p-2 group">
          <img 
            src={displayAlbum.coverUrl} 
            alt={displayAlbum.title} 
            className="w-16 h-16 object-cover rounded-md" 
          />
          <div className="ml-4 flex-1">
            <h3 className="font-medium text-white">{displayAlbum.title}</h3>
            <p className="text-zinc-400 text-sm">{displayAlbum.artist}</p>
          </div>
          <button 
            className={`w-8 h-8 flex items-center justify-center rounded-full ${isThisAlbumPlaying ? 'bg-primary text-black' : 'bg-white/10 text-white opacity-0 group-hover:opacity-100'} transition-all`}
            onClick={handlePlayButton}
          >
            {isThisAlbumPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
        </a>
      </Link>
    );
  }

  return (
    <Link href={`/album/${album.id}`}>
      <a 
        className="rounded-md overflow-hidden bg-zinc-800/40 p-4 cursor-pointer hover:bg-zinc-800 transition-all duration-200 block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          <img 
            src={displayAlbum.coverUrl} 
            alt={displayAlbum.title} 
            className="w-full aspect-square object-cover rounded-md mb-3 shadow-md" 
          />
          <button 
            className={`absolute bottom-2 right-2 ${isThisAlbumPlaying ? 'bg-primary' : 'bg-primary'} text-black rounded-full w-10 h-10 flex items-center justify-center shadow-lg transform ${isHovered || isThisAlbumPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} transition-all duration-200`}
            onClick={handlePlayButton}
            aria-label={isThisAlbumPlaying ? "Pause" : "Play"}
          >
            {isThisAlbumPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate">{displayAlbum.title}</h3>
            <p className="text-zinc-400 text-sm truncate">{displayAlbum.artist}</p>
          </div>
          {isPreviewMode && (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs ml-2">
              <Crown className="h-3 w-3" />
              <span>Preview</span>
            </div>
          )}
        </div>
      </a>
    </Link>
  );
}
