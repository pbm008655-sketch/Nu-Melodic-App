import { useState } from "react";
import { Play, Pause, Heart, Plus, MoreHorizontal } from "lucide-react";
import { Track, Album } from "@shared/schema";
import { usePlayer } from "@/hooks/use-player";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";

interface TrackListItemProps {
  track: Track;
  album?: Album;
  index: number;
  showAlbum?: boolean;
  playlistId?: number;
}

export function TrackListItem({ track, album, index, showAlbum = false, playlistId }: TrackListItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const isCurrentTrack = currentTrack?.id === track.id;
  
  const { data: userPlaylists } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["/api/playlists"],
    enabled: !!user,
  });
  
  const addToPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, trackId }: { playlistId: number; trackId: number }) => {
      await apiRequest("POST", `/api/playlists/${playlistId}/tracks`, { trackId });
    },
    onSuccess: () => {
      toast({
        title: "Track added",
        description: "Track added to playlist successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const removeFromPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, trackId }: { playlistId: number; trackId: number }) => {
      await apiRequest("DELETE", `/api/playlists/${playlistId}/tracks/${trackId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/playlists/${playlistId}`] });
      toast({
        title: "Track removed",
        description: "Track removed from playlist successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handlePlayClick = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(track, album);
    }
  };
  
  return (
    <div 
      className={`flex items-center p-2 rounded group ${isCurrentTrack ? 'bg-zinc-700/30' : 'hover:bg-zinc-800/50'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-8 flex-shrink-0 flex items-center justify-center text-zinc-400">
        {isHovered || isCurrentTrack ? (
          <button 
            onClick={handlePlayClick}
            className={`w-8 h-8 flex items-center justify-center ${isCurrentTrack && isPlaying ? 'text-primary' : 'text-white'}`}
          >
            {isCurrentTrack && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        ) : (
          <span className="text-sm font-light">{index + 1}</span>
        )}
      </div>
      
      <div className="ml-2 flex-1 min-w-0">
        <h4 className={`truncate text-sm ${isCurrentTrack ? 'text-primary font-medium' : 'text-white'}`}>
          {track.title}
        </h4>
        
        {showAlbum && album && (
          <p className="text-xs text-zinc-400 truncate">{album.title}</p>
        )}
      </div>
      
      <div className="ml-auto flex items-center">
        <span className="text-xs text-zinc-400 w-12 text-right mr-2">
          {formatDuration(track.duration)}
        </span>
        
        <div className={`flex space-x-1 items-center ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-zinc-400 hover:text-white"
          >
            <Heart className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-zinc-400 hover:text-white"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-800 border-zinc-700 text-white">
              {playlistId ? (
                <DropdownMenuItem 
                  onClick={() => removeFromPlaylistMutation.mutate({ playlistId, trackId: track.id })}
                  className="cursor-pointer"
                >
                  Remove from playlist
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem className="text-white cursor-default focus:bg-zinc-700/50">
                    Add to playlist
                  </DropdownMenuItem>
                  
                  {userPlaylists?.map((playlist) => (
                    <DropdownMenuItem 
                      key={playlist.id}
                      onClick={() => addToPlaylistMutation.mutate({ playlistId: playlist.id, trackId: track.id })}
                      className="text-sm text-zinc-300 pl-6 cursor-pointer focus:bg-zinc-700/50"
                    >
                      {playlist.name}
                    </DropdownMenuItem>
                  ))}
                  
                  {(!userPlaylists || userPlaylists.length === 0) && (
                    <DropdownMenuItem className="text-sm text-zinc-400 pl-6 cursor-default">
                      No playlists found
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
