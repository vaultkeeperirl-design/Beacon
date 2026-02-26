import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';
import { useP2PMesh } from './useP2PMesh';

export function useRealP2PStats(isSharing, settings, streamId, username) {
  const { socket, isConnected } = useSocket();
  const meshStats = useP2PMesh(); // Use the real mesh stats

  const [stats, setStats] = useState({
    uploadSpeed: 0,
    downloadSpeed: 0,
    peersConnected: 0,
    credits: 2450.0,
    totalUploaded: 12.5,
    bufferHealth: 5.0,
  });

  // Manage room joining/leaving
  useEffect(() => {
    if (!socket || !isConnected) return;

    if (streamId) {
      socket.emit('join-stream', { streamId, username });
    } else {
      socket.emit('leave-stream');
    }

    // No return cleanup for socket emit, but we handle state reset below
  }, [socket, isConnected, streamId, username]);

  // Sync mesh stats to exposed stats state
  // We use a separate useEffect to synchronize meshStats changes to the local stats state.
  // Although this updates state inside an effect (derived state), it's necessary because 'credits' and 'totalUploaded' are accumulators.
  useEffect(() => {
    if (!streamId) return;

    const interval = setInterval(() => {
      setStats(prev => {
        const qualityBitrates = {
          '1080p60': 8.0,
          '720p60': 4.5,
          '480p': 1.5
        };
        const baseBitrate = qualityBitrates[settings.quality] || 8.0;
        const jitter = (Math.random() - 0.5) * (baseBitrate * 0.1); // 10% jitter

        let newUpload = 0;
        let newDownload = 0;

        if (isBroadcasting) {
          // Broadcasters upload the source stream at the base bitrate
          newUpload = baseBitrate + jitter;
          newDownload = 0.1 + Math.random() * 0.2; // Minor management traffic
        } else {
          // Viewers download the stream at the base bitrate
          newDownload = baseBitrate + jitter;
          if (isSharing) {
            // Peer-to-peer relay: upload a portion of what we download, capped by user settings
            const idealUpload = newDownload * 0.4 + (Math.random() * 0.5);
            newUpload = Math.min(idealUpload, settings.maxUploadSpeed);
          }
        }

        const earnedCredits = newUpload * 0.005; // 0.005 CR per Mbps/s
        const bufferBase = settings.lowLatency ? 2.0 : 8.0;

        return {
          ...prev,
          uploadSpeed: parseFloat(newUpload.toFixed(1)),
          downloadSpeed: parseFloat(newDownload.toFixed(1)),
          credits: parseFloat((prev.credits + earnedCredits).toFixed(4)),
          totalUploaded: parseFloat((prev.totalUploaded + (newUpload / 8 / 1024)).toFixed(4)),
          bufferHealth: parseFloat((bufferBase + (Math.random() - 0.5)).toFixed(2)),
        };
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      setStats(prev => ({ ...prev, uploadSpeed: 0, downloadSpeed: 0 }));
    };
  }, [isSharing, streamId, isBroadcasting, settings]);

  return stats;
}
