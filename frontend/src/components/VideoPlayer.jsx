import { Maximize, Minimize, Volume2, VolumeX, Settings, Pause, Play } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useP2PSettings } from '../context/P2PContext';
import StreamSettings from './StreamSettings';
import VideoStatsOverlay from './VideoStatsOverlay';

export default function VideoPlayer({ streamUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Using useP2PSettings instead of useP2P to avoid unnecessary re-renders when stats update
  const { settings } = useP2PSettings();

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Synchronize playback state
  useEffect(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.play().catch(err => {
        console.warn("Autoplay/Play blocked:", err);
        setIsPlaying(false);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  // Synchronize mute state
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isMuted]);

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden group shadow-2xl ring-1 ring-neutral-800"
    >
      <video
        ref={videoRef}
        src={streamUrl}
        className="w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Stats Overlay */}
      {settings.showStats && <VideoStatsOverlay />}

      {/* Settings Modal */}
      {isSettingsOpen && <StreamSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}

      {/* Overlay UI */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              className="text-white hover:text-beacon-500 transition-colors"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? "Pause stream" : "Play stream"}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>
            <button
              className="text-white hover:text-beacon-500 transition-colors group/vol"
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2 text-sm font-bold text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
               <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
               LIVE
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-beacon-400 border border-beacon-500/30 px-2 py-0.5 rounded bg-beacon-500/10">
              P2P: {settings?.quality || '1080p60'}
            </span>
            <button
              className="text-white hover:text-beacon-500 transition-colors"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Open stream settings"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              className="text-white hover:text-beacon-500 transition-colors"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Progress Bar (Mock - live is always full) */}
        <div className="mt-4 h-1.5 w-full bg-neutral-800/50 rounded-full overflow-hidden backdrop-blur-sm">
           <div className="h-full bg-beacon-500 w-full relative animate-pulse">
           </div>
        </div>
      </div>
    </div>
  );
}
