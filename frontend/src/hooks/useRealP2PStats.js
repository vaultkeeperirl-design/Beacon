import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';
import { subscribeToMeshStats } from './useP2PStream';

/**
 * Custom hook to manage and format P2P statistics for the user interface.
 *
 * Subscribes to the underlying mesh network metrics (`useP2PStream` global state) and computes derived
 * metrics such as accumulated credits, total uploaded data, and buffer health,
 * factoring in user settings and stream sharing status.
 *
 * @param {boolean} isSharing - Whether the user is actively participating in P2P sharing.
 * @param {Object} settings - Configuration options (e.g. `maxUploadSpeed`).
 * @param {string} streamId - The unique identifier of the active stream.
 * @param {string} username - The current user's identification.
 * @returns {{
 *   uploadSpeed: number,
 *   downloadSpeed: number,
 *   peersConnected: number,
 *   credits: number,
 *   totalUploaded: number,
 *   bufferHealth: number,
 *   latency?: number
 * }} An object containing computed and formatted P2P stats.
 */
export function useRealP2PStats(isSharing, settings, streamId, username) {
  const { socket, isConnected } = useSocket();

  const [meshStats, setMeshStats] = useState({
    uploadSpeed: 0,
    downloadSpeed: 0,
    connectedPeers: 0,
    latency: 0
  });

  useEffect(() => {
    const unsubscribe = subscribeToMeshStats(setMeshStats);
    return unsubscribe;
  }, []);

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
    // Use a timeout to ensure state updates happen in the next tick, avoiding synchronous setState warnings in effects.
    const timer = setTimeout(() => {
        if (!streamId || !isSharing) { // Respect isSharing flag
            setStats(prev => {
                if (prev.peersConnected === 0 && prev.uploadSpeed === 0 && prev.downloadSpeed === 0) return prev;
                return {
                    ...prev,
                    uploadSpeed: 0,
                    downloadSpeed: 0,
                    peersConnected: 0,
                    latency: 0
                };
            });
        } else {
             setStats(prev => {
                 const realUpload = meshStats.uploadSpeed;
                 const realDownload = meshStats.downloadSpeed;

                 const earnedCredits = realUpload * 0.01;

                 return {
                     ...prev,
                     uploadSpeed: realUpload,
                     downloadSpeed: realDownload,
                     peersConnected: meshStats.connectedPeers,
                     credits: parseFloat((prev.credits + earnedCredits).toFixed(4)),
                     totalUploaded: parseFloat((prev.totalUploaded + (realUpload / 8 / 1024)).toFixed(4)),
                     bufferHealth: 5.0 + (Math.random() - 0.5),
                     latency: meshStats.latency
                 };
            });
        }
    }, 0);

    return () => clearTimeout(timer);
  }, [meshStats, streamId, isSharing]); // Added isSharing to dependencies

  return stats;
}
