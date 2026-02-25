import { render, screen, act } from '@testing-library/react';
import { FollowingProvider, useFollowing } from './FollowingContext';
import { describe, it, expect, beforeEach } from 'vitest';

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

describe('FollowingContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides empty list initially', () => {
    render(
      <FollowingProvider>
        <TestComponent />
      </FollowingProvider>
    );

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('is-following-jules')).toHaveTextContent('false');
  });

  it('follows a channel', () => {
    render(
      <FollowingProvider>
        <TestComponent />
      </FollowingProvider>
    );

    const followButton = screen.getByText('Follow Jules');
    act(() => {
        followButton.click();
    });

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('is-following-jules')).toHaveTextContent('true');
  });

  it('unfollows a channel', () => {
    render(
      <FollowingProvider>
        <TestComponent />
      </FollowingProvider>
    );

    const followButton = screen.getByText('Follow Jules');
    act(() => {
        followButton.click();
    });

    const unfollowButton = screen.getByText('Unfollow Jules');
    act(() => {
        unfollowButton.click();
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('is-following-jules')).toHaveTextContent('false');
  });

  it('persists to localStorage', () => {
      const { unmount } = render(
      <FollowingProvider>
        <TestComponent />
      </FollowingProvider>
    );

    const followButton = screen.getByText('Follow Jules');
    act(() => {
        followButton.click();
    });

    // Check localStorage
    expect(localStorage.getItem('followedChannels')).toContain('JulesDev');

    // Unmount and remount (simulating page reload/navigation)
    unmount();

    render(
      <FollowingProvider>
        <TestComponent />
      </FollowingProvider>
    );

    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });
});
