
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, SkipBack, SkipForward } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  title: string;
  onEnded?: () => void;
  autoPlay?: boolean;
}

const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, title, onEnded, autoPlay = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // Handle YouTube Shorts
    if (url.includes('/shorts/')) {
      const id = url.split('/shorts/')[1].split(/[?#]/)[0];
      return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&origin=${window.location.origin}`;
    }

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    
    if (id) {
      return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&origin=${window.location.origin}`;
    }
    return url;
  };

  const isYouTube = src.includes('youtube.com') || src.includes('youtu.be') || src.includes('youtube-nocookie.com');
  const sanitizedSrc = getEmbedUrl(src);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube) {
      if (isYouTube) {
        setIsLoading(false);
      }
      return;
    }

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    const updateDuration = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('error', handleError);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    if (autoPlay) {
      video.play().catch(() => {
        // Autoplay blocked by browser policy
        setIsPlaying(false);
      });
    }

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('error', handleError);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [src, isYouTube, autoPlay, onEnded]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = (parseFloat(e.target.value) / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setProgress(parseFloat(e.target.value));
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) setVolume(0);
      else setVolume(videoRef.current.volume || 1);
    }
  };

  const toggleFullScreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative aspect-video w-full bg-black rounded-[2rem] md:rounded-[3.5rem] border-[4px] md:border-[8px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] md:shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] overflow-hidden group mb-8"
    >
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm p-8 flex flex-col items-center justify-center space-y-8">
          <div className="w-16 h-16 md:w-32 md:h-32 border-[8px] md:border-[12px] border-black border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-lg md:text-xl font-black uppercase italic tracking-tighter">Initializing Module Stream...</p>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 z-20 bg-rose-50 p-8 flex flex-col items-center justify-center space-y-6 text-center">
          <div className="text-4xl md:text-6xl">⚠️</div>
          <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-rose-600">Video Link Severed</h3>
          <p className="text-xs md:text-sm font-bold text-gray-500 uppercase">The resource at this address is currently unreachable or invalid.</p>
          <button onClick={() => window.location.reload()} className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] md:text-xs">Re-Establish Connection</button>
        </div>
      )}

      {isYouTube && sanitizedSrc ? (
        <iframe 
          className="w-full h-full" 
          src={sanitizedSrc} 
          title={title} 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowFullScreen 
          onLoad={() => setIsLoading(false)}
        ></iframe>
      ) : (
        <>
          <video 
            ref={videoRef} 
            src={src} 
            className="w-full h-full cursor-pointer object-contain" 
            onClick={togglePlay} 
            playsInline 
          />
          
          {/* Custom Controls Overlay */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 md:p-8 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <div className="space-y-4">
              {/* Neubrutalist Seek Bar */}
              <div className="relative w-full group/seek h-4 flex items-center">
                <div className="absolute w-full h-2 md:h-3 bg-white/20 border-2 border-black rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-100" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="0.1"
                  value={progress} 
                  onChange={handleSeek}
                  className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
              
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3 md:gap-6">
                  <button onClick={togglePlay} className="hover:scale-110 transition-transform active:scale-95">
                    {isPlaying ? <Pause size={20} className="md:w-8 md:h-8" fill="currentColor" /> : <Play size={20} className="md:w-8 md:h-8" fill="currentColor" />}
                  </button>

                  <div className="hidden md:flex items-center gap-3">
                    <button onClick={() => skip(-10)} className="hover:text-blue-400 transition-colors">
                      <SkipBack size={20} />
                    </button>
                    <button onClick={() => skip(10)} className="hover:text-blue-400 transition-colors">
                      <SkipForward size={20} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 md:gap-3 group/volume">
                    <button onClick={toggleMute} className="hover:text-blue-400 transition-colors">
                      {isMuted || volume === 0 ? <VolumeX size={18} className="md:w-6 md:h-6" /> : <Volume2 size={18} className="md:w-6 md:h-6" />}
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05" 
                      value={volume} 
                      onChange={handleVolumeChange}
                      className="w-16 md:w-0 md:group-hover/volume:w-24 transition-all h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-white"
                    />
                  </div>
                  
                  <span className="text-[10px] md:text-xs font-black font-mono tracking-wider tabular-nums">
                    {formatTime(currentTime)} <span className="text-white/40">/</span> {formatTime(duration)}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 md:gap-6">
                   <button onClick={() => { if(videoRef.current) videoRef.current.currentTime = 0; }} className="hover:rotate-[-90deg] transition-transform hidden md:block" title="Restart">
                     <RotateCcw size={20} />
                   </button>
                   <button onClick={toggleFullScreen} className="hover:scale-110 transition-transform" title="Full Screen">
                     <Maximize size={20} />
                   </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoPlayer;
