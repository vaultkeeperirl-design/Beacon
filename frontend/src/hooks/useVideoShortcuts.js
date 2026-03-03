import { useEffect } from 'react';

export function useVideoShortcuts({ setIsPlaying, setIsMuted, toggleFullscreen }) {
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
  }, [setIsPlaying, setIsMuted, toggleFullscreen]);
}
