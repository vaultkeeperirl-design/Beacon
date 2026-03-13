import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Watch from './Watch';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as P2PContext from '../context/P2PContext';
import * as FollowingContext from '../context/FollowingContext';
import * as SocketHook from '../hooks/useSocket';
import * as P2PStreamHook from '../hooks/useP2PStream';
import axios from 'axios';

// Mock child components to isolate the test
vi.mock('../components/VideoPlayer', () => ({
  default: () => <div data-testid="video-player">Video Player</div>
}));

vi.mock('../components/Chat', () => ({
  default: () => <div data-testid="chat">Chat</div>
}));

// Mock hooks - correct mocking pattern
vi.mock('../context/P2PContext', () => ({
  useP2PSettings: vi.fn(),
  useP2PStats: vi.fn(),
}));

vi.mock('../context/FollowingContext', () => ({
  useFollowing: vi.fn(),
}));

vi.mock('../hooks/useSocket', () => ({
  useSocket: vi.fn(),
}));

vi.mock('../hooks/useP2PStream', () => ({
  useP2PStream: vi.fn(),
}));

vi.mock('../components/StreamHealthIndicator', () => ({
  default: () => <div data-testid="stream-health-indicator">Health</div>
}));

vi.mock('../components/TipButton', () => ({
  default: () => <div data-testid="tip-button">Tip</div>
}));

vi.mock('axios');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Watch Page', () => {
  let mockSocket;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };

    // Setup default mock return values
    P2PContext.useP2PSettings.mockReturnValue({
      username: 'TestUser',
      setCurrentStreamId: vi.fn(),
    });

    P2PContext.useP2PStats.mockReturnValue({
      latency: 50,
    });

    FollowingContext.useFollowing.mockReturnValue({
      follow: vi.fn(),
      unfollow: vi.fn(),
      isFollowing: vi.fn().mockReturnValue(false),
    });

    SocketHook.useSocket.mockReturnValue({
      socket: mockSocket,
    });

    P2PStreamHook.useP2PStream.mockReturnValue({
      remoteStream: null,
      peers: [],
    });

    axios.get.mockResolvedValue({ data: { title: 'Test Stream Title', tags: 'test, tags', streamer: 'test-stream' } });
  });

  it('renders action buttons with accessible labels', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/watch/test-stream']}>
          <Routes>
            <Route path="/watch/:id" element={<Watch />} />
          </Routes>
        </MemoryRouter>
      );
    });

    // Check for "Like" button (ThumbsUp icon)
    // We search by label text which simulates screen reader access
    const likeButton = screen.getByLabelText(/like stream/i);
    expect(likeButton).toBeInTheDocument();

    // Check for "Share" button (Share2 icon)
    const shareButton = screen.getByLabelText(/share stream/i);
    expect(shareButton).toBeInTheDocument();

    // Check for "More" button (MoreHorizontal icon)
    const moreButton = screen.getByLabelText(/more options/i);
    expect(moreButton).toBeInTheDocument();
  });

  it('fetches stream info on load and sets it', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/watch/test-stream']}>
          <Routes>
            <Route path="/watch/:id" element={<Watch />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/streams/test-stream'));
    expect(screen.getByText('Test Stream Title')).toBeInTheDocument();

    const testTagLink = screen.getByRole('link', { name: /Search for tag: test/i });
    expect(testTagLink).toBeInTheDocument();
    expect(testTagLink).toHaveAttribute('href', '/browse?q=test');
    expect(screen.getByText('#test')).toBeInTheDocument();

    const tagsTagLink = screen.getByRole('link', { name: /Search for tag: tags/i });
    expect(tagsTagLink).toBeInTheDocument();
    expect(tagsTagLink).toHaveAttribute('href', '/browse?q=tags');
    expect(screen.getByText('#tags')).toBeInTheDocument();
  });

  it('toggles follow correctly', async () => {
    const mockFollow = vi.fn();
    const mockUnfollow = vi.fn();

    FollowingContext.useFollowing.mockReturnValue({
      follow: mockFollow,
      unfollow: mockUnfollow,
      isFollowing: vi.fn().mockReturnValue(false),
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/watch/test-stream']}>
          <Routes>
            <Route path="/watch/:id" element={<Watch />} />
          </Routes>
        </MemoryRouter>
      );
    });

    const followBtn = screen.getByRole('button', { name: /follow/i });
    expect(followBtn).toHaveTextContent('Follow');

    await userEvent.click(followBtn);
    expect(mockFollow).toHaveBeenCalledWith(expect.objectContaining({
      id: 'test-stream',
      title: 'Test Stream Title'
    }));

    // Now mock it as following
    FollowingContext.useFollowing.mockReturnValue({
      follow: mockFollow,
      unfollow: mockUnfollow,
      isFollowing: vi.fn().mockReturnValue(true),
    });

    // Re-render
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/watch/test-stream']}>
          <Routes>
            <Route path="/watch/:id" element={<Watch />} />
          </Routes>
        </MemoryRouter>
      );
    });

    const unfollowBtn = screen.getByRole('button', { name: /following/i });
    expect(unfollowBtn).toHaveTextContent('Following');

    await userEvent.click(unfollowBtn);
    expect(mockUnfollow).toHaveBeenCalledWith('test-stream');
  });

  it('redirects when stream-ended event is received with redirect', async () => {
    let streamEndedCallback;
    mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'stream-ended') {
        streamEndedCallback = cb;
      }
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/watch/test-stream']}>
          <Routes>
            <Route path="/watch/:id" element={<Watch />} />
          </Routes>
        </MemoryRouter>
      );
    });

    // trigger raid/host redirect
    act(() => {
      streamEndedCallback({ redirect: 'new-stream' });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/watch/new-stream');
  });

  it('redirects to home when stream-ended event is received without redirect', async () => {
    let streamEndedCallback;
    mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'stream-ended') {
        streamEndedCallback = cb;
      }
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/watch/test-stream']}>
          <Routes>
            <Route path="/watch/:id" element={<Watch />} />
          </Routes>
        </MemoryRouter>
      );
    });

    // trigger normal stream end
    act(() => {
      streamEndedCallback({});
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
