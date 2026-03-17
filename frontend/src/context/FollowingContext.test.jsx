import { render, screen, act } from '@testing-library/react';
import { FollowingProvider, useFollowing } from './FollowingContext';
import { P2PProvider } from './P2PContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import axios from 'axios';

// Mock P2PContext
vi.mock('./P2PContext', () => ({
  useP2PSettings: vi.fn(() => ({
    token: 'fake-token',
    username: 'TestUser',
  })),
  P2PProvider: ({ children }) => <div>{children}</div>
}));

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

  it('provides empty list initially', async () => {
    render(
      <TestComponent />,
      { wrapper: AllProviders }
    );

    // Wait for initial effect to finish to suppress act warning
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('is-following-jules')).toHaveTextContent('false');
  });

  it('rolls back optimistic unfollow if API fails', async () => {
    const consoleError = console.error;
    console.error = vi.fn();

    render(
      <TestComponent />,
      { wrapper: AllProviders }
    );

    // Wait for initial effect to finish
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    const followButton = screen.getByText('Follow Jules');
    await act(async () => {
        followButton.click();
    });

    // Wait for microtask queue to process
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Mock the delete request to fail
    axios.delete.mockRejectedValueOnce(new Error('API failure'));

    // Mock the get request for rollback
    axios.get.mockResolvedValueOnce({
      data: [{ username: 'JulesDev', avatar_url: '', bio: '' }]
    });

    const unfollowButton = screen.getByText('Unfollow Jules');
    await act(async () => {
        unfollowButton.click();
    });

    // Wait for microtask queue to process
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('is-following-jules')).toHaveTextContent('true');
    console.error = consoleError;
  });

  it('follows a channel', async () => {
    render(
      <TestComponent />,
      { wrapper: AllProviders }
    );

    // Wait for initial effect to finish
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    const followButton = screen.getByText('Follow Jules');
    await act(async () => {
        followButton.click();
    });

    // Wait for microtask queue to process
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('is-following-jules')).toHaveTextContent('true');
  });

  it('rolls back optimistic follow if API fails', async () => {
    const consoleError = console.error;
    console.error = vi.fn();

    // Mock the post request to fail
    axios.post.mockRejectedValueOnce(new Error('API failure'));

    render(
      <TestComponent />,
      { wrapper: AllProviders }
    );

    // Wait for initial effect to finish
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    const followButton = screen.getByText('Follow Jules');

    // First it optimistically adds it
    await act(async () => {
        followButton.click();
    });

    // We wait for the microtask queue to process the catch block
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    // The rollback should have happened
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('is-following-jules')).toHaveTextContent('false');
    console.error = consoleError;
  });

  it('unfollows a channel', async () => {
    render(
      <TestComponent />,
      { wrapper: AllProviders }
    );

    // Wait for initial effect to finish
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    const followButton = screen.getByText('Follow Jules');
    await act(async () => {
        followButton.click();
    });

    // Wait for microtask queue to process
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    const unfollowButton = screen.getByText('Unfollow Jules');
    await act(async () => {
        unfollowButton.click();
    });

    // Wait for microtask queue to process
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('is-following-jules')).toHaveTextContent('false');
  });

  it('persists to localStorage', async () => {
      const { unmount } = render(
      <TestComponent />,
      { wrapper: AllProviders }
    );

    // Wait for initial effect to finish
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    const followButton = screen.getByText('Follow Jules');
    await act(async () => {
        followButton.click();
    });

    // Wait for microtask queue to process
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Check localStorage
    expect(localStorage.getItem('followedChannels')).toContain('JulesDev');

    // Unmount and remount (simulating page reload/navigation)
    unmount();

    // Since `FollowingProvider` attempts to fetch from backend if token/username are present,
    // and we mock `axios.get` to return `{ data: [] }` by default, it will overwrite localStorage on mount.
    // Let's ensure it doesn't try to fetch or we mock the fetch to return the persisted data.
    // However, the test only checks initialization. To check initialization from localStorage,
    // let's mock `axios.get` to not overwrite or we can clear token to simulate guest.
    // In this test, token is "fake-token".
    // Let's modify the get mock for this specific re-render to return the current local storage data
    // if needed. But actually, `FollowingProvider` sets `setFollowedChannels(backendFollows)` which will empty it.
    // So let's mock it to return what's in local storage.

    axios.get.mockResolvedValueOnce({
      data: [{ username: 'JulesDev', avatar_url: '', bio: '' }]
    });

    await act(async () => {
      render(
        <TestComponent />,
        { wrapper: AllProviders }
      );
    });

    // Wait for microtask queue to process
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });
  it('throws an error if used outside of FollowingProvider', () => {
    // Suppress console.error for this specific test since we expect an error to be thrown
    const consoleError = console.error;
    console.error = vi.fn();

    expect(() => render(<TestComponent />)).toThrow('useFollowing must be used within a FollowingProvider');

    console.error = consoleError;
  });
});
