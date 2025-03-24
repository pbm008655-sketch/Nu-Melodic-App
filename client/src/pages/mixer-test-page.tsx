import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info, AlertTriangle } from 'lucide-react';

export default function MixerTestPage() {
  const [audioUrl, setAudioUrl] = useState('/audio/track-6-1.wav');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingMethod, setLoadingMethod] = useState<'native' | 'web-audio' | 'fetch'>('native');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const addDebugMessage = (message: string) => {
    setDebugInfo(prev => [message, ...prev.slice(0, 9)]);
  };
  
  // Reset state when changing method or URL
  useEffect(() => {
    setIsLoaded(false);
    setIsPlaying(false);
    setLoadError(null);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [loadingMethod, audioUrl]);
  
  // Native Audio element loading
  useEffect(() => {
    if (loadingMethod !== 'native') return;
    
    addDebugMessage(`📱 Creating native Audio element for ${audioUrl}...`);
    
    const audio = new Audio();
    
    // Log events
    audio.addEventListener('loadstart', () => addDebugMessage('🔄 Load started'));
    audio.addEventListener('progress', () => addDebugMessage('📶 Loading progress...'));
    audio.addEventListener('canplay', () => addDebugMessage('✓ Can play (basic playback possible)'));
    
    // Handle successful loading
    audio.oncanplaythrough = () => {
      addDebugMessage('✅ Audio fully loaded successfully!');
      setIsLoaded(true);
      setLoadError(null);
    };
    
    // Handle loading error
    audio.onerror = (e) => {
      const errorDetail = audio.error 
        ? `Code: ${audio.error.code}, Message: ${audio.error.message}` 
        : 'Unknown error';
      
      addDebugMessage(`❌ Error loading audio: ${errorDetail}`);
      console.error('Audio loading error:', e, audio.error);
      setLoadError(`Error loading audio: ${errorDetail}`);
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
  }, [loadingMethod, audioUrl]);
  
  // Web Audio API loading
  useEffect(() => {
    if (loadingMethod !== 'web-audio') return;
    
    addDebugMessage(`🎛️ Using Web Audio API to load ${audioUrl}...`);
    
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    // Fetch the audio file
    fetch(audioUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        addDebugMessage(`✓ Fetch successful, status: ${response.status}`);
        return response.arrayBuffer();
      })
      .then(arrayBuffer => {
        addDebugMessage('✓ Array buffer received, decoding audio...');
        return audioContext.decodeAudioData(arrayBuffer);
      })
      .then(audioBuffer => {
        addDebugMessage('✅ Audio decoded successfully!');
        setIsLoaded(true);
        setLoadError(null);
      })
      .catch(error => {
        addDebugMessage(`❌ Web Audio API error: ${error.message}`);
        console.error('Web Audio API error:', error);
        setLoadError(`Web Audio API error: ${error.message}`);
        setIsLoaded(false);
      });
      
    return () => {
      audioContext.close();
    };
  }, [loadingMethod, audioUrl]);
  
  // Direct fetch test
  useEffect(() => {
    if (loadingMethod !== 'fetch') return;
    
    addDebugMessage(`🔍 Testing direct fetch for ${audioUrl}...`);
    
    fetch(audioUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        addDebugMessage(`✓ Fetch successful (${response.status})`);
        addDebugMessage(`✓ Content-Type: ${response.headers.get('Content-Type')}`);
        addDebugMessage(`✓ Content-Length: ${response.headers.get('Content-Length')} bytes`);
        
        setIsLoaded(true);
        setLoadError(null);
        
        // We're just testing the fetch, no need to process the data
        return response.blob();
      })
      .catch(error => {
        addDebugMessage(`❌ Fetch error: ${error.message}`);
        console.error('Fetch error:', error);
        setLoadError(`Fetch error: ${error.message}`);
        setIsLoaded(false);
      });
  }, [loadingMethod, audioUrl]);
  
  const togglePlayback = () => {
    if (loadingMethod !== 'native' || !audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      addDebugMessage('⏸️ Playback paused');
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          addDebugMessage('▶️ Playback started');
        })
        .catch(err => {
          addDebugMessage(`❌ Playback error: ${err.message}`);
          console.error('Playback error:', err);
          setLoadError(`Playback error: ${err.message}`);
        });
      setIsPlaying(true);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Audio Loading Test</CardTitle>
          <CardDescription>
            This page tests different methods of loading audio files to identify the source of loading issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="native" onValueChange={(value) => setLoadingMethod(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="native">Native Audio</TabsTrigger>
              <TabsTrigger value="web-audio">Web Audio API</TabsTrigger>
              <TabsTrigger value="fetch">Direct Fetch</TabsTrigger>
            </TabsList>
            
            <TabsContent value="native" className="space-y-4 pt-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                <div className="flex items-start">
                  <Info className="h-4 w-4 mt-1 mr-2 text-blue-500" />
                  <div>
                    <h4 className="font-medium text-blue-900">Native Audio Element</h4>
                    <p className="text-blue-700 text-sm">
                      Uses the standard HTML Audio element to load and play audio.
                    </p>
                  </div>
                </div>
              </div>
              
              {isLoaded && loadingMethod === 'native' && (
                <div className="flex justify-center">
                  <Button
                    onClick={togglePlayback}
                    size="lg"
                  >
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="web-audio" className="space-y-4 pt-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                <div className="flex items-start">
                  <Info className="h-4 w-4 mt-1 mr-2 text-blue-500" />
                  <div>
                    <h4 className="font-medium text-blue-900">Web Audio API</h4>
                    <p className="text-blue-700 text-sm">
                      Uses the Web Audio API to decode and process audio data.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="fetch" className="space-y-4 pt-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                <div className="flex items-start">
                  <Info className="h-4 w-4 mt-1 mr-2 text-blue-500" />
                  <div>
                    <h4 className="font-medium text-blue-900">Direct Fetch</h4>
                    <p className="text-blue-700 text-sm">
                      Tests if the audio file is accessible via a direct HTTP request.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Test with different audio files</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <Button 
                onClick={() => setAudioUrl('/audio/track-6-1.wav')}
                variant={audioUrl === '/audio/track-6-1.wav' ? 'default' : 'outline'}
                size="sm"
              >
                440Hz Test
              </Button>
              
              <Button 
                onClick={() => setAudioUrl('/audio/track-6-2.wav')}
                variant={audioUrl === '/audio/track-6-2.wav' ? 'default' : 'outline'}
                size="sm"
              >
                880Hz Test
              </Button>
              
              <Button 
                onClick={() => setAudioUrl('/audio/track-6-3.wav')}
                variant={audioUrl === '/audio/track-6-3.wav' ? 'default' : 'outline'}
                size="sm"
              >
                Track 3
              </Button>
              
              <Button 
                onClick={() => setAudioUrl('/test-audio')}
                variant={audioUrl === '/test-audio' ? 'default' : 'outline'}
                size="sm"
              >
                Static Test Audio
              </Button>
            </div>
          </div>
          
          {loadError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          )}
          
          <div className="mt-4 p-3 rounded bg-muted">
            <p className="font-medium mb-2">Status:</p>
            <p className="mb-1">{loadingMethod.toUpperCase()} loading method | {isLoaded ? 'Loaded ✅' : 'Not loaded ❌'}</p>
            {loadingMethod === 'native' && (
              <p>{isPlaying ? 'Currently playing ▶️' : 'Not playing ⏸️'}</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Debug Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-3 rounded font-mono text-sm h-64 overflow-y-auto">
            {debugInfo.length === 0 ? (
              <p>No debug information yet...</p>
            ) : (
              debugInfo.map((message, index) => (
                <div key={index} className="mb-1">
                  <span className="opacity-60">[{new Date().toLocaleTimeString()}]</span> {message}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}