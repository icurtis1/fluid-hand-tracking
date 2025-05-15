import React, { useEffect, useRef, useState } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { useResizable } from '../hooks/useResizable';

// Constants
const CANVAS_DIMENSIONS = {
  width: window.innerWidth < 768 ? 320 : 640,
  height: window.innerWidth < 768 ? 480 : 480
};

const HANDS_CONFIG = {
  maxNumHands: window.innerWidth < 768 ? 1 : 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
};

declare global {
  interface Window {
    Hands?: typeof Hands;
  }
}

interface Props {
  onHandUpdate: (handIndex: number, x: number, y: number) => void;
}

const MEDIAPIPE_URLS = {
  base: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240',
  fallback: 'https://unpkg.com/@mediapipe/hands@0.4.1675469240'
};

async function loadMediaPipeScript(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${MEDIAPIPE_URLS.base}/hands.js`;
    script.crossOrigin = 'anonymous';
    
    const checkHandsAvailability = () => {
      setTimeout(() => {
        if (window.Hands) {
          resolve();
        } else {
          reject(new Error('Hands object not found after script load'));
        }
      }, 500);
    };

    script.onload = checkHandsAvailability;
    script.onerror = () => {
      script.src = `${MEDIAPIPE_URLS.fallback}/hands.js`;
      script.onload = checkHandsAvailability;
      script.onerror = reject;
    };
    
    document.head.appendChild(script);
  });
}

async function setupCamera(videoRef: React.RefObject<HTMLVideoElement>): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { min: window.innerWidth < 768 ? 320 : 640 },
      height: { min: window.innerWidth < 768 ? 480 : 480 },
      aspectRatio: window.innerWidth < 768 ? 3/4 : 4/3,
      facingMode: 'user'
    }
  });
  
  if (!videoRef.current) throw new Error('Video element not found');
  
  videoRef.current.srcObject = stream;
  
  return new Promise((resolve) => {
    if (!videoRef.current) throw new Error('Video element not found');
    videoRef.current.onloadeddata = () => resolve(stream);
  });
}

export function HandTracking({ onHandUpdate }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<Hands | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const { ref: resizableRef, width, height } = useResizable({
    minWidth: window.innerWidth < 768 ? 120 : 240,
    maxWidth: window.innerWidth < 768 ? 240 : 480,
    aspectRatio: window.innerWidth < 768 ? 3/4 : 4/3
  });
  
  useEffect(() => {
    let mounted = true;
    
    async function initializeTracking() {
      console.log('[Tracking] Initializing:', new Date().toISOString());
      setIsLoading(true);

      try {
        await loadMediaPipeScript();
      } catch (error) {
        console.error('[MediaPipe] Failed to load script:', error);
        setError('Failed to load hand tracking library. Please check your connection and try again.');
        setIsLoading(false);
        return;
      }

      try {
        const stream = await setupCamera(videoRef);
        if (!mounted) return;
        streamRef.current = stream;
        setIsCameraReady(true);
      } catch (error) {
        console.error('[Camera] Error:', error);
        setError(`Camera access failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsLoading(false);
        return;
      }
      
      try {
        // Use the global Hands constructor
        const HandsConstructor = window.Hands || Hands;
        const hands = new HandsConstructor({
          locateFile: (file) => {
            return `${MEDIAPIPE_URLS.base}/${file}`;
          }
        });
        
        hands.setOptions(HANDS_CONFIG);
        
        await hands.initialize();

        hands.onResults((results: Results) => {
          if (!mounted) return;
          
          const canvas = canvasRef.current;
          if (!canvas) return;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw video frame
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
          
          // Set shadow properties for glow effect
          ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
          ctx.shadowBlur = 15;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          if (results.multiHandLandmarks) {
            results.multiHandLandmarks.forEach((landmarks, index) => {
              // Use index fingertip (8) for desktop, palm (9) for mobile
              const handPoint = window.innerWidth < 768 ? landmarks[9] : landmarks[8];
              if (handPoint) {
                // Draw large hand sphere first
                ctx.beginPath();
                ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
                ctx.strokeStyle = '#00FF00';
                ctx.lineWidth = 2;
                ctx.arc(
                  handPoint.x * canvas.width,
                  handPoint.y * canvas.height,
                  35, // Smaller visual indicator while keeping larger collision area
                  0,
                  2 * Math.PI
                );
                ctx.fill();
                ctx.stroke();
                
                // Reset shadow for landmarks
                ctx.shadowBlur = 0;
                
                // Map coordinates
                // Further increase scale factors for wider range of motion
                const scaleX = (window.innerWidth * 2.0) / canvas.width;
                const scaleY = (window.innerHeight * 2.0) / canvas.height;
                
                // Center the interaction area by adjusting the offset
                const offsetX = window.innerWidth * 0.5;
                const offsetY = window.innerHeight * 0.5;
                
                // Mirror the x coordinate since the video is flipped
                const mirroredX = window.innerWidth - (handPoint.x * canvas.width * scaleX - offsetX);
                
                const x = Math.max(0, Math.min(window.innerWidth, 
                  mirroredX));
                const y = Math.max(0, Math.min(window.innerHeight,
                  handPoint.y * canvas.height * scaleY - offsetY));
                
                onHandUpdate(index, x, y);
                
                // Draw landmarks
                ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
                landmarks.forEach(point => {
                  ctx.beginPath();
                  ctx.arc(point.x * canvas.width, point.y * canvas.height, 3, 0, 2 * Math.PI);
                  ctx.fill();
                });
              }
            });
          }
        });
        
        handsRef.current = hands;
        
        if (!videoRef.current) return;
        
        // Start processing frames
        const processFrame = async () => {
          if (!mounted || !videoRef.current || !handsRef.current) return;
          
          await handsRef.current.send({ image: videoRef.current });
          requestAnimationFrame(processFrame);
        };
        
        requestAnimationFrame(processFrame);
        setIsLoading(false);
        
      } catch (error) {
        console.error('[Tracking] Error:', error);
        setError(`Hand tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    }

    // Delay initialization slightly to ensure DOM is ready
    const initTimeout = setTimeout(() => {
      initializeTracking();
    }, 1000);
    
    return () => {
      mounted = false;
      clearTimeout(initTimeout);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, [onHandUpdate]);
  
  return (
    <div className={`fixed rounded-lg overflow-hidden shadow-lg ${
      window.innerWidth < 768 ? 'top-4 left-4' : 'top-4 left-4'
    }`}
      ref={resizableRef}
      style={{ 
        width: width,
        height: height,
        cursor: 'default'
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-green-100 flex items-center justify-center p-4">
          <p className="text-green-600 text-sm text-center">
            {isCameraReady ? 'Loading hand tracking...' : 'Initializing camera...'}
          </p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 bg-red-100 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-red-600 text-sm mb-3">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        className={`w-full h-full object-cover ${isCameraReady ? 'block' : 'hidden'}`}
        width={CANVAS_DIMENSIONS.width}
        height={CANVAS_DIMENSIONS.height}
        playsInline
        autoPlay
        muted
        style={{ 
          transform: 'scaleX(-1)',
          WebkitTransform: 'scaleX(-1)',
          objectFit: 'contain'
        }}
      />
      <div 
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-green-500/20 hover:bg-green-500/40 transition-colors rounded-bl"
        onMouseDown={(e) => e.stopPropagation()}
      />
      <canvas
        ref={canvasRef}
        width={CANVAS_DIMENSIONS.width}
        height={CANVAS_DIMENSIONS.height}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ 
          transform: 'scaleX(-1)',
          WebkitTransform: 'scaleX(-1)'
        }}
      />
    </div>
  );
}