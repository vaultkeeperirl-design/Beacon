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

// API base URL
const API_URL = 'http://localhost:3000/api';

export function P2PProvider({ children }) {
  const [isSharing, setIsSharing] = useState(true);
  const [currentStreamId, setCurrentStreamId] = useState(null);

  // Real Auth State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('beacon_token') || null);
  const [username, setUsername] = useState('Guest'); // Fallback for backward compatibility

  // Load user profile on mount if token exists
  useEffect(() => {
    if (token) {
      // Decode JWT to get username (simple base64 decode for the payload)
      try {
        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64);
        const decoded = JSON.parse(decodedJson);
        const storedUsername = decoded.username;

        setUsername(storedUsername);

        // Fetch full profile
        axios.get(`${API_URL}/users/${storedUsername}`)
          .then(res => {
            setUser(res.data);
          })
          .catch(err => {
            console.error('Error fetching user profile:', err);
            // If token is invalid/expired, log out
            if (err.response && err.response.status === 401) {
              handleLogout();
            }
          });
      } catch (e) {
        console.error('Invalid token format', e);
        handleLogout();
      }
    }

    function handleLogout() {
      localStorage.removeItem('beacon_token');
      setToken(null);
      setUser(null);
      setUsername('Guest');
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
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('beacon_token');
    setToken(null);
    setUser(null);
    setUsername('Guest');
  };

  // Keep for backwards compatibility for now, but it won't persist to DB
  const updateUsername = (newName) => {
    setUsername(newName);
  };

  const [settings, setSettings] = useState({
    maxUploadSpeed: 50, // Mbps
    quality: '1080p60',
    showStats: false,
    lowLatency: false,
  });

  const stats = useRealP2PStats(isSharing, settings, currentStreamId, username);

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
    logout
  }), [isSharing, settings, currentStreamId, username, user, token]);

  return (
    <P2PSettingsContext.Provider value={settingsValue}>
      <P2PStatsContext.Provider value={stats}>
        {children}
      </P2PStatsContext.Provider>
    </P2PSettingsContext.Provider>
  );
}

/**
 * Hook for components that only need P2P stats (updates frequently).
 * @returns {Object} P2P statistics
 */
export function useP2PStats() {
  const context = useContext(P2PStatsContext);
  if (context === undefined) {
    throw new Error('useP2PStats must be used within a P2PProvider');
  }
  return context;
}

/**
 * Hook for components that only need P2P settings and actions (stable).
 * @returns {Object} P2P settings and update functions
 */
export function useP2PSettings() {
  const context = useContext(P2PSettingsContext);
  if (context === undefined) {
    throw new Error('useP2PSettings must be used within a P2PProvider');
  }
  return context;
}

/**
 * Combined hook for backward compatibility.
 * ⚡ PERFORMANCE WARNING: Using this hook will cause your component to
 * re-render every time stats update (currently every 1 second).
 * Prefer using useP2PSettings() if you don't need real-time stats.
 */
export function useP2P() {
  const stats = useP2PStats();
  const settings = useP2PSettings();
  return { stats, ...settings };
}
