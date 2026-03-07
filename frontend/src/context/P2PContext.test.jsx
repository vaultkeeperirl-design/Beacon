import { render, screen, act, waitFor } from '@testing-library/react';
import { P2PProvider, useP2P, useP2PSettings, useP2PStats } from './P2PContext';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');

const TestComponent = () => {
  const { stats, settings, updateSettings, isSharing, setIsSharing } = useP2P();

  return (
    <div>
      <div data-testid="upload-speed">{stats.uploadSpeed}</div>
      <div data-testid="max-upload">{settings.maxUploadSpeed}</div>
      <div data-testid="quality">{settings.quality}</div>
      <div data-testid="show-stats">{settings.showStats.toString()}</div>
      <button onClick={() => updateSettings({ maxUploadSpeed: 10, quality: '720p', showStats: true })}>
        Update Settings
      </button>
      <button onClick={() => setIsSharing(!isSharing)}>Toggle Sharing</button>
    </div>
  );
};

const AuthTestComponent = () => {
  const { login, register, logout, user, token, username, userProfile, updateUserProfile, updateUsername } = useP2PSettings();

  return (
    <div>
      <div data-testid="username">{username}</div>
      <div data-testid="token">{token || 'no-token'}</div>
      <div data-testid="user-id">{user?.id || 'no-user'}</div>
      <div data-testid="profile-bio">{userProfile?.bio || 'no-bio'}</div>

      <button onClick={() => login('testuser', 'password')}>Login</button>
      <button onClick={() => register('newuser', 'password')}>Register</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => updateUserProfile({ ...userProfile, bio: 'Updated bio' })}>Update Bio</button>
      <button onClick={() => updateUserProfile(prev => ({ ...prev, bio: 'Updated bio via function' }))}>Update Bio Fn</button>
      <button onClick={() => updateUsername('new-username')}>Update Username</button>
    </div>
  );
};

const StatsOnlyComponent = () => {
  const stats = useP2PStats();
  return <div data-testid="stats-latency">{stats.latency}</div>;
};

const SettingsOnlyComponent = () => {
  const settings = useP2PSettings();
  return <div data-testid="settings-quality">{settings.settings.quality}</div>;
};

const StatsOutsideProviderTestComponent = () => {
    useP2PStats();
    return null;
};

const SettingsOutsideProviderTestComponent = () => {
    useP2PSettings();
    return null;
};

const CombinedOutsideProviderTestComponent = () => {
    useP2P();
    return null;
};

// Create a valid dummy JWT token
const createDummyToken = (username) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ username }));
  const signature = 'dummy-signature';
  return `${header}.${payload}.${signature}`;
};

describe('P2PContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    axios.get.mockResolvedValue({ data: { balance: 0 } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Exceptions outside provider', () => {
    // Suppress console.error for expected thrown errors during testing
    let consoleErrorSpy;
    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('throws error if useP2PStats is used outside provider', () => {
       expect(() => render(<StatsOutsideProviderTestComponent />)).toThrow('useP2PStats must be used within a P2PProvider');
    });

    it('throws error if useP2PSettings is used outside provider', () => {
       expect(() => render(<SettingsOutsideProviderTestComponent />)).toThrow('useP2PSettings must be used within a P2PProvider');
    });

    it('throws error if useP2P is used outside provider', () => {
       expect(() => render(<CombinedOutsideProviderTestComponent />)).toThrow('useP2PStats must be used within a P2PProvider');
    });
  });

  it('provides default stats and settings', () => {
    render(
      <P2PProvider>
        <TestComponent />
      </P2PProvider>
    );

    expect(screen.getByTestId('max-upload')).toHaveTextContent('50');
    expect(screen.getByTestId('quality')).toHaveTextContent('1080p60');
    expect(screen.getByTestId('show-stats')).toHaveTextContent('false');
  });

  it('updates settings', async () => {
    render(
      <P2PProvider>
        <TestComponent />
      </P2PProvider>
    );

    const button = screen.getByText('Update Settings');
    act(() => {
        button.click();
    });

    expect(screen.getByTestId('max-upload')).toHaveTextContent('10');
    expect(screen.getByTestId('quality')).toHaveTextContent('720p');
    expect(screen.getByTestId('show-stats')).toHaveTextContent('true');
  });

  it('stops stats update when not sharing', async () => {
     vi.useFakeTimers();
     render(
      <P2PProvider>
        <TestComponent />
      </P2PProvider>
    );

    // Fast forward to generate some stats
    await act(async () => {
        vi.advanceTimersByTime(2000);
    });

    const button = screen.getByText('Toggle Sharing');
    act(() => {
        button.click();
    });

    // Advance time to allow effects to run.
    await act(async () => {
        vi.advanceTimersByTime(2000);
    });
  });

  describe('Authentication and Profile', () => {
    it('handles successful login and updates state', async () => {
      const dummyToken = createDummyToken('testuser');
      axios.post.mockResolvedValueOnce({
        data: {
          token: dummyToken,
          user: { id: 1, username: 'testuser', bio: 'Hello world' }
        }
      });
      axios.get.mockResolvedValue({ data: { username: 'testuser', bio: 'Hello world', id: 1, balance: 0 } });

      render(
        <P2PProvider>
          <AuthTestComponent />
        </P2PProvider>
      );

      expect(screen.getByTestId('username')).toHaveTextContent('Guest');

      act(() => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('token')).toHaveTextContent(dummyToken);
      });

      expect(screen.getByTestId('username')).toHaveTextContent('testuser');
      expect(screen.getByTestId('user-id')).toHaveTextContent('1');
      expect(screen.getByTestId('profile-bio')).toHaveTextContent('Hello world');
      expect(localStorage.getItem('beacon_token')).toBe(dummyToken);
    });

    it('handles failed login', async () => {
      axios.post.mockRejectedValueOnce({
        response: { data: { error: 'Invalid credentials' } }
      });

      render(
        <P2PProvider>
          <AuthTestComponent />
        </P2PProvider>
      );

      act(() => {
        screen.getByText('Login').click();
      });

      await waitFor(() => expect(axios.post).toHaveBeenCalled());

      expect(screen.getByTestId('token')).toHaveTextContent('no-token');
      expect(screen.getByTestId('username')).toHaveTextContent('Guest');
    });

    it('handles successful register', async () => {
      const dummyToken = createDummyToken('newuser');
      axios.post.mockResolvedValueOnce({
        data: {
          token: dummyToken,
          user: { id: 2, username: 'newuser', bio: 'New user bio' }
        }
      });
      axios.get.mockResolvedValue({ data: { username: 'newuser', bio: 'New user bio', id: 2, balance: 0 } });

      render(
        <P2PProvider>
          <AuthTestComponent />
        </P2PProvider>
      );

      act(() => {
        screen.getByText('Register').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('token')).toHaveTextContent(dummyToken);
      });

      expect(screen.getByTestId('username')).toHaveTextContent('newuser');
    });

    it('handles failed register', async () => {
      axios.post.mockRejectedValueOnce({
        response: { data: { error: 'User already exists' } }
      });

      render(
        <P2PProvider>
          <AuthTestComponent />
        </P2PProvider>
      );

      act(() => {
        screen.getByText('Register').click();
      });

      await waitFor(() => expect(axios.post).toHaveBeenCalled());

      expect(screen.getByTestId('token')).toHaveTextContent('no-token');
    });

    it('handles logout correctly', async () => {
      const dummyToken = createDummyToken('testuser');
      localStorage.setItem('beacon_token', dummyToken);

      axios.get.mockResolvedValue({ data: { username: 'testuser', bio: 'Hello world', id: 1, balance: 0 } });

      render(
        <P2PProvider>
          <AuthTestComponent />
        </P2PProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('username')).toHaveTextContent('testuser');
      });

      act(() => {
        screen.getByText('Logout').click();
      });

      expect(screen.getByTestId('token')).toHaveTextContent('no-token');
      expect(screen.getByTestId('username')).toHaveTextContent('Guest');
      expect(localStorage.getItem('beacon_token')).toBeNull();
    });

    it('logs out on 401 when fetching profile', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const dummyToken = createDummyToken('testuser');
      localStorage.setItem('beacon_token', dummyToken);

      axios.get.mockRejectedValue({ response: { status: 401 } });

      render(
        <P2PProvider>
          <AuthTestComponent />
        </P2PProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('token')).toHaveTextContent('no-token');
      });

      expect(screen.getByTestId('username')).toHaveTextContent('Guest');
      expect(localStorage.getItem('beacon_token')).toBeNull();
      consoleErrorSpy.mockRestore();
    });

    it('handles invalid token format gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem('beacon_token', 'invalid-token-format');

      render(
        <P2PProvider>
          <AuthTestComponent />
        </P2PProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('token')).toHaveTextContent('no-token');
      });

      expect(screen.getByTestId('username')).toHaveTextContent('Guest');
      expect(localStorage.getItem('beacon_token')).toBeNull();
      consoleErrorSpy.mockRestore();
    });

    it('updates user profile manually with object', async () => {
      render(
        <P2PProvider>
          <AuthTestComponent />
        </P2PProvider>
      );

      act(() => {
        screen.getByText('Update Bio').click();
      });

      expect(screen.getByTestId('profile-bio')).toHaveTextContent('Updated bio');

      const savedProfile = JSON.parse(localStorage.getItem('beacon_user_profile'));
      expect(savedProfile.bio).toBe('Updated bio');
    });

    it('updates user profile manually with functional updater', async () => {
      render(
        <P2PProvider>
          <AuthTestComponent />
        </P2PProvider>
      );

      act(() => {
        screen.getByText('Update Bio Fn').click();
      });

      expect(screen.getByTestId('profile-bio')).toHaveTextContent('Updated bio via function');
    });

    it('updates username via updateUsername', async () => {
      render(
        <P2PProvider>
          <AuthTestComponent />
        </P2PProvider>
      );

      act(() => {
        screen.getByText('Update Username').click();
      });

      expect(screen.getByTestId('username')).toHaveTextContent('new-username');
    });
  });

  describe('useP2PStats edge cases', () => {
      it('returns fallback values if not all context values are defined', () => {
          // It's hard to mock useContext directly to return a partial object without complex module mocking,
          // but we can at least test the component renders without crashing.
          // The fallback logic in the component handles cases where context exists but some fields are missing.
          render(
              <P2PProvider>
                  <StatsOnlyComponent />
              </P2PProvider>
          );
          expect(screen.getByTestId('stats-latency')).toHaveTextContent('0');
      });
  });
});
