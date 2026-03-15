import React, { useState, useEffect, memo } from 'react';
import axios from 'axios';
import { Zap, Loader2, AlertCircle } from 'lucide-react';
import { useP2PSettings } from '../context/P2PContext';
import { API_URL } from '../config/api';

/**
 * ⚡ Performance Optimization: Isolated Ad Break Timer
 * Moving the high-frequency 1s timer state into this isolated component
 * prevents the entire Broadcast Studio layout from re-rendering every second.
 */
const AdBreakButton = memo(function AdBreakButton() {
  const [adBreakTimer, setAdBreakTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
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

  useEffect(() => {
    let timeout;
    if (error) {
      timeout = setTimeout(() => setError(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [error]);

  const startAdBreak = async () => {
    if (adBreakTimer > 0 || isLoading || !username || !token) return;

    setIsLoading(true);
    setError(false);
    try {
      // Trigger ad revenue distribution on backend
      await axios.post(
        `${API_URL}/ads/trigger`,
        { streamId: username },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAdBreakTimer(60);
    } catch (err) {
      console.error('Failed to trigger ad break:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = adBreakTimer > 0 || isLoading || !username || !token;

  const getButtonText = () => {
    if (isLoading) return 'Triggering...';
    if (error) return 'Failed';
    if (adBreakTimer > 0) return `Ad Break (${adBreakTimer}s)`;
    return 'Ad Break (60s)';
  };

  const getAriaLabel = () => {
    if (isLoading) return 'Triggering ad break';
    if (error) return 'Ad break trigger failed';
    if (adBreakTimer > 0) return `Ad break on cooldown: ${adBreakTimer} seconds remaining`;
    return 'Trigger 60 second ad break';
  };

  return (
    <button
      onClick={startAdBreak}
      disabled={isDisabled}
      aria-label={getAriaLabel()}
      title={getAriaLabel()}
      className={`p-3 rounded-lg text-sm font-medium transition-all border flex items-center justify-center gap-2 ${
        adBreakTimer > 0
          ? 'bg-neutral-900 border-neutral-800 text-neutral-500 cursor-not-allowed'
          : error
          ? 'bg-red-900/20 border-red-500/50 text-red-500'
          : isDisabled
          ? 'bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed opacity-50'
          : 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700 shadow-sm active:scale-95'
      } ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : error ? (
        <AlertCircle className="w-4 h-4" />
      ) : (
        <Zap className={`w-4 h-4 ${adBreakTimer > 0 ? 'text-neutral-600' : 'text-yellow-500'}`} />
      )}
      <span>{getButtonText()}</span>
    </button>
  );
});

export default AdBreakButton;
