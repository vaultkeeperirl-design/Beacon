import { useEffect } from 'react';

export function useVideoShortcuts({ setIsPlaying, setIsMuted, toggleFullscreen, volume, handleVolumeChange, containerRef }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore shortcuts if the user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }

      const isVideoFocused = containerRef?.current && containerRef.current.contains(document.activeElement);

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
        case 'arrowup':
          if (isVideoFocused) {
            e.preventDefault();
            if (handleVolumeChange && volume !== undefined) {
              handleVolumeChange(Math.min(1, volume + 0.1));
            }
          }
          break;
        case 'arrowdown':
          if (isVideoFocused) {
            e.preventDefault();
            if (handleVolumeChange && volume !== undefined) {
              handleVolumeChange(Math.max(0, volume - 0.1));
            }
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setIsPlaying, setIsMuted, toggleFullscreen, volume, handleVolumeChange, containerRef]);
}
