/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import { useP2PSimulation } from '../hooks/useP2PSimulation';

const P2PContext = createContext();

export function P2PProvider({ children }) {
  const [isSharing, setIsSharing] = useState(true);

  const [settings, setSettings] = useState({
    maxUploadSpeed: 50, // Mbps
    quality: '1080p60',
    showStats: false,
    lowLatency: false,
  });

  const stats = useP2PSimulation(isSharing, settings);

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <P2PContext.Provider value={{ stats, isSharing, setIsSharing, settings, updateSettings }}>
      {children}
    </P2PContext.Provider>
  );
}

export function useP2P() {
  return useContext(P2PContext);
}
