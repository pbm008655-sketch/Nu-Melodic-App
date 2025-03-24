import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info, AlertTriangle } from 'lucide-react';

export default function MixerTestPage() {
  // Ensure we have a valid URL initialized
  const [audioUrl, setAudioUrl] = useState<string>('/audio/track-6-1.wav?t=' + Date.now());
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
    
    // Use the selected audio URL directly
    const testUrl = audioUrl;
    addDebugMessage(`📱 Creating native Audio element for ${testUrl}...`);
    
    const audio = new Audio();
    
    // Log all possible events for debugging
    const events = [
      'loadstart', 'progress', 'suspend', 'abort', 'error', 
      'emptied', 'stalled', 'loadedmetadata', 'loadeddata', 
      'canplay', 'canplaythrough', 'playing', 'waiting', 
      'seeking', 'seeked', 'ended', 'durationchange', 
      'timeupdate', 'play', 'pause', 'ratechange', 'volumechange'
    ];
    
    events.forEach(event => {
      audio.addEventListener(event, () => {
        addDebugMessage(`Event: ${event}`);
      });
    });
    
    // Handle successful loading
    audio.oncanplaythrough = () => {
      addDebugMessage(`✅ Audio fully loaded successfully! Duration: ${audio.duration}s`);
      setIsLoaded(true);
      setLoadError(null);
    };
    
    // Handle loading error with detailed information
    audio.onerror = (e) => {
      let errorDetail = 'Unknown error';
      
      if (audio.error) {
        // Error codes: https://developer.mozilla.org/en-US/docs/Web/API/MediaError/code
        const errorCodes = {
          1: 'MEDIA_ERR_ABORTED - The user canceled the fetching of the media.',
          2: 'MEDIA_ERR_NETWORK - A network error occurred while fetching the media.',
          3: 'MEDIA_ERR_DECODE - The media cannot be decoded due to format issues.',
          4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - The media type is not supported.'
        };
        
        errorDetail = `Code: ${audio.error.code} (${errorCodes[audio.error.code as 1|2|3|4] || 'Unknown'})`;
        if (audio.error.message) {
          errorDetail += `, Message: ${audio.error.message}`;
        }
      }
      
      addDebugMessage(`❌ Error loading audio: ${errorDetail}`);
      console.error('Audio loading error:', e, audio.error);
      setLoadError(`Error loading audio: ${errorDetail}`);
      setIsLoaded(false);
    };
    
    // Try with fixed MIME type
    audio.src = testUrl;
    
    // Force preload
    audio.preload = 'auto';
    
    // Start loading
    try {
      addDebugMessage('🔄 Starting audio load...');
      audio.load();
    } catch (err: any) {
      addDebugMessage(`❌ Exception during load(): ${err?.message || 'Unknown error'}`);
      setLoadError(`Exception during load(): ${err?.message || 'Unknown error'}`);
    }
    
    // Store reference
    audioRef.current = audio;
    
    // Cleanup
    return () => {
      events.forEach(event => {
        audio.removeEventListener(event, () => {});
      });
      audio.pause();
      audio.src = '';
    };
  }, [loadingMethod, audioUrl]);
  
  // Web Audio API loading
  useEffect(() => {
    if (loadingMethod !== 'web-audio') return;
    
    // Use the selected audio URL directly
    const testUrl = audioUrl;
    addDebugMessage(`🎛️ Using Web Audio API to load ${testUrl}...`);
    
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    addDebugMessage(`✓ Audio context created, sample rate: ${audioContext.sampleRate}Hz`);
    
    // Use XMLHttpRequest for better Web Audio API compatibility
    const xhr = new XMLHttpRequest();
    xhr.open('GET', testUrl, true);
    xhr.responseType = 'arraybuffer';
    
    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        addDebugMessage(`📶 Loading: ${Math.round((event.loaded / event.total) * 100)}%`);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const arrayBuffer = xhr.response;
        
        addDebugMessage(`✓ Audio file loaded (${arrayBuffer.byteLength} bytes), decoding...`);
        
        try {
          // Using legacy callback version for maximum compatibility
          audioContext.decodeAudioData(
            arrayBuffer,
            (decodedData) => {
              addDebugMessage(`✅ Audio decoded: ${decodedData.duration.toFixed(2)}s, ${decodedData.numberOfChannels} channels`);
              setIsLoaded(true);
              setLoadError(null);
            },
            (err) => {
              addDebugMessage(`❌ Error decoding audio: ${err?.message || 'Unknown error'}`);
              console.error('Decode error:', err);
              setLoadError(`Error decoding audio: ${err?.message || 'Unknown error'}`);
              setIsLoaded(false);
            }
          );
        } catch (err: any) {
          addDebugMessage(`❌ Exception during decoding: ${err?.message || 'Unknown error'}`);
          console.error('Decode exception:', err);
          setLoadError(`Exception during decoding: ${err?.message || 'Unknown error'}`);
          setIsLoaded(false);
        }
      } else {
        addDebugMessage(`❌ HTTP error: ${xhr.status}`);
        setLoadError(`HTTP error: ${xhr.status}`);
        setIsLoaded(false);
      }
    };
    
    xhr.onerror = () => {
      addDebugMessage(`❌ Network error while loading audio`);
      setLoadError('Network error while loading audio');
      setIsLoaded(false);
    };
    
    // Start the request
    xhr.send();
    
    return () => {
      xhr.abort();
      audioContext.close();
    };
  }, [loadingMethod, audioUrl]);
  
  // Direct fetch test
  useEffect(() => {
    if (loadingMethod !== 'fetch') return;
    
    // Use the selected audio URL directly
    const testUrl = audioUrl;
    addDebugMessage(`🔍 Testing direct fetch for ${testUrl}...`);
    
    fetch(testUrl, {
      method: 'GET',
      cache: 'no-cache',
      headers: {
        'Accept': 'audio/*',
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        addDebugMessage(`✓ Fetch successful (${response.status})`);
        addDebugMessage(`✓ Content-Type: ${response.headers.get('Content-Type')}`);
        addDebugMessage(`✓ Content-Length: ${response.headers.get('Content-Length') || 'chunked'}`);
        
        setIsLoaded(true);
        setLoadError(null);
        
        // We're just testing the fetch, no need to process the data
        return response.blob();
      })
      .then(blob => {
        addDebugMessage(`✓ Blob received successfully, size: ${blob.size} bytes`);
        addDebugMessage(`✓ Blob MIME type: ${blob.type}`);
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
                onClick={() => setAudioUrl('/audio/track-6-1.wav?t=' + Date.now())}
                variant={audioUrl.startsWith('/audio/track-6-1.wav') ? 'default' : 'outline'}
                size="sm"
              >
                440Hz Test
              </Button>
              
              <Button 
                onClick={() => setAudioUrl('/audio/track-6-2.wav?t=' + Date.now())}
                variant={audioUrl.startsWith('/audio/track-6-2.wav') ? 'default' : 'outline'}
                size="sm"
              >
                880Hz Test
              </Button>
              
              <Button 
                onClick={() => setAudioUrl('/audio/track-6-3.wav?t=' + Date.now())}
                variant={audioUrl.startsWith('/audio/track-6-3.wav') ? 'default' : 'outline'}
                size="sm"
              >
                Track 3
              </Button>
              
              <Button 
                onClick={() => setAudioUrl('/test-audio?t=' + Date.now())}
                variant={audioUrl.startsWith('/test-audio') ? 'default' : 'outline'}
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