import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Chat from './Chat';
import * as useSocketModule from '../hooks/useSocket';
import * as useP2PModule from '../context/P2PContext';

// Mock the hooks
vi.mock('../hooks/useSocket', () => ({
  useSocket: vi.fn(),
}));

vi.mock('../context/P2PContext', () => ({
  useP2PSettings: vi.fn(),
}));

describe('Chat Component - Palette Enhancements', () => {
  let mockSocket;

  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();

    mockSocket = {
      id: 'socket-123',
      connected: true,
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    };

    useSocketModule.useSocket.mockReturnValue({
      socket: mockSocket,
      isConnected: true,
    });

    useP2PModule.useP2PSettings.mockReturnValue({
      username: 'TestUser',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should show character counter only when input length > 400', () => {
    render(<Chat streamId="test-stream" />);
    const input = screen.getByPlaceholderText(/Send a message/i);

    // Initial state: no counter
    expect(screen.queryByText(/0\/500/)).not.toBeInTheDocument();

    // Change to 300 chars: still no counter
    fireEvent.change(input, { target: { value: 'a'.repeat(300) } });
    expect(screen.queryByText(/300\/500/)).not.toBeInTheDocument();

    // Change to 401 chars: counter should be visible
    fireEvent.change(input, { target: { value: 'a'.repeat(401) } });
    expect(screen.getByText('401/500')).toBeInTheDocument();
    expect(screen.getByText('401/500')).toHaveClass('text-beacon-500');

    // Change to 495 chars: counter should be red
    fireEvent.change(input, { target: { value: 'a'.repeat(495) } });
    expect(screen.getByText('495/500')).toHaveClass('text-red-500');
  });

  it('should toggle emote picker and add emote to input', () => {
    render(<Chat streamId="test-stream" />);
    const emoteButton = screen.getByRole('button', { name: /Open emotes menu/i });
    const input = screen.getByPlaceholderText(/Send a message/i);

    // Click to open
    fireEvent.click(emoteButton);
    expect(emoteButton).toHaveAttribute('aria-expanded', 'true');

    // Find and click an emote (e.g., 🚀)
    const rocketEmote = screen.getByText('🚀');
    fireEvent.click(rocketEmote);

    // Picker should close and input should have the emote
    expect(emoteButton).toHaveAttribute('aria-expanded', 'false');
    expect(input.value).toBe('🚀');
    expect(document.activeElement).toBe(input);
  });

  it('should close emote picker on Escape key', () => {
    render(<Chat streamId="test-stream" />);
    const emoteButton = screen.getByRole('button', { name: /Open emotes menu/i });

    fireEvent.click(emoteButton);
    expect(emoteButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(emoteButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('should close emote picker on click outside', () => {
    render(<Chat streamId="test-stream" />);
    const emoteButton = screen.getByRole('button', { name: /Open emotes menu/i });

    fireEvent.click(emoteButton);
    expect(emoteButton).toHaveAttribute('aria-expanded', 'true');

    // Click somewhere else in the document
    fireEvent.mouseDown(document.body);
    expect(emoteButton).toHaveAttribute('aria-expanded', 'false');
  });
});
