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

describe('Chat Component - Optimistic UI', () => {
  let mockSocket;
  let socketCallback = null;

  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();

    socketCallback = null;
    mockSocket = {
      id: 'socket-123',
      connected: true,
      emit: vi.fn(),
      on: vi.fn((event, callback) => {
        if (event === 'chat-message') {
          socketCallback = callback;
        }
      }),
      off: vi.fn(),
    };

    // Use mockReturnValue on the imported mock functions
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

  it('should optimistically add a message immediately upon sending', () => {
    render(<Chat streamId="test-stream" />);

    const input = screen.getByPlaceholderText(/Send a message/i);
    // Find button by icon or simpler selector. The button is type="submit" in the form.
    const sendButton = screen.getByRole('button', { name: 'Send message' });

    fireEvent.change(input, { target: { value: 'Hello World' } });
    fireEvent.click(sendButton);

    // Message should be visible immediately (Optimistic Update)
    const message = screen.getByText('Hello World');
    expect(message).toBeInTheDocument();
  });

  it('should confirm the message when server broadcasts it back', () => {
    render(<Chat streamId="test-stream" />);

    const input = screen.getByPlaceholderText(/Send a message/i);
    const sendButton = screen.getByRole('button', { name: 'Send message' });

    fireEvent.change(input, { target: { value: 'Instant Message' } });
    fireEvent.click(sendButton);

    const message = screen.getByText('Instant Message');
    expect(message).toBeInTheDocument();

    // Simulate server response (echo)
    // The server sends back the message with its own ID but same text/user
    // AND crucially, it sets senderId to the socket ID.
    const serverMessage = {
      id: 'server-msg-1',
      user: 'TestUser',
      text: 'Instant Message',
      color: 'text-red-400',
      senderId: 'socket-123', // Matches our mock socket ID
    };

    act(() => {
      if (socketCallback) {
        socketCallback(serverMessage);
      }
    });

    // Message should still be there
    const confirmedMessage = screen.getByText('Instant Message');
    expect(confirmedMessage).toBeInTheDocument();

    // And should theoretically lose the pending state.
    // We can verify that we don't have duplicate messages.
    const messages = screen.getAllByText('Instant Message');
    expect(messages.length).toBe(1);
  });

  it('should show character counter when message is long', () => {
    render(<Chat streamId="test-stream" />);
    const input = screen.getByPlaceholderText(/Send a message/i);

    // Initial state: no counter
    expect(screen.queryByText(/\/ 500/)).not.toBeInTheDocument();

    // Change to 400 characters
    fireEvent.change(input, { target: { value: 'a'.repeat(400) } });
    expect(screen.getByText('400')).toBeInTheDocument();
    expect(screen.getByText('/ 500')).toBeInTheDocument();
  });

  it('should append emote when selected and restore focus', () => {
    render(<Chat streamId="test-stream" />);
    const input = screen.getByPlaceholderText(/Send a message/i);
    const emoteButton = screen.getByRole('button', { name: /Open emotes menu/i });

    fireEvent.change(input, { target: { value: 'Hello ' } });
    fireEvent.click(emoteButton);

    const fireEmote = screen.getByText('🔥');
    fireEvent.click(fireEmote);

    expect(input.value).toBe('Hello 🔥');
    expect(document.activeElement).toBe(input);
  });

  it('should return focus to trigger button when emote picker is dismissed via Escape', () => {
    render(<Chat streamId="test-stream" />);
    const emoteButton = screen.getByRole('button', { name: /Open emotes menu/i });

    // Open picker
    fireEvent.click(emoteButton);
    expect(screen.getByText('🔥')).toBeInTheDocument();

    // Dismiss with Escape
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    expect(screen.queryByText('🔥')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(emoteButton);
  });

  it('should return focus to trigger button when emote picker is dismissed via click outside', () => {
    render(<Chat streamId="test-stream" />);
    const emoteButton = screen.getByRole('button', { name: /Open emotes menu/i });

    // Open picker
    fireEvent.click(emoteButton);
    expect(screen.getByText('🔥')).toBeInTheDocument();

    // Dismiss with click outside
    fireEvent.mouseDown(document.body);

    expect(screen.queryByText('🔥')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(emoteButton);
  });
});
