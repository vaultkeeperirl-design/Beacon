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
  default: ({ isPlaying, isMuted, isFullscreen }) => (
    <div data-testid="video-controls">
      <span data-testid="is-playing">{isPlaying.toString()}</span>
      <span data-testid="is-muted">{isMuted.toString()}</span>
      <span data-testid="is-fullscreen">{isFullscreen.toString()}</span>
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
});
