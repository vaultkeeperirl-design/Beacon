import React, { useState, useEffect, memo } from 'react';
import axios from 'axios';
import { useP2PSettings } from '../context/P2PContext';

/**
 * ⚡ Performance Optimization: Isolated Ad Break Timer
 * Moving the high-frequency 1s timer state into this isolated component
 * prevents the entire Broadcast Studio layout from re-rendering every second.
 */
const AdBreakButton = memo(function AdBreakButton() {
  const [adBreakTimer, setAdBreakTimer] = useState(0);
  const { username, token } = useP2PSettings();

  useEffect(() => {
    let interval;
    if (adBreakTimer > 0) {
      interval = setInterval(() => {
        setAdBreakTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [adBreakTimer]);

  const startAdBreak = async () => {
    if (adBreakTimer > 0 || !username || !token) return;

    try {
      // Trigger ad revenue distribution on backend
      const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      await axios.post(
        `${API_URL}/api/ads/trigger`,
        { streamId: username },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAdBreakTimer(60);
    } catch (err) {
      console.error('Failed to trigger ad break:', err);
    }
  };

  return (
    <button
      onClick={startAdBreak}
      disabled={adBreakTimer > 0}
      className={`p-3 rounded-lg text-sm font-medium transition-all border ${
        adBreakTimer > 0
          ? 'bg-neutral-900 border-neutral-800 text-neutral-500 cursor-not-allowed'
          : 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700'
      }`}
    >
      {adBreakTimer > 0 ? `Ad Break (${adBreakTimer}s)` : 'Ad Break (60s)'}
    </button>
  );
});

export default AdBreakButton;
