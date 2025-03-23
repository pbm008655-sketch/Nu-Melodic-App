import { useEffect, useRef } from "react";

interface WaveformProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
}

export function Waveform({ analyserNode, isPlaying }: WaveformProps) {
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