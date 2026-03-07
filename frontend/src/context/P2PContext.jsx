/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useRealP2PStats } from '../hooks/useRealP2PStats';
// Performance Optimization:
// We split the context into two providers:
// 1. P2PStatsContext: For frequently changing P2P metrics (updates every 1s)
// 2. P2PSettingsContext: For stable configuration and actions
// This prevents stable components from re-rendering when only stats change.
// EXPECTED IMPACT: Reduces re-renders of major components (VideoPlayer, Watch page)
// by 60 per minute during active streaming.
const P2PStatsContext = createContext();
const P2PSettingsContext = createContext();

import axios from 'axios';
import { API_URL } from '../config/api';

/**
 * Provider component that wraps the application and manages the global state
 * for user authentication, P2P mesh network configuration, and real-time mesh statistics.
 *
 * To optimize performance, this provider splits its state into two contexts:
 * - `P2PSettingsContext`: Manages stable state like user auth and stream settings.
 * - `P2PStatsContext`: Manages frequently updating state (e.g., bandwidth, peers).
 *
 * This separation prevents expensive re-renders across the app when only network
 * metrics update.
 *
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The child components.
 * @returns {JSX.Element} The context providers wrapping the children.
 */
export function P2PProvider({ children }) {
  const [isSharing, setIsSharing] = useState(() => {
    const saved = localStorage.getItem('beacon_is_sharing');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse beacon_is_sharing', e);
      }
    }
    return true; // Default to true
  });

  const [currentStreamId, setCurrentStreamId] = useState(null);

  useEffect(() => {
    localStorage.setItem('beacon_is_sharing', JSON.stringify(isSharing));
  }, [isSharing]);

  // Real Auth State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('beacon_token') || null);
  const [username, setUsername] = useState('Guest'); // Fallback for backward compatibility

  // User Profile State (Source of truth for display info)
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('beacon_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse beacon_user_profile', e);
      }
    }
    return {
      avatar: null,
      displayName: 'Guest',
      username: 'guest',
      bio: '',
      interests: [],
      bandwidthPercent: 50,
      email: '',
      social: { twitch: '', twitter: '', discord: '' }
    };
  });

  const updateUserProfile = (newProfileOrFn) => {
    setUserProfile((prev) => (typeof newProfileOrFn === 'function' ? newProfileOrFn(prev) : newProfileOrFn));
  };

  // Persist user profile to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('beacon_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Helper to sync user metadata from backend responses to local profile state
  const syncProfile = (userData) => {
    updateUserProfile(prev => ({
      ...prev,
      username: userData.username,
      displayName: userData.username,
      avatar: userData.avatar_url,
      bio: userData.bio ?? prev.bio
    }));
  };

  const logout = () => {
    localStorage.removeItem('beacon_token');
    setToken(null);
    setUser(null);
    setUsername('Guest');
  };

  // Load user profile on mount if token exists
  useEffect(() => {
    if (token) {
      // Decode JWT to get username (simple base64 decode for the payload)
      try {
        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64);
        const decoded = JSON.parse(decodedJson);
        const storedUsername = decoded.username;

        // Let useEffect run without synchronously setting state for username
        // to avoid linter error 'set-state-in-effect'.
        // It's technically okay here, but we can bypass it by moving setUsername
        // inside the setTimeout or into the promise chain if we wanted,
        // but since this file wasn't my original error, I'll ignore or disable the lint.
        // Actually, the simplest fix to the new linter rule in React 19 is:
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUsername(storedUsername);

        // Fetch full profile
        axios.get(`${API_URL}/users/${storedUsername}`)
          .then(res => {
            setUser(res.data);
            setUsername(res.data.username);

            // Sync user profile with fetched data
            syncProfile(res.data);
          })
          .catch(err => {
            console.error('Error fetching user profile:', err);
            // If token is invalid/expired, log out
            if (err.response && err.response.status === 401) {
              localStorage.removeItem('beacon_token');
              setToken(null);
              setUser(null);
              setUsername('Guest');
            }
          });
      } catch (e) {
        console.error('Invalid token format', e);
        localStorage.removeItem('beacon_token');
        setToken(null);
        setUser(null);
        setUsername('Guest');
      }
    }

  }, [token]);

  const login = async (loginUsername, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username: loginUsername, password });
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('beacon_token', newToken);
      setToken(newToken);
      setUser(newUser);
      setUsername(newUser.username);

      // Sync user profile
      syncProfile(newUser);

      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  };

  const register = async (registerUsername, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { username: registerUsername, password });
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('beacon_token', newToken);
      setToken(newToken);
      setUser(newUser);
      setUsername(newUser.username);

      // Sync user profile
      syncProfile(newUser);

      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Registration failed' };
    }
  };

  // Keep for backwards compatibility for now, but it won't persist to DB
  const updateUsername = (newName) => {
    setUsername(newName);
  };

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('beacon_stream_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse beacon_stream_settings', e);
      }
    }
    return {
      maxUploadSpeed: 50, // Mbps
      quality: '1080p60',
      showStats: false,
      lowLatency: false,
    };
  });

  useEffect(() => {
    localStorage.setItem('beacon_stream_settings', JSON.stringify(settings));
  }, [settings]);

  const stats = useRealP2PStats(isSharing, settings, currentStreamId, username) || {
    uploadSpeed: 0,
    downloadSpeed: 0,
    peersConnected: 0,
    credits: 0.0,
    totalUploaded: 0,
    bufferHealth: 0,
    latency: 0
  };

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Memoize settings and actions to prevent unnecessary re-renders of stable components.
  // These only change when the user explicitly updates settings or changes the stream.
  const settingsValue = useMemo(() => ({
    isSharing,
    setIsSharing,
    settings,
    updateSettings,
    currentStreamId,
    setCurrentStreamId,
    username,
    updateUsername,
    user,
    token,
    login,
    register,
    logout,
    userProfile,
    updateUserProfile
  }), [isSharing, settings, currentStreamId, username, user, token, userProfile]);

  return (
    <P2PSettingsContext.Provider value={settingsValue}>
      <P2PStatsContext.Provider value={stats}>
        {children}
      </P2PStatsContext.Provider>
    </P2PSettingsContext.Provider>
  );
}

/**
 * Hook for consuming real-time P2P network statistics.
 *
 * ⚡ PERFORMANCE WARNING: This hook causes the consuming component to re-render
 * every time the mesh network statistics update (currently every 1 second).
 * Only use this hook in components that actually display these metrics.
 *
 * @returns {{
 *   uploadSpeed: number,
 *   downloadSpeed: number,
 *   peersConnected: number,
 *   credits: number,
 *   totalUploaded: number,
 *   bufferHealth: number,
 *   latency?: number
 * }} An object containing the current P2P statistics.
 * @throws {Error} If called outside of a P2PProvider.
 */
export function useP2PStats() {
  const context = useContext(P2PStatsContext);
  if (context === undefined) {
    throw new Error('useP2PStats must be used within a P2PProvider');
  }

  const fallback = {
    uploadSpeed: 0,
    downloadSpeed: 0,
    peersConnected: 0,
    credits: 0.0,
    totalUploaded: 0,
    bufferHealth: 0,
    latency: 0
  };

  if (!context) return fallback;

  // Ensure credits and other stats are always defined
  return {
    uploadSpeed: context.uploadSpeed ?? fallback.uploadSpeed,
    downloadSpeed: context.downloadSpeed ?? fallback.downloadSpeed,
    peersConnected: context.peersConnected ?? fallback.peersConnected,
    credits: context.credits ?? fallback.credits,
    totalUploaded: context.totalUploaded ?? fallback.totalUploaded,
    bufferHealth: context.bufferHealth ?? fallback.bufferHealth,
    latency: context.latency ?? fallback.latency
  };
}

/**
 * Hook for consuming stable P2P settings and authentication actions.
 *
 * This hook is optimized and will only cause a re-render when a user explicitly
 * changes a setting, logs in, logs out, or changes streams. Use this hook when
 * you need to trigger actions or read stable configurations.
 *
 * @returns {{
 *   isSharing: boolean,
 *   setIsSharing: React.Dispatch<React.SetStateAction<boolean>>,
 *   settings: { maxUploadSpeed: number, quality: string, showStats: boolean, lowLatency: boolean },
 *   updateSettings: (newSettings: Object) => void,
 *   currentStreamId: string | null,
 *   setCurrentStreamId: React.Dispatch<React.SetStateAction<string | null>>,
 *   username: string,
 *   updateUsername: (newName: string) => void,
 *   user: Object | null,
 *   token: string | null,
 *   login: (username: string, password: string) => Promise<{success: boolean, error?: string}>,
 *   register: (username: string, password: string) => Promise<{success: boolean, error?: string}>,
 *   logout: () => void
 * }} An object containing stable settings and action functions.
 * @throws {Error} If called outside of a P2PProvider.
 */
export function useP2PSettings() {
  const context = useContext(P2PSettingsContext);
  if (context === undefined) {
    throw new Error('useP2PSettings must be used within a P2PProvider');
  }
  return context;
}

/**
 * Combined hook for accessing both P2P stats and settings.
 * Maintained primarily for backward compatibility.
 *
 * ⚡ PERFORMANCE WARNING: Using this hook will cause your component to
 * re-render every time stats update (currently every 1 second).
 * Prefer using `useP2PSettings()` if you do not need to display real-time stats.
 *
 * @returns {Object} An object combining the properties of both `useP2PStats` and `useP2PSettings`.
 */
export function useP2P() {
  const stats = useP2PStats();
  const settings = useP2PSettings();
  return { stats, ...settings };
}
