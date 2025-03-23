import { useState } from "react";
import { Link } from "wouter";
import { Play, Pause } from "lucide-react";
import { Album } from "@shared/schema";
import { usePlayer } from "@/hooks/use-player";
import { useQuery } from "@tanstack/react-query";
import { Track } from "@shared/schema";

interface AlbumCardProps {
  album: Album;
  variant?: "default" | "compact";
}

export function AlbumCard({ album, variant = "default" }: AlbumCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { 
    currentTrack, 
    isPlaying, 
    playAlbum,
    togglePlay
  } = usePlayer();
  
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
      playAlbum(albumData.tracks, album);
    } else {
      // Fetch tracks first then play
      fetch(`/api/albums/${album.id}`)
        .then(res => res.json())
        .then(data => {
          playAlbum(data.tracks, album);
        });
    }
  };

  if (variant === "compact") {
    return (
      <Link href={`/album/${album.id}`}>
        <a className="flex items-center bg-zinc-800/40 rounded-md overflow-hidden hover:bg-zinc-800 transition-colors p-2 group">
          <img 
            src={album.coverUrl} 
            alt={album.title} 
            className="w-16 h-16 object-cover rounded-md" 
          />
          <div className="ml-4 flex-1">
            <h3 className="font-medium text-white">{album.title}</h3>
            <p className="text-zinc-400 text-sm">{album.artist}</p>
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
            src={album.coverUrl} 
            alt={album.title} 
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
        <h3 className="font-medium text-white truncate">{album.title}</h3>
        <p className="text-zinc-400 text-sm truncate">{album.artist}</p>
      </a>
    </Link>
  );
}
