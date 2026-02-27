import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VideoControls from './VideoControls';

describe('VideoControls', () => {
  const defaultProps = {
    isPlaying: true,
    onPlayToggle: vi.fn(),
    isMuted: false,
    onMuteToggle: vi.fn(),
    volume: 1,
    onVolumeChange: vi.fn(),
    isFullscreen: false,
    onFullscreenToggle: vi.fn(),
    onSettingsToggle: vi.fn(),
    quality: '1080p60'
  };

  it('renders correctly with default props', () => {
    render(<VideoControls {...defaultProps} />);
    expect(screen.getByLabelText('Pause stream')).toBeInTheDocument();
    expect(screen.getByLabelText('Mute audio')).toBeInTheDocument();
    expect(screen.getByLabelText('Enter Fullscreen')).toBeInTheDocument();
    expect(screen.getByText('P2P: 1080p60')).toBeInTheDocument();
    expect(screen.getByLabelText('Volume')).toBeInTheDocument();
  });

  it('renders Play button when not playing', () => {
    render(<VideoControls {...defaultProps} isPlaying={false} />);
    expect(screen.getByLabelText('Play stream')).toBeInTheDocument();
  });

  it('renders Unmute button when muted', () => {
    render(<VideoControls {...defaultProps} isMuted={true} />);
    expect(screen.getByLabelText('Unmute audio')).toBeInTheDocument();
  });

  it('renders Exit Fullscreen button when in fullscreen', () => {
    render(<VideoControls {...defaultProps} isFullscreen={true} />);
    expect(screen.getByLabelText('Exit Fullscreen')).toBeInTheDocument();
  });

  it('calls onPlayToggle when play/pause button is clicked', () => {
    render(<VideoControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Pause stream'));
    expect(defaultProps.onPlayToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onMuteToggle when volume button is clicked', () => {
    render(<VideoControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Mute audio'));
    expect(defaultProps.onMuteToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onVolumeChange when volume slider is changed', () => {
    render(<VideoControls {...defaultProps} />);
    const slider = screen.getByLabelText('Volume');
    fireEvent.change(slider, { target: { value: '0.5' } });
    expect(defaultProps.onVolumeChange).toHaveBeenCalledWith(0.5);
  });

  it('calls onFullscreenToggle when fullscreen button is clicked', () => {
    render(<VideoControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Enter Fullscreen'));
    expect(defaultProps.onFullscreenToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onSettingsToggle when settings button is clicked', () => {
    render(<VideoControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Open stream settings'));
    expect(defaultProps.onSettingsToggle).toHaveBeenCalledTimes(1);
  });
});
