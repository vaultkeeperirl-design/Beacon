import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Watch from './Watch';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as P2PContext from '../context/P2PContext';
import * as FollowingContext from '../context/FollowingContext';
import * as SocketHook from '../hooks/useSocket';

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
}));

vi.mock('../context/FollowingContext', () => ({
  useFollowing: vi.fn(),
}));

vi.mock('../hooks/useSocket', () => ({
  useSocket: vi.fn(),
}));

describe('Watch Page Accessibility', () => {
  beforeEach(() => {
    // Setup default mock return values
    P2PContext.useP2PSettings.mockReturnValue({
      setCurrentStreamId: vi.fn(),
    });

    FollowingContext.useFollowing.mockReturnValue({
      follow: vi.fn(),
      unfollow: vi.fn(),
      isFollowing: vi.fn().mockReturnValue(false),
    });

    SocketHook.useSocket.mockReturnValue({
      socket: {
        on: vi.fn(),
        off: vi.fn(),
      },
    });
  });

  it('renders action buttons with accessible labels', () => {
    render(
      <MemoryRouter initialEntries={['/watch/test-stream']}>
        <Routes>
          <Route path="/watch/:id" element={<Watch />} />
        </Routes>
      </MemoryRouter>
    );

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
});
