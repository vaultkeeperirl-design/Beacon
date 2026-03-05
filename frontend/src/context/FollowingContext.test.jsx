import { render, screen, act } from '@testing-library/react';
import { FollowingProvider, useFollowing } from './FollowingContext';
import { P2PProvider } from './P2PContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock axios to avoid network calls during tests
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  }
}));

const TestComponent = () => {
  const { followedChannels, follow, unfollow, isFollowing } = useFollowing();

  return (
    <div>
      <div data-testid="count">{followedChannels.length}</div>
      <div data-testid="is-following-jules">{isFollowing('JulesDev').toString()}</div>
      <button onClick={() => follow({ id: 'JulesDev', name: 'JulesDev' })}>
        Follow Jules
      </button>
      <button onClick={() => unfollow('JulesDev')}>
        Unfollow Jules
      </button>
    </div>
  );
};

const AllProviders = ({ children }) => (
  <P2PProvider>
    <FollowingProvider>
      {children}
    </FollowingProvider>
  </P2PProvider>
);

describe('FollowingContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('provides empty list initially', () => {
    render(
      <TestComponent />,
      { wrapper: AllProviders }
    );

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('is-following-jules')).toHaveTextContent('false');
  });

  it('follows a channel', async () => {
    render(
      <TestComponent />,
      { wrapper: AllProviders }
    );

    const followButton = screen.getByText('Follow Jules');
    await act(async () => {
        followButton.click();
    });

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('is-following-jules')).toHaveTextContent('true');
  });

  it('unfollows a channel', async () => {
    render(
      <TestComponent />,
      { wrapper: AllProviders }
    );

    const followButton = screen.getByText('Follow Jules');
    await act(async () => {
        followButton.click();
    });

    const unfollowButton = screen.getByText('Unfollow Jules');
    await act(async () => {
        unfollowButton.click();
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('is-following-jules')).toHaveTextContent('false');
  });

  it('persists to localStorage', async () => {
      const { unmount } = render(
      <TestComponent />,
      { wrapper: AllProviders }
    );

    const followButton = screen.getByText('Follow Jules');
    await act(async () => {
        followButton.click();
    });

    // Check localStorage
    expect(localStorage.getItem('followedChannels')).toContain('JulesDev');

    // Unmount and remount (simulating page reload/navigation)
    unmount();

    await act(async () => {
      render(
        <TestComponent />,
        { wrapper: AllProviders }
      );
    });

    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });
});
