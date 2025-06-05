import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { Track, Album } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth-bypass";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PlayerContextType {
  currentTrack: (Track & { album?: Album }) | null;
  queue: (Track & { album?: Album })[];
  isPlaying: boolean;
  volume: number;
  isShuffleMode: boolean;
  isRepeatMode: boolean;
  playTrack: (track: Track, album?: Album) => void;
  playAlbum: (tracks: Track[], album: Album) => void;
  playPlaylist: (tracks: (Track & { album?: Album })[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playAll: (tracks: (Track & { album?: Album })[]) => void;
  playRandom: (tracks: (Track & { album?: Album })[]) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<(Track & { album?: Album }) | null>(null);
  const [queue, setQueue] = useState<(Track & { album?: Album })[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.7);
  const [trackStartTime, setTrackStartTime] = useState<Date | null>(null);
  const [isShuffleMode, setIsShuffleMode] = useState<boolean>(false);
  const [isRepeatMode, setIsRepeatMode] = useState<boolean>(false);
  const [originalQueue, setOriginalQueue] = useState<(Track & { album?: Album })[]>([]);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Record track play mutation with enhanced error handling and retry logic
  const recordPlayMutation = useMutation({
    mutationFn: async (trackId: number) => {
      try {
        // Check if user is authenticated
        if (!user) {
          console.warn('Track play not recorded: User not authenticated');
          return null; // Return null instead of throwing to prevent errors
        }
        
        // Ensure trackId is a valid number before sending
        if (typeof trackId !== 'number' || isNaN(trackId) || trackId <= 0) {
          console.warn(`Invalid trackId (${trackId}), not recording play`);
          return null;
        }
        
        console.log(`Recording play for track ID: ${trackId} from Player hook`);
        
        // Make the API request with better error handling
        // Try string format first as that's been more reliable
        try {
          const response = await apiRequest('POST', '/api/analytics/track-play', { 
            trackId: trackId.toString() 
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch (e) {
              errorData = { message: errorText };
            }
            console.error(`Track play API error (${response.status}):`, errorData);
            
            // If first attempt failed, try with numeric trackId
            console.log("Retrying with numeric trackId...");
            const retryResponse = await apiRequest('POST', '/api/analytics/track-play', { 
              trackId: trackId 
            });
            
            if (!retryResponse.ok) {
              console.error("Retry failed as well");
              return null;
            }
            
            console.log("Retry succeeded with numeric trackId");
            return retryResponse.json();
          }
          
          console.log("Successfully recorded play from Player hook");
          return response.json();
        } catch (apiError) {
          console.error('API request failed:', apiError);
          return null;
        }
      } catch (err) {
        console.error('Track play recording error:', err);
        return null; // Don't throw, just return null
      }
    },
    onError: (error) => {
      console.error('Failed to record track play:', error);
      // Don't show toast to user, as this is a background operation
    }
  });
  
  const playTrack = (track: Track, album?: Album) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to play tracks",
        variant: "destructive",
      });
      return;
    }
    
    // Create an enhanced track with album info if provided
    const enhancedTrack = album ? { ...track, album } : track;
    
    // Set the current track
    setCurrentTrack(enhancedTrack);
    
    // Start playing
    setIsPlaying(true);
    
    // Clear the queue and add only this track
    setQueue([enhancedTrack]);
    setQueueIndex(0);
  };
  
  const playAlbum = (tracks: Track[], album: Album) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to play albums",
        variant: "destructive",
      });
      return;
    }
    
    if (!tracks.length) {
      toast({
        title: "Playback Error",
        description: "No tracks available in this album",
        variant: "destructive",
      });
      return;
    }
    
    // Enhance tracks with album info
    const enhancedTracks = tracks.map(track => ({ ...track, album }));
    
    // Set the queue
    setQueue(enhancedTracks);
    setQueueIndex(0);
    
    // Start with the first track
    setCurrentTrack(enhancedTracks[0]);
    
    // Start playing
    setIsPlaying(true);
  };
  
  const playPlaylist = (tracks: (Track & { album?: Album })[]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to play playlists",
        variant: "destructive",
      });
      return;
    }
    
    if (!tracks.length) {
      toast({
        title: "Playback Error",
        description: "No tracks available in this playlist",
        variant: "destructive",
      });
      return;
    }
    
    // Set the queue
    setQueue(tracks);
    setQueueIndex(0);
    
    // Start with the first track
    setCurrentTrack(tracks[0]);
    
    // Start playing
    setIsPlaying(true);
  };
  
  const togglePlay = () => {
    if (!currentTrack) {
      toast({
        title: "Playback Error",
        description: "No track selected",
        variant: "destructive",
      });
      return;
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const nextTrack = () => {
    if (!queue.length) return;
    
    const nextIndex = (queueIndex + 1) % queue.length;
    setQueueIndex(nextIndex);
    setCurrentTrack(queue[nextIndex]);
    
    // If we're already playing, continue playing the next track
    if (isPlaying) {
      setIsPlaying(true);
    }
  };
  
  const previousTrack = () => {
    if (!queue.length) return;
    
    const prevIndex = queueIndex === 0 ? queue.length - 1 : queueIndex - 1;
    setQueueIndex(prevIndex);
    setCurrentTrack(queue[prevIndex]);
    
    // If we're already playing, continue playing the previous track
    if (isPlaying) {
      setIsPlaying(true);
    }
  };
  
  const updateVolume = (newVolume: number) => {
    // Ensure volume is between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
  };
  
  // Shuffle the track order randomly
  const toggleShuffle = () => {
    if (!queue.length) return;
    
    // If entering shuffle mode
    if (!isShuffleMode) {
      // Store the original queue
      setOriginalQueue([...queue]);
      
      // Create a shuffled version of the queue while preserving the current track
      const currentTrackIndex = queueIndex;
      const currentTrackItem = queue[currentTrackIndex];
      
      // Remove current track from the queue copy
      const queueWithoutCurrent = queue.filter((_, i) => i !== currentTrackIndex);
      
      // Shuffle the remaining tracks
      const shuffledQueue = shuffleArray([...queueWithoutCurrent]);
      
      // Put the current track back at its original index
      shuffledQueue.splice(currentTrackIndex, 0, currentTrackItem);
      
      // Update the queue with the shuffled version
      setQueue(shuffledQueue);
    } else {
      // If exiting shuffle mode, restore the original queue
      setQueue(originalQueue);
      
      // Find the current track in the original queue
      const currentId = currentTrack?.id;
      const newIndex = originalQueue.findIndex(t => t.id === currentId);
      
      // Update the index
      if (newIndex !== -1) {
        setQueueIndex(newIndex);
      }
    }
    
    // Toggle shuffle mode
    setIsShuffleMode(!isShuffleMode);
  };
  
  // Toggle repeat mode (which makes the player repeat the queue)
  const toggleRepeat = () => {
    setIsRepeatMode(!isRepeatMode);
  };
  
  // Play all tracks provided in order
  const playAll = (tracks: (Track & { album?: Album })[]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to play tracks",
        variant: "destructive",
      });
      return;
    }
    
    if (!tracks.length) {
      toast({
        title: "Playback Error",
        description: "No tracks available to play",
        variant: "destructive",
      });
      return;
    }
    
    // Set the queue
    setQueue(tracks);
    setOriginalQueue(tracks);
    setQueueIndex(0);
    
    // Start with the first track
    setCurrentTrack(tracks[0]);
    
    // Start playing
    setIsPlaying(true);
  };
  
  // Play a random track from the provided tracks
  const playRandom = (tracks: (Track & { album?: Album })[]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to play tracks",
        variant: "destructive",
      });
      return;
    }
    
    if (!tracks.length) {
      toast({
        title: "Playback Error",
        description: "No tracks available to play",
        variant: "destructive",
      });
      return;
    }
    
    // Pick a random track index
    const randomIndex = Math.floor(Math.random() * tracks.length);
    
    // Set the queue
    setQueue(tracks);
    setOriginalQueue(tracks);
    setQueueIndex(randomIndex);
    
    // Start with the random track
    setCurrentTrack(tracks[randomIndex]);
    
    // Start playing
    setIsPlaying(true);
  };
  
  // Helper function to shuffle an array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };
  
  // Effect to handle track play recording
  useEffect(() => {
    if (isPlaying && currentTrack && user) {
      // Record when track starts playing
      setTrackStartTime(new Date());
      
      // Record the play in the database
      recordPlayMutation.mutate(currentTrack.id);
    }
  }, [currentTrack?.id, isPlaying]);
  
  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        isPlaying,
        volume,
        isShuffleMode,
        isRepeatMode,
        playTrack,
        playAlbum,
        playPlaylist,
        togglePlay,
        nextTrack,
        previousTrack,
        setVolume: updateVolume,
        toggleShuffle,
        toggleRepeat,
        playAll,
        playRandom,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
