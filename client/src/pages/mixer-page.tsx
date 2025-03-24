import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Album, Track } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
// Define the waveform component inline since we had issues with the import
// This way we don't need a separate file
function Waveform({ analyserNode, isPlaying }: { analyserNode: AnalyserNode | null; isPlaying: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  // Setup canvas and start animation when component mounts
  useEffect(() => {
    if (!canvasRef.current || !analyserNode) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get the device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    
    // Scale canvas for high-DPI displays
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Draw empty waveform initially
    drawEmptyWaveform(ctx, rect.width, rect.height);

    // Draw waveform when playing
    if (isPlaying) {
      const drawWaveform = () => {
        if (!analyserNode) return;
        
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteTimeDomainData(dataArray);
        
        drawWaveformFromData(ctx, dataArray, rect.width, rect.height);
        
        // Continue animation loop
        rafRef.current = requestAnimationFrame(drawWaveform);
      };
      
      // Start animation
      drawWaveform();
    }

    // Cleanup animation on unmount
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [analyserNode, isPlaying]);

  // Draw empty waveform (flatline)
  const drawEmptyWaveform = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, width, height);
    
    // Draw center line
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Draw grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    
    // Horizontal grid lines
    for (let i = 0; i < height; i += height / 8) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i < width; i += width / 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
  };

  // Draw waveform from audio data
  const drawWaveformFromData = (
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    width: number,
    height: number
  ) => {
    const bufferLength = dataArray.length;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    
    // Horizontal grid lines
    for (let i = 0; i < height; i += height / 8) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i < width; i += width / 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    
    // Draw center line
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Draw waveform
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#10b981"; // Green color
    
    const sliceWidth = width / bufferLength;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0; // Convert to range approximately 0-2
      const y = (v * height) / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
    
    // Add a subtle glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#10b981";
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  return (
    <div className="w-full min-h-[180px] h-full relative rounded-md overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ backgroundColor: "#1a1a1a" }}
      />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
          {analyserNode ? "Play to visualize audio" : "Loading audio..."}
        </div>
      )}
    </div>
  );
}
import { useToast } from "@/hooks/use-toast";
import { usePlayer } from "@/hooks/use-player";

// Define the available audio effects
const EFFECTS = {
  gain: { min: 0, max: 2, default: 1, step: 0.1, label: "Gain" },
  lowpass: { min: 20, max: 20000, default: 20000, step: 100, label: "Low Pass Filter" },
  highpass: { min: 20, max: 20000, default: 20, step: 100, label: "High Pass Filter" },
  reverb: { min: 0, max: 1, default: 0, step: 0.01, label: "Reverb" },
  delay: { min: 0, max: 1, default: 0, step: 0.01, label: "Delay" },
  distortion: { min: 0, max: 1, default: 0, step: 0.01, label: "Distortion" },
};

// Define preset configurations
const PRESETS = {
  default: { gain: 1, lowpass: 20000, highpass: 20, reverb: 0, delay: 0, distortion: 0 },
  radio: { gain: 0.8, lowpass: 4000, highpass: 500, reverb: 0.1, delay: 0, distortion: 0.1 },
  telephone: { gain: 0.6, lowpass: 3000, highpass: 800, reverb: 0, delay: 0, distortion: 0.2 },
  warm: { gain: 1.1, lowpass: 15000, highpass: 100, reverb: 0.1, delay: 0, distortion: 0 },
  concert: { gain: 1, lowpass: 20000, highpass: 20, reverb: 0.6, delay: 0.2, distortion: 0 },
  lofi: { gain: 0.8, lowpass: 5000, highpass: 150, reverb: 0.2, delay: 0.1, distortion: 0.05 },
};

type EffectType = keyof typeof EFFECTS;
type PresetType = keyof typeof PRESETS;

export default function MixerPage() {
  const { id } = useParams<{ id: string }>();
  const trackId = parseInt(id);
  const { toast } = useToast();
  const { playTrack } = usePlayer();
  
  // Audio nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const lowpassNodeRef = useRef<BiquadFilterNode | null>(null);
  const highpassNodeRef = useRef<BiquadFilterNode | null>(null);
  const convolverNodeRef = useRef<ConvolverNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const waveShaperNodeRef = useRef<WaveShaperNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  
  // UI state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEffectsEnabled, setIsEffectsEnabled] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<PresetType>("default");
  const [effectValues, setEffectValues] = useState({
    gain: EFFECTS.gain.default,
    lowpass: EFFECTS.lowpass.default,
    highpass: EFFECTS.highpass.default,
    reverb: EFFECTS.reverb.default,
    delay: EFFECTS.delay.default,
    distortion: EFFECTS.distortion.default,
  });
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [volumeBeforeMute, setVolumeBeforeMute] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  // Load track data with authentication
  const { data, isLoading, error } = useQuery<{ track: Track; album?: Album }>({
    queryKey: ["/api/tracks", trackId],
    enabled: !!trackId && !isNaN(trackId),
  });
  
  // Create audio context and load audio file with improved error handling and fallback methods
  useEffect(() => {
    if (data?.track && !isLoaded) {
      const loadAudio = async () => {
        try {
          // Initialize AudioContext with user interaction handling
          if (!audioContextRef.current) {
            try {
              audioContextRef.current = new AudioContext();
              
              // Handle suspended state (common in browsers requiring user interaction)
              if (audioContextRef.current.state === 'suspended') {
                console.log("AudioContext is suspended, waiting for user interaction");
                // We'll continue anyway and handle the state elsewhere
              }
            } catch (ctxError) {
              console.error("Failed to create AudioContext:", ctxError);
              toast({
                title: "Browser Audio Error",
                description: "Could not initialize audio system. Please check your browser settings.",
                variant: "destructive",
              });
              return;
            }
          }
          
          // Resume context on user interaction if needed
          if (audioContextRef.current.state === 'suspended') {
            try {
              await audioContextRef.current.resume();
              console.log("AudioContext resumed successfully");
            } catch (e) {
              console.warn("Could not resume AudioContext:", e);
            }
          }
          
          // Log track information for debugging
          console.log("Track data:", data.track);
          console.log("Attempting to load audio from:", data.track.audioUrl);
          
          // Check if URL is valid
          if (!data.track.audioUrl) {
            throw new Error("Track audio URL is missing");
          }
          
          // Simplify audio URL handling to avoid any path issues
          // First check if the URL is already a path to a WAV file
          const originalUrl = data.track.audioUrl;
          let audioUrl: string;
          
          if (originalUrl.startsWith('/audio/')) {
            // Already using our special route, just add cache-busting
            audioUrl = `${originalUrl}?t=${Date.now()}`;
          } else {
            // Extract filename and use our audio route
            let filename = originalUrl.startsWith('/') 
              ? originalUrl.substring(1) // Remove leading slash
              : originalUrl;
              
            // If path includes 'audio/', strip everything before it
            const audioIndex = filename.indexOf('audio/');
            if (audioIndex >= 0) {
              filename = filename.substring(audioIndex + 6); // 'audio/'.length = 6
            }
            
            // If it's a direct filename, use it as is
            if (!filename.includes('/')) {
              audioUrl = `/audio/${filename}?t=${Date.now()}`;
            } else {
              // Extract just the filename at the end
              const parts = filename.split('/');
              const lastPart = parts[parts.length - 1];
              audioUrl = `/audio/${lastPart}?t=${Date.now()}`;
            }
          }
          
          console.log("Original audio path:", originalUrl);
          console.log("Using audio URL:", audioUrl);
          
          // First try using XMLHttpRequest for better compatibility
          console.log("Attempting to load audio using XMLHttpRequest...");
          
          // Using a Promise to wrap XHR
          const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', audioUrl, true);
            xhr.responseType = 'arraybuffer';
            
            // Add detailed logging
            xhr.onprogress = (event) => {
              if (event.lengthComputable) {
                console.log(`Audio loading progress: ${Math.round((event.loaded / event.total) * 100)}%`);
              }
            };
            
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                console.log("XHR successful, received response with status:", xhr.status);
                if (xhr.response) {
                  console.log("XHR data received, size:", xhr.response.byteLength, "bytes");
                  resolve(xhr.response);
                } else {
                  reject(new Error("Empty response received"));
                }
              } else {
                console.error(`XHR failed with status: ${xhr.status}`);
                reject(new Error(`Failed to load audio file: HTTP ${xhr.status}`));
              }
            };
            
            xhr.onerror = () => {
              console.error("XHR network error occurred");
              reject(new Error("Network error while loading audio"));
            };
            
            xhr.send();
          });
          
          if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error("Audio file is empty (0 bytes)");
          }
          
          console.log("Audio data received, size:", arrayBuffer.byteLength, "bytes");
          
          try {
            console.log("Decoding audio data using Web Audio API...");
            const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
            console.log("Audio successfully decoded, duration:", audioBuffer.duration, "seconds, " +
                       "channels:", audioBuffer.numberOfChannels, 
                       "sample rate:", audioBuffer.sampleRate);
            
            audioBufferRef.current = audioBuffer;
            setAudioDuration(audioBuffer.duration);
            setIsLoaded(true);
            
            // Create audio nodes
            createAudioNodes();
            
            toast({
              title: "Audio loaded",
              description: `${data.track.title} is ready for mixing`,
            });
          } catch (decodeError) {
            console.error("Error decoding audio data:", decodeError);
            console.error("Audio format may be unsupported or file may be corrupted");
            toast({
              title: "Error decoding audio",
              description: "The audio file could not be processed. It may be corrupted or in an unsupported format.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error loading audio:", error);
          toast({
            title: "Error loading audio",
            description: error instanceof Error ? error.message : "Failed to load the audio file. Please try again.",
            variant: "destructive",
          });
        }
      };
      
      loadAudio();
    }
    
    return () => {
      // Clean up audio context when component unmounts
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [data, isLoaded, toast]);
  
  // Create audio processing nodes
  const createAudioNodes = () => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    
    // Create analyzer node
    analyserNodeRef.current = ctx.createAnalyser();
    analyserNodeRef.current.fftSize = 2048;
    
    // Create gain node
    gainNodeRef.current = ctx.createGain();
    gainNodeRef.current.gain.value = effectValues.gain;
    
    // Create filter nodes
    lowpassNodeRef.current = ctx.createBiquadFilter();
    lowpassNodeRef.current.type = "lowpass";
    lowpassNodeRef.current.frequency.value = effectValues.lowpass;
    
    highpassNodeRef.current = ctx.createBiquadFilter();
    highpassNodeRef.current.type = "highpass";
    highpassNodeRef.current.frequency.value = effectValues.highpass;
    
    // Create convolver (reverb) node
    convolverNodeRef.current = ctx.createConvolver();
    
    // Create delay node
    delayNodeRef.current = ctx.createDelay();
    delayNodeRef.current.delayTime.value = 0.5;
    
    // Create waveshaper (distortion) node
    waveShaperNodeRef.current = ctx.createWaveShaper();
    
    // Generate impulse response for reverb
    createImpulseResponse();
    
    // Generate distortion curve
    createDistortionCurve(effectValues.distortion * 400);
  };
  
  // Generate impulse response for reverb effect
  const createImpulseResponse = () => {
    if (!audioContextRef.current || !convolverNodeRef.current) return;
    
    const sampleRate = audioContextRef.current.sampleRate;
    const length = sampleRate * 2; // 2 seconds
    const impulse = audioContextRef.current.createBuffer(2, length, sampleRate);
    const leftChannel = impulse.getChannelData(0);
    const rightChannel = impulse.getChannelData(1);
    
    // Fill the buffer with noise and create reverb effect
    for (let i = 0; i < length; i++) {
      const n = i / length;
      // Decay curve
      const t = 10 * Math.exp(-n * 3);
      
      // Random noise
      leftChannel[i] = (Math.random() * 2 - 1) * t;
      rightChannel[i] = (Math.random() * 2 - 1) * t;
    }
    
    convolverNodeRef.current.buffer = impulse;
  };
  
  // Generate curve for distortion effect
  const createDistortionCurve = (amount: number) => {
    if (!waveShaperNodeRef.current) return;
    
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    
    waveShaperNodeRef.current.curve = curve;
    waveShaperNodeRef.current.oversample = "4x";
  };
  
  // Connect audio nodes based on effect values
  const connectAudioNodes = () => {
    if (!audioContextRef.current || !audioSourceRef.current) return;
    
    const source = audioSourceRef.current;
    
    // Reset connections
    source.disconnect();
    
    if (isEffectsEnabled) {
      // Connect nodes in series: source -> [effects chain] -> destination
      let currentNode: AudioNode = source;
      
      // Gain
      if (gainNodeRef.current && effectValues.gain !== EFFECTS.gain.default) {
        currentNode.connect(gainNodeRef.current);
        currentNode = gainNodeRef.current;
      }
      
      // Low-pass filter
      if (lowpassNodeRef.current && effectValues.lowpass !== EFFECTS.lowpass.default) {
        currentNode.connect(lowpassNodeRef.current);
        currentNode = lowpassNodeRef.current;
      }
      
      // High-pass filter
      if (highpassNodeRef.current && effectValues.highpass !== EFFECTS.highpass.default) {
        currentNode.connect(highpassNodeRef.current);
        currentNode = highpassNodeRef.current;
      }
      
      // Reverb
      if (convolverNodeRef.current && effectValues.reverb > 0) {
        // Split signal for dry/wet mix
        const dryGain = audioContextRef.current.createGain();
        const wetGain = audioContextRef.current.createGain();
        
        dryGain.gain.value = 1 - effectValues.reverb;
        wetGain.gain.value = effectValues.reverb;
        
        currentNode.connect(dryGain);
        currentNode.connect(convolverNodeRef.current);
        convolverNodeRef.current.connect(wetGain);
        
        dryGain.connect(audioContextRef.current.destination);
        wetGain.connect(audioContextRef.current.destination);
      } else {
        // If no reverb, connect to next node or destination
        currentNode.connect(audioContextRef.current.destination);
      }
      
      // Connect to analyzer for visualization
      if (analyserNodeRef.current) {
        source.connect(analyserNodeRef.current);
      }
    } else {
      // Bypass all effects
      source.connect(audioContextRef.current.destination);
      
      // Connect to analyzer for visualization
      if (analyserNodeRef.current) {
        source.connect(analyserNodeRef.current);
      }
    }
  };
  
  // Play audio with applied effects
  const playAudio = () => {
    if (!audioContextRef.current || !audioBufferRef.current) return;
    
    // Stop any currently playing audio
    stopAudio();
    
    // Resume audio context if suspended
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    
    // Create new source node
    audioSourceRef.current = audioContextRef.current.createBufferSource();
    audioSourceRef.current.buffer = audioBufferRef.current;
    
    // Connect nodes based on current effect settings
    connectAudioNodes();
    
    // Start playback
    const startTime = audioContextRef.current.currentTime;
    audioSourceRef.current.start(0, audioProgress);
    
    // Update progress
    const progressInterval = setInterval(() => {
      if (audioContextRef.current) {
        const elapsed = audioContextRef.current.currentTime - startTime + audioProgress;
        
        if (elapsed >= audioDuration) {
          setAudioProgress(0);
          setIsPlaying(false);
          clearInterval(progressInterval);
        } else {
          setAudioProgress(elapsed);
        }
      }
    }, 100);
    
    audioSourceRef.current.onended = () => {
      setIsPlaying(false);
      clearInterval(progressInterval);
    };
    
    setIsPlaying(true);
  };
  
  // Stop audio playback
  const stopAudio = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
  };
  
  // Toggle play/pause
  const togglePlayback = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playAudio();
    }
  };
  
  // Reset audio progress
  const resetProgress = () => {
    stopAudio();
    setAudioProgress(0);
  };
  
  // Update effect value
  const updateEffect = (effect: EffectType, value: number) => {
    setEffectValues(prev => ({ ...prev, [effect]: value }));
    
    // Apply effect change in real-time
    switch (effect) {
      case "gain":
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = value;
        }
        break;
      case "lowpass":
        if (lowpassNodeRef.current) {
          lowpassNodeRef.current.frequency.value = value;
        }
        break;
      case "highpass":
        if (highpassNodeRef.current) {
          highpassNodeRef.current.frequency.value = value;
        }
        break;
      case "distortion":
        createDistortionCurve(value * 400);
        break;
      case "reverb":
      case "delay":
        // For these effects, we need to reconnect nodes for wet/dry mix
        if (isPlaying) {
          connectAudioNodes();
        }
        break;
    }
  };
  
  // Load preset
  const loadPreset = (preset: PresetType) => {
    setSelectedPreset(preset);
    setEffectValues(PRESETS[preset]);
    
    // Apply all preset effects at once
    Object.entries(PRESETS[preset]).forEach(([effect, value]) => {
      updateEffect(effect as EffectType, value as number);
    });
    
    // Reconnect nodes with new settings
    if (isPlaying) {
      connectAudioNodes();
    }
    
    toast({
      title: "Preset loaded",
      description: `${preset.charAt(0).toUpperCase() + preset.slice(1)} preset applied`,
    });
  };
  
  // Toggle effects bypass
  const toggleEffects = () => {
    setIsEffectsEnabled(!isEffectsEnabled);
    
    // Reconnect nodes based on new bypass setting
    if (isPlaying) {
      connectAudioNodes();
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (!gainNodeRef.current) return;
    
    if (isMuted) {
      // Unmute
      updateEffect("gain", volumeBeforeMute);
      setIsMuted(false);
    } else {
      // Mute
      setVolumeBeforeMute(effectValues.gain);
      updateEffect("gain", 0);
      setIsMuted(true);
    }
  };
  
  // Apply effects and play through main player
  const applyAndPlay = () => {
    if (!data?.track) return;
    
    // In a real implementation, we would:
    // 1. Process the audio with the selected effects
    // 2. Create a temporary audio file
    // 3. Play the processed audio
    
    // For this prototype, we'll show a success message and play the original track
    toast({
      title: "Effects applied",
      description: "In a production app, this would process the audio with your effects",
    });
    
    playTrack(data.track, data.album);
  };
  
  // Download processed audio
  const downloadProcessedAudio = () => {
    // In a real implementation, we would:
    // 1. Process the audio with the selected effects
    // 2. Convert to downloadable format
    // 3. Trigger download
    
    toast({
      title: "Download initiated",
      description: "In a production app, this would download the processed audio",
    });
  };
  
  // Format time in seconds to MM:SS format
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="mt-2">Failed to load track. Please try again.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{data.track.title}</h1>
            {data.album && (
              <p className="text-muted-foreground">
                From album: {data.album.title} by {data.album.artist}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
            >
              Back
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Audio Mixer</CardTitle>
            <CardDescription>
              Apply and preview audio effects in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Waveform visualization */}
            <div className="mb-6 bg-muted rounded-md p-2">
              <Waveform 
                analyserNode={analyserNodeRef.current}
                isPlaying={isPlaying}
              />
              
              {/* Playback controls */}
              <div className="flex items-center gap-4 mt-4">
                <Button
                  onClick={togglePlayback}
                  disabled={!isLoaded}
                  variant="secondary"
                  size="sm"
                >
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button
                  onClick={resetProgress}
                  disabled={!isLoaded || audioProgress === 0}
                  variant="outline"
                  size="sm"
                >
                  Reset
                </Button>
                <div className="text-sm">
                  {formatTime(audioProgress)} / {formatTime(audioDuration)}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    onClick={toggleMute}
                    variant="ghost"
                    size="sm"
                    className="px-2"
                  >
                    {isMuted ? "Unmute" : "Mute"}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="effects-bypass" className="text-sm">
                      Effects:
                    </Label>
                    <Switch
                      id="effects-bypass"
                      checked={isEffectsEnabled}
                      onCheckedChange={toggleEffects}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Preset selector */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <Label>Presets</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadPreset("default")}
                  disabled={selectedPreset === "default"}
                >
                  Reset
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(PRESETS).map((preset) => (
                  <Button
                    key={preset}
                    variant={selectedPreset === preset ? "default" : "outline"}
                    size="sm"
                    onClick={() => loadPreset(preset as PresetType)}
                  >
                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* Effects controls */}
            <Tabs defaultValue="basic" className="mb-6">
              <TabsList>
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="filters">Filters</TabsTrigger>
                <TabsTrigger value="ambience">Ambience</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic">
                <div className="space-y-4">
                  {/* Gain control */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>
                        {EFFECTS.gain.label}: {effectValues.gain.toFixed(1)}
                      </Label>
                    </div>
                    <Slider
                      value={[effectValues.gain]}
                      min={EFFECTS.gain.min}
                      max={EFFECTS.gain.max}
                      step={EFFECTS.gain.step}
                      onValueChange={(values) => updateEffect("gain", values[0])}
                    />
                  </div>
                  
                  {/* Distortion control */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>
                        {EFFECTS.distortion.label}: {Math.round(effectValues.distortion * 100)}%
                      </Label>
                    </div>
                    <Slider
                      value={[effectValues.distortion]}
                      min={EFFECTS.distortion.min}
                      max={EFFECTS.distortion.max}
                      step={EFFECTS.distortion.step}
                      onValueChange={(values) => updateEffect("distortion", values[0])}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="filters">
                <div className="space-y-4">
                  {/* Low-pass filter control */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>
                        {EFFECTS.lowpass.label}: {effectValues.lowpass.toFixed(0)} Hz
                      </Label>
                    </div>
                    <Slider
                      value={[effectValues.lowpass]}
                      min={EFFECTS.lowpass.min}
                      max={EFFECTS.lowpass.max}
                      step={EFFECTS.lowpass.step}
                      onValueChange={(values) => updateEffect("lowpass", values[0])}
                    />
                  </div>
                  
                  {/* High-pass filter control */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>
                        {EFFECTS.highpass.label}: {effectValues.highpass.toFixed(0)} Hz
                      </Label>
                    </div>
                    <Slider
                      value={[effectValues.highpass]}
                      min={EFFECTS.highpass.min}
                      max={EFFECTS.highpass.max}
                      step={EFFECTS.highpass.step}
                      onValueChange={(values) => updateEffect("highpass", values[0])}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="ambience">
                <div className="space-y-4">
                  {/* Reverb control */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>
                        {EFFECTS.reverb.label}: {Math.round(effectValues.reverb * 100)}%
                      </Label>
                    </div>
                    <Slider
                      value={[effectValues.reverb]}
                      min={EFFECTS.reverb.min}
                      max={EFFECTS.reverb.max}
                      step={EFFECTS.reverb.step}
                      onValueChange={(values) => updateEffect("reverb", values[0])}
                    />
                  </div>
                  
                  {/* Delay control */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>
                        {EFFECTS.delay.label}: {Math.round(effectValues.delay * 100)}%
                      </Label>
                    </div>
                    <Slider
                      value={[effectValues.delay]}
                      min={EFFECTS.delay.min}
                      max={EFFECTS.delay.max}
                      step={EFFECTS.delay.step}
                      onValueChange={(values) => updateEffect("delay", values[0])}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <Separator className="my-6" />
            
            {/* Action buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={downloadProcessedAudio}
                disabled={!isLoaded}
              >
                Download with Effects
              </Button>
              <Button
                onClick={applyAndPlay}
                disabled={!isLoaded}
              >
                Apply Effects & Play
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}