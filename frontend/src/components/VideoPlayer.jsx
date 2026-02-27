import { useState, useRef, useEffect, memo } from 'react';
import { useP2PSettings } from '../context/P2PContext';
import StreamSettings from './StreamSettings';
import VideoStatsOverlay from './VideoStatsOverlay';
import VideoControls from './VideoControls';

const VideoPlayer = memo(function VideoPlayer({ streamUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore shortcuts if the user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault(); // Prevent scrolling for space
          setIsPlaying((prev) => !prev);
          break;
        case 'm':
          setIsMuted((prev) => !prev);
          break;
        case 'f':
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  // Synchronize volume state
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = volume;
  }, [volume]);

  const handleVolumeChange = (newVolume) => {
      setVolume(newVolume);
      if (newVolume > 0 && isMuted) {
          setIsMuted(false);
      } else if (newVolume === 0 && !isMuted) {
          setIsMuted(true);
      }
  };

  const handleMuteToggle = () => {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      if (!newMutedState && volume === 0) {
          setVolume(0.5); // Default to 50% if unmuting from 0
      }
  };

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
        onMuteToggle={handleMuteToggle}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isFullscreen={isFullscreen}
        onFullscreenToggle={toggleFullscreen}
        onSettingsToggle={() => setIsSettingsOpen(true)}
        quality={settings?.quality || '1080p60'}
      />
    </div>
  );
});

export default VideoPlayer;
