/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo } from 'react';
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

export function P2PProvider({ children }) {
  const [isSharing, setIsSharing] = useState(true);
  const [currentStreamId, setCurrentStreamId] = useState(null);

  // Persist username across stream changes/remounts
  const [username] = useState(() => 'Anon_' + Math.floor(Math.random() * 10000));

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
    username
  }), [isSharing, settings, currentStreamId, username]);

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
