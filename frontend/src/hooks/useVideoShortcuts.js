import { useEffect } from 'react';

/**
 * Custom hook to manage global keyboard shortcuts for a video player component.
 *
 * Attaches a `keydown` event listener to the document to handle common media
 * controls (play/pause, mute/unmute, fullscreen, volume adjustment).
 * It automatically ignores key presses when the user is interacting with form
 * inputs (`<input>`, `<textarea>`) to prevent unintended video controls while typing.
 * Volume controls (Up/Down arrows) are explicitly scoped to require the video
 * container to be actively focused to avoid intercepting global page scrolling.
 *
 * @param {Object} props - The configuration object for the shortcuts.
 * @param {React.Dispatch<React.SetStateAction<boolean>>} props.setIsPlaying - Function to toggle the playing state (Spacebar, 'k').
 * @param {React.Dispatch<React.SetStateAction<boolean>>} props.setIsMuted - Function to toggle the muted state ('m').
 * @param {Function} props.toggleFullscreen - Function to toggle fullscreen mode ('f').
 * @param {number} [props.volume] - The current volume level (0.0 to 1.0). Required for volume adjustments.
 * @param {Function} [props.handleVolumeChange] - Function to update the volume level (Up/Down arrows).
 * @param {React.RefObject<HTMLElement>} props.containerRef - Ref to the main video container element, used to check focus for arrow key actions.
 */
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
