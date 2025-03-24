import { useState, useEffect, useRef } from "react";
import { usePlayer } from "@/hooks/use-player";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    const audio = audioRef.current;
    
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
    if (!audioRef.current || !currentTrack) return;
    
    const audio = audioRef.current;
    
    // Set the new audio source
    audio.src = currentTrack.audioUrl;
    audio.load();
    
    // Add error handling for audio loading
    const handleError = () => {
      console.error("Error loading audio file:", currentTrack.audioUrl);
      // Continue with player state, just don't play the audio
      setCurrentTime(0);
      setDuration(180); // Simulate a 3-minute track
    };
    
    // Handle play event
    const handlePlay = () => {
      // You can add custom behavior here if needed
      console.log("Playing track:", currentTrack.title);
    };
    
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    
    // Play if needed
    if (isPlaying) {
      audio.play().catch(error => {
        console.error("Error playing audio:", error);
        // Don't show another error toast as the error event will trigger
      });
    }
    
    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
    };
  }, [currentTrack, isPlaying, toast]);
  
  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(error => {
        console.error("Error playing audio:", error);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };
  
  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };
  
  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      // Unmute
      audioRef.current.volume = prevVolume;
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      // Mute
      setPrevVolume(volume);
      audioRef.current.volume = 0;
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
            <div className="flex-1 mx-3">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
            </div>
            <span className="text-zinc-400 text-xs w-10">{formatTime(duration)}</span>
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
    </div>
  );
}
