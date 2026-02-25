/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const P2PContext = createContext();

export function P2PProvider({ children }) {
  const [stats, setStats] = useState({
    uploadSpeed: 0, // Mbps
    downloadSpeed: 0, // Mbps
    peersConnected: 0,
    credits: 2450.0,
    totalUploaded: 12.5, // GB
    bufferHealth: 5.0, // seconds
  });

  const [isSharing, setIsSharing] = useState(true);

  const [settings, setSettings] = useState({
    maxUploadSpeed: 50, // Mbps
    quality: '1080p60',
    showStats: false,
    lowLatency: false,
  });

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  useEffect(() => {
    if (!isSharing) {
      const timer = setTimeout(() => {
        setStats(prev => ({ ...prev, uploadSpeed: 0, peersConnected: 0 }));
      }, 0);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setStats(prev => {
        const maxUp = settings.maxUploadSpeed;

        // Simulate fluctuating network stats
        // If maxUp is low, peers might drop
        const targetPeers = Math.max(0, Math.min(25, Math.floor(maxUp / 2) + 5));

        let newUpload = prev.uploadSpeed + (Math.random() - 0.5) * 5;
        // Clamp between 0 and maxUploadSpeed
        newUpload = Math.max(0, Math.min(maxUp, newUpload));

        const newDownload = Math.max(0, Math.min(100, prev.downloadSpeed + (Math.random() - 0.5) * 10));

        // Simulate peers fluctuation towards target
        let newPeers = prev.peersConnected + (Math.random() > 0.5 ? 1 : -1);
        newPeers = Math.max(0, Math.min(targetPeers, newPeers));

        // Earn credits based on upload
        const earnedCredits = newUpload * 0.01;

        // Simulate buffer health
        const newBuffer = Math.max(1, Math.min(10, prev.bufferHealth + (Math.random() - 0.5)));

        return {
          ...prev,
          uploadSpeed: parseFloat(newUpload.toFixed(1)),
          downloadSpeed: parseFloat(newDownload.toFixed(1)),
          peersConnected: newPeers,
          credits: parseFloat((prev.credits + earnedCredits).toFixed(4)),
          totalUploaded: parseFloat((prev.totalUploaded + (newUpload / 8 / 1024)).toFixed(4)), // Approx GB
          bufferHealth: parseFloat(newBuffer.toFixed(2)),
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSharing, settings.maxUploadSpeed]);

  return (
    <P2PContext.Provider value={{ stats, isSharing, setIsSharing, settings, updateSettings }}>
      {children}
    </P2PContext.Provider>
  );
}

export function useP2P() {
  return useContext(P2PContext);
}
