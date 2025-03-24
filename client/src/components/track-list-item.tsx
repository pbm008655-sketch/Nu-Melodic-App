import { useState } from "react";
import { Play, Pause, Heart, Plus, MoreHorizontal, Sliders } from "lucide-react";
import { Track, Album } from "@shared/schema";
import { usePlayer } from "@/hooks/use-player";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";

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
  const [, navigate] = useLocation();
  
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
  
  // Record play directly from track list item
  const recordPlayMutation = useMutation({
    mutationFn: async (trackId: number) => {
      try {
        // Only proceed if user is authenticated
        if (!user) {
          console.log("Cannot record play: No authenticated user");
          return;
        }
        
        // Make direct API call with stringified trackId to avoid type issues
        console.log(`Recording play for track ${trackId} from TrackListItem`);
        const response = await apiRequest('POST', '/api/analytics/track-play', { 
          trackId: trackId.toString() 
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to record play: ${response.status}`, errorText);
        } else {
          console.log("Successfully recorded play from TrackListItem");
        }
      } catch (error) {
        console.error("Error recording track play:", error);
      }
    }
  });

  const handlePlayClick = () => {
    // Play logic
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(track, album);
      
      // Record play as a backup to the player hook's recording
      if (user && track.id) {
        console.log("Triggering play recording from TrackListItem component");
        recordPlayMutation.mutate(track.id);
      }
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
              <DropdownMenuItem
                onClick={() => navigate(`/mixer/${track.id}`)}
                className="cursor-pointer flex items-center gap-2"
              >
                <Sliders className="h-4 w-4" />
                <span>Open in Audio Mixer</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
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
