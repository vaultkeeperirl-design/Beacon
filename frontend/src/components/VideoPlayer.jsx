import { useState, useRef, useEffect, memo } from 'react';
import { useP2PSettings } from '../context/P2PContext';
import StreamSettings from './StreamSettings';
import VideoStatsOverlay from './VideoStatsOverlay';
import VideoControls from './VideoControls';

const VideoPlayer = memo(function VideoPlayer({ streamUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" }) {
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

      {/* Video Controls */}
      <VideoControls
        isPlaying={isPlaying}
        onPlayToggle={() => setIsPlaying(!isPlaying)}
        isMuted={isMuted}
        onMuteToggle={() => setIsMuted(!isMuted)}
        isFullscreen={isFullscreen}
        onFullscreenToggle={toggleFullscreen}
        onSettingsToggle={() => setIsSettingsOpen(true)}
        quality={settings?.quality || '1080p60'}
      />
    </div>
  );
});

export default VideoPlayer;
