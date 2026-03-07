import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import VideoPlayer from './VideoPlayer';
import * as P2PContext from '../context/P2PContext';

// Mock dependencies
vi.mock('../context/P2PContext', () => ({
  useP2PSettings: vi.fn(),
}));

// Mock VideoControls to verify props are passed correctly
vi.mock('./VideoControls', () => ({
  default: ({ isPlaying, isMuted, isFullscreen, volume, onVolumeWheel }) => (
    <div data-testid="video-controls">
      <span data-testid="is-playing">{isPlaying.toString()}</span>
      <span data-testid="is-muted">{isMuted.toString()}</span>
      <span data-testid="is-fullscreen">{isFullscreen.toString()}</span>
      <span data-testid="volume">{volume.toString()}</span>
      <div data-testid="volume-control-container" onWheel={onVolumeWheel}></div>
    </div>
  )
}));

// Mock VideoStatsOverlay
vi.mock('./VideoStatsOverlay', () => ({
  default: () => <div data-testid="stats-overlay" />
}));

// Mock StreamSettings
vi.mock('./StreamSettings', () => ({
  default: () => <div data-testid="stream-settings" />
}));

describe('VideoPlayer Keyboard Shortcuts', () => {
  let playMock, pauseMock;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock P2P Context
    P2PContext.useP2PSettings.mockReturnValue({
      settings: { showStats: false, quality: '1080p60' }
    });

    // Mock HTMLMediaElement methods
    playMock = vi.fn().mockResolvedValue(undefined);
    pauseMock = vi.fn();

    window.HTMLMediaElement.prototype.play = playMock;
    window.HTMLMediaElement.prototype.pause = pauseMock;

    // Mock requestFullscreen
    Element.prototype.requestFullscreen = vi.fn().mockResolvedValue(undefined);
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
     vi.restoreAllMocks();
  });

  it('toggles playback when Space is pressed', () => {
    render(<VideoPlayer />);

    // Initial state is playing (true)
    expect(screen.getByTestId('is-playing')).toHaveTextContent('true');

    // Press Space
    fireEvent.keyDown(document, { key: ' ', code: 'Space' });

    // Should now be paused (false)
    expect(screen.getByTestId('is-playing')).toHaveTextContent('false');

    // Press Space again
    fireEvent.keyDown(document, { key: ' ', code: 'Space' });

    // Should be playing again (true)
    expect(screen.getByTestId('is-playing')).toHaveTextContent('true');
  });

  it('toggles playback when k is pressed', () => {
    render(<VideoPlayer />);

    // Initial state is playing
    expect(screen.getByTestId('is-playing')).toHaveTextContent('true');

    // Press k
    fireEvent.keyDown(document, { key: 'k', code: 'KeyK' });

    // Should now be paused
    expect(screen.getByTestId('is-playing')).toHaveTextContent('false');
  });

  it('toggles mute when m is pressed', () => {
    render(<VideoPlayer />);

    // Initial state is muted (true)
    expect(screen.getByTestId('is-muted')).toHaveTextContent('true');

    // Press m
    fireEvent.keyDown(document, { key: 'm', code: 'KeyM' });

    // Should now be unmuted (false)
    expect(screen.getByTestId('is-muted')).toHaveTextContent('false');
  });

  it('toggles fullscreen when f is pressed', () => {
    render(<VideoPlayer />);

    // Initial state is not fullscreen
    expect(screen.getByTestId('is-fullscreen')).toHaveTextContent('false');

    // Press f
    // Note: We can't easily mock the full fullscreen API state change in JSDOM perfectly
    // without more setup, but we can verify the function call if we spy on the handler
    // or we can simulate the document.fullscreenElement change if the component listens to it.

    // The component listens to 'fullscreenchange' event to update state.
    // So we need to trigger that manually after calling the method, or just check if requestFullscreen was called.

    fireEvent.keyDown(document, { key: 'f', code: 'KeyF' });
    expect(Element.prototype.requestFullscreen).toHaveBeenCalled();
  });

  it('changes volume when ArrowUp or ArrowDown is pressed', () => {
    // ⚡ Aura: Verify keyboard volume controls
    render(<VideoPlayer />);

    // Focus the container
    const container = screen.getByTestId('video-controls').parentElement;
    container.focus();

    // Initial volume is 1
    expect(screen.getByTestId('volume')).toHaveTextContent('1');

    // Press ArrowDown
    fireEvent.keyDown(document, { key: 'ArrowDown', code: 'ArrowDown' });
    expect(screen.getByTestId('volume')).toHaveTextContent('0.9');

    // Press ArrowDown again
    fireEvent.keyDown(document, { key: 'ArrowDown', code: 'ArrowDown' });
    expect(screen.getByTestId('volume')).toHaveTextContent('0.8');

    // Press ArrowUp
    fireEvent.keyDown(document, { key: 'ArrowUp', code: 'ArrowUp' });
    expect(screen.getByTestId('volume')).toHaveTextContent('0.9');
  });

  it('does NOT toggle shortcuts when typing in an input', () => {
    render(
      <div>
        <VideoPlayer />
        <input data-testid="chat-input" type="text" />
      </div>
    );

    const input = screen.getByTestId('chat-input');
    input.focus();

    // Initial state is playing
    expect(screen.getByTestId('is-playing')).toHaveTextContent('true');

    // Press Space while focused on input
    fireEvent.keyDown(input, { key: ' ', code: 'Space' });

    // Should still be playing
    expect(screen.getByTestId('is-playing')).toHaveTextContent('true');

    // Press m while focused on input
    fireEvent.keyDown(input, { key: 'm', code: 'KeyM' });

    // Should still be muted (initial state)
    expect(screen.getByTestId('is-muted')).toHaveTextContent('true');
  });

  it('toggles playback when the video element is clicked', () => {
    // ⚡ Aura: Verify click-to-play functionality works correctly
    render(<VideoPlayer />);

    // Initial state is playing
    expect(screen.getByTestId('is-playing')).toHaveTextContent('true');

    // Get the video element directly. It doesn't have a test ID, but it's the only video tag
    const videoElement = document.querySelector('video');
    expect(videoElement).toBeInTheDocument();

    // Click to pause
    fireEvent.click(videoElement);
    expect(screen.getByTestId('is-playing')).toHaveTextContent('false');

    // Click to play again
    fireEvent.click(videoElement);
    expect(screen.getByTestId('is-playing')).toHaveTextContent('true');
  });

  it('toggles fullscreen when the video element is double clicked', () => {
    // ⚡ Aura: Verify double-click-to-fullscreen functionality works correctly. This reduces the cognitive load of finding the small controls button.
    render(<VideoPlayer />);

    const videoElement = document.querySelector('video');
    expect(videoElement).toBeInTheDocument();

    fireEvent.doubleClick(videoElement);
    expect(Element.prototype.requestFullscreen).toHaveBeenCalled();
  });

  it('changes volume when mouse wheel is scrolled over the volume controls', () => {
    // ⚡ Aura: Verify scroll-to-change-volume functionality reduces precision friction
    render(<VideoPlayer />);

    // Initial volume is 1
    expect(screen.getByTestId('volume')).toHaveTextContent('1');

    const volumeContainer = screen.getByTestId('volume-control-container');

    // Scroll down (decrease volume)
    fireEvent.wheel(volumeContainer, { deltaY: 100 });
    expect(screen.getByTestId('volume')).toHaveTextContent('0.9');

    // Scroll up (increase volume)
    fireEvent.wheel(volumeContainer, { deltaY: -100 });
    expect(screen.getByTestId('volume')).toHaveTextContent('1');
  });
});
