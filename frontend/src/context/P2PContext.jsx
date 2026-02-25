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
  });

  const [isSharing, setIsSharing] = useState(true);

  useEffect(() => {
    if (!isSharing) {
      const timer = setTimeout(() => {
        setStats(prev => ({ ...prev, uploadSpeed: 0, peersConnected: 0 }));
      }, 0);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setStats(prev => {
        // Simulate fluctuating network stats
        const newUpload = Math.max(0, Math.min(50, prev.uploadSpeed + (Math.random() - 0.5) * 5));
        const newDownload = Math.max(0, Math.min(100, prev.downloadSpeed + (Math.random() - 0.5) * 10));
        const newPeers = Math.max(0, Math.min(25, Math.floor(prev.peersConnected + (Math.random() - 0.5) * 2)));

        // Earn credits based on upload
        const earnedCredits = newUpload * 0.01;

        return {
          ...prev,
          uploadSpeed: parseFloat(newUpload.toFixed(1)),
          downloadSpeed: parseFloat(newDownload.toFixed(1)),
          peersConnected: newPeers,
          credits: parseFloat((prev.credits + earnedCredits).toFixed(4)),
          totalUploaded: parseFloat((prev.totalUploaded + (newUpload / 8 / 1024)).toFixed(4)), // Approx GB
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSharing]);

  return (
    <P2PContext.Provider value={{ stats, isSharing, setIsSharing }}>
      {children}
    </P2PContext.Provider>
  );
}

export function useP2P() {
  return useContext(P2PContext);
}
