import { useState, useEffect } from "react";
import { usePlayer } from "@/hooks/use-player";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { globalAudio } from "@/lib/global-audio";
import { Heart, Repeat, Shuffle, SkipBack, SkipForward, Pause, Play, Volume2, Volume1, VolumeX, ListMusic, Crown } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Link } from "wouter";

export default function Player() {
  const { 
    currentTrack, 
    isPlaying,
    isShuffleMode,
    isRepeatMode,
    togglePlay, 
    nextTrack, 
    previousTrack,
    setVolume,
    volume,
    toggleShuffle,
    toggleRepeat
  } = usePlayer();
  
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  
  // Preview settings
  const PREVIEW_DURATION = 30; // 30 seconds for non-premium users
  const isPreviewMode = !user?.isPremium;
  
  useEffect(() => {
    const audio = globalAudio.getAudio();
    
    // Configure audio element
    audio.volume = volume;
    
    // Set up event listeners
    const onTimeUpdate = () => {
      const currentTime = audio.currentTime;
      setCurrentTime(currentTime);
      
      // Check if non-premium user has reached preview limit
      if (isPreviewMode && currentTime >= PREVIEW_DURATION) {
        audio.pause();
        setShowPreviewDialog(true);
        // Don't call togglePlay here to avoid state conflicts
      }
    };
    
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => nextTrack();
    
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    
    // Clean up
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [nextTrack, volume, isPreviewMode]);
  
  // Load new track
  useEffect(() => {
    if (!currentTrack) return;
    
    // Use global audio instance to load track
    globalAudio.loadTrack(currentTrack.audioUrl);
    const audio = globalAudio.getAudio();
    
    // Add error handling for audio loading
    const handleError = () => {
      console.error("Error loading audio file:", currentTrack.audioUrl);
      setCurrentTime(0);
      setDuration(180); // Simulate a 3-minute track
    };
    
    // Handle play event
    const handlePlay = () => {
      console.log("Playing track:", currentTrack.title);
    };
    
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    
    // Play if needed
    if (isPlaying) {
      audio.play().catch((error: any) => {
        console.error("Error playing audio:", error);
      });
    }
    
    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
    };
  }, [currentTrack, isPlaying, toast]);
  
  // Handle play/pause
  useEffect(() => {
    const audio = globalAudio.getAudio();
    
    if (isPlaying) {
      audio.play().catch((error: any) => {
        console.error("Error playing audio:", error);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handleSeek = (value: number[]) => {
    const audio = globalAudio.getAudio();
    const seekTime = value[0];
    
    // Prevent non-premium users from seeking beyond preview limit
    if (isPreviewMode && seekTime > PREVIEW_DURATION) {
      setShowPreviewDialog(true);
      return;
    }
    
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };
  
  const handleVolumeChange = (value: number[]) => {
    const audio = globalAudio.getAudio();
    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };
  
  const toggleMute = () => {
    const audio = globalAudio.getAudio();
    
    if (isMuted) {
      // Unmute
      audio.volume = prevVolume;
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      // Mute
      setPrevVolume(volume);
      audio.volume = 0;
      setVolume(0);
      setIsMuted(true);
    }
  };
  
  const VolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX />;
    if (volume < 0.5) return <Volume1 />;
    return <Volume2 />;
  };
  
  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-3 md:p-4 z-20 h-20">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-center h-full">
          <p className="text-zinc-400 text-sm">Select a track to play</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-3 md:p-4 z-20">
      <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center">
        {/* Track Info */}
        <div className="flex items-center mb-3 md:mb-0 w-full md:w-auto">
          {currentTrack.album?.coverUrl && (
            <img 
              src={currentTrack.album.coverUrl} 
              alt={`${currentTrack.album.title} cover`} 
              className="w-12 h-12 rounded-sm object-cover" 
            />
          )}
          
          <div className="ml-3 mr-4">
            <h4 className="text-sm font-medium text-white">{currentTrack.title}</h4>
            <p className="text-xs text-zinc-400">
              {currentTrack.album?.title && `From ${currentTrack.album.title}`}
            </p>
          </div>
          
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-primary">
            <Heart className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Playback Controls - Desktop */}
        <div className="hidden md:flex flex-col items-center flex-1 px-4 max-w-lg">
          <div className="flex items-center justify-center space-x-4 mb-2 w-full">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`hover:text-white transition-colors ${isShuffleMode ? 'text-primary' : 'text-zinc-400'}`}
              onClick={toggleShuffle}
              title="Shuffle"
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-zinc-400 hover:text-white transition-colors"
              onClick={previousTrack}
              title="Previous track"
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button 
              className="bg-white text-black rounded-full w-8 h-8 flex items-center justify-center hover:scale-105 transition-transform p-0 min-w-0"
              onClick={togglePlay}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-zinc-400 hover:text-white transition-colors"
              onClick={nextTrack}
              title="Next track"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`hover:text-white transition-colors ${isRepeatMode ? 'text-primary' : 'text-zinc-400'}`}
              onClick={toggleRepeat}
              title="Repeat"
            >
              <Repeat className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center w-full">
            <span className="text-zinc-400 text-xs w-10 text-right">{formatTime(currentTime)}</span>
            <div className="flex-1 mx-3 relative">
              <Slider
                value={[currentTime]}
                max={isPreviewMode ? Math.min(duration, PREVIEW_DURATION) : duration}
                step={1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
              {/* Preview mode indicator on progress bar */}
              {isPreviewMode && duration > PREVIEW_DURATION && (
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-yellow-500 pointer-events-none"
                  style={{ left: `${(PREVIEW_DURATION / duration) * 100}%` }}
                  title="Preview limit"
                />
              )}
            </div>
            <span className="text-zinc-400 text-xs w-10">
              {isPreviewMode ? formatTime(Math.min(duration, PREVIEW_DURATION)) : formatTime(duration)}
            </span>
            {/* Preview mode badge */}
            {isPreviewMode && (
              <div className="ml-2 flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs">
                <Crown className="h-3 w-3" />
                <span>Preview</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Playback Controls */}
        <div className="md:hidden flex items-center justify-between w-full">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`hover:text-white transition-colors ${isShuffleMode ? 'text-primary' : 'text-zinc-400'}`}
            onClick={toggleShuffle}
            title="Shuffle"
          >
            <Shuffle className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-zinc-400 hover:text-white transition-colors"
            onClick={previousTrack}
            title="Previous track"
          >
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button 
            className="bg-white text-black rounded-full w-8 h-8 flex items-center justify-center p-0 min-w-0"
            onClick={togglePlay}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-zinc-400 hover:text-white transition-colors"
            onClick={nextTrack}
            title="Next track"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`hover:text-white transition-colors ${isRepeatMode ? 'text-primary' : 'text-zinc-400'}`}
            onClick={toggleRepeat}
            title="Repeat"
          >
            <Repeat className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Volume Controls */}
        <div className="hidden md:flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white transition-colors">
            <ListMusic className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-zinc-400 hover:text-white transition-colors"
            onClick={toggleMute}
          >
            <VolumeIcon />
          </Button>
          <div className="w-24">
            <Slider
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="cursor-pointer"
            />
          </div>
        </div>
      </div>
      
      {/* Preview Limit Dialog */}
      <AlertDialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Preview Time Ended
            </AlertDialogTitle>
            <AlertDialogDescription>
              You've reached the 30-second preview limit for this track. Subscribe to unlock unlimited listening and access to the full music library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogAction asChild>
              <Link href="/subscriptions" className="w-full sm:w-auto">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Crown className="h-4 w-4 mr-2" />
                  Subscribe Now
                </Button>
              </Link>
            </AlertDialogAction>
            <AlertDialogAction 
              onClick={() => setShowPreviewDialog(false)}
              className="w-full sm:w-auto"
            >
              Continue Browsing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
