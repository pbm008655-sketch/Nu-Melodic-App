import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MixerTestPage() {
  const [audioUrl, setAudioUrl] = useState('/audio/track-6-1.wav');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Create audio element
    const audio = new Audio();
    
    // Handle successful loading
    audio.oncanplaythrough = () => {
      console.log('Audio loaded successfully!');
      setIsLoaded(true);
      setLoadError(null);
    };
    
    // Handle loading error
    audio.onerror = (e) => {
      console.error('Audio loading error:', e);
      setLoadError(`Error loading audio: ${audio.error?.message || 'Unknown error'}`);
      setIsLoaded(false);
    };
    
    // Set source and load
    audio.src = audioUrl;
    audio.load();
    
    // Store reference
    audioRef.current = audio;
    
    // Cleanup
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);
  
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        console.error('Playback error:', err);
        setLoadError(`Playback error: ${err.message}`);
      });
      setIsPlaying(true);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Audio Mixer Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <p className="text-lg mb-2">Current audio file:</p>
              <pre className="bg-muted p-2 rounded">{audioUrl}</pre>
            </div>
            
            {loadError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <strong>Error:</strong> {loadError}
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={togglePlayback}
                disabled={!isLoaded}
                variant="default"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              
              <Button 
                onClick={() => setAudioUrl('/audio/track-6-1.wav')}
                variant="outline"
              >
                Test Track 1
              </Button>
              
              <Button 
                onClick={() => setAudioUrl('/audio/track-6-2.wav')}
                variant="outline"
              >
                Test Track 2
              </Button>
              
              <Button 
                onClick={() => setAudioUrl('/audio/track-6-3.wav')}
                variant="outline"
              >
                Test Track 3
              </Button>
            </div>
            
            <div>
              <p className="font-medium mb-1">Status:</p>
              <p>{isLoaded ? 'Audio loaded ✅' : 'Loading or not available ❌'}</p>
              <p>{isPlaying ? 'Currently playing ▶️' : 'Not playing ⏸️'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}