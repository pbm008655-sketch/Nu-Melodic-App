import { useState, useEffect } from "react";
import { usePlayer } from "@/hooks/use-player";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { globalAudio } from "@/lib/global-audio";
import { Heart, Repeat, Shuffle, SkipBack, SkipForward, Pause, Play, Volume2, Volume1, VolumeX, ListMusic } from "lucide-react";

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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);
  
  useEffect(() => {
    const audio = globalAudio.getAudio();
    
    // Configure audio element
    audio.volume = volume;
    
    // Set up event listeners
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
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
  }, [nextTrack, volume]);
  
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
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
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
      <div className="max-w-screen-2xl mx-auto">
        {/* Track Info */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-zinc-800 rounded-md flex items-center justify-center overflow-hidden">
              {currentTrack.album?.coverUrl ? (
                <img 
                  src={currentTrack.album.coverUrl} 
                  alt={currentTrack.album.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ListMusic className="h-6 w-6 text-zinc-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-medium text-sm truncate">{currentTrack.title}</p>
              <p className="text-zinc-400 text-xs truncate">{currentTrack.album?.artist || 'Unknown Artist'}</p>
            </div>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white transition-colors">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Player Controls */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
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
              <div className="flex-1 mx-3">
                <Slider
                  value={[currentTime]}
                  max={duration}
                  step={1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                />
              </div>
              <span className="text-zinc-400 text-xs w-10">{formatTime(duration)}</span>
            </div>
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
      </div>
    </div>
  );
}