import { useState, useRef, useEffect, memo } from 'react';
import { useP2PSettings } from '../context/P2PContext';
import StreamSettings from './StreamSettings';
import VideoStatsOverlay from './VideoStatsOverlay';
import VideoControls from './VideoControls';

const VideoPlayer = memo(function VideoPlayer({ stream, streamUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Using useP2PSettings instead of useP2P to avoid unnecessary re-renders when stats update
  const { settings } = useP2PSettings();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

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
        if (err.name === 'NotAllowedError') {
          console.warn("Autoplay/Play blocked:", err);
          setAutoplayBlocked(true);
          setIsPlaying(false);
        } else {
          console.warn("Play error:", err);
          setIsPlaying(false);
        }
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

  const handleUnmuteAndPlay = () => {
    setAutoplayBlocked(false);
    setIsMuted(false);
    if (volume === 0) {
      setVolume(0.5);
    }
    setIsPlaying(true);
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden group shadow-2xl ring-1 ring-neutral-800"
    >
      <video
        ref={videoRef}
        src={!stream ? streamUrl : undefined}
        className="w-full h-full object-cover"
        autoPlay
        muted
        loop={!stream}
        playsInline
      />

      {autoplayBlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 backdrop-blur-sm">
          <button
            onClick={handleUnmuteAndPlay}
            className="flex flex-col items-center justify-center p-6 bg-beacon-600 hover:bg-beacon-500 rounded-xl text-white font-bold transition-all shadow-xl transform hover:-translate-y-1 hover:scale-105"
          >
            <span className="text-xl mb-2">▶ Click to Unmute & Play</span>
            <span className="text-sm font-normal opacity-80 text-center max-w-xs">Your browser blocked audio. Click here to enable sound and start watching.</span>
          </button>
        </div>
      )}

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
