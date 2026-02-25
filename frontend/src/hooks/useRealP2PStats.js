import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';

export function useRealP2PStats(isSharing, settings, streamId, username) {
  const { socket, isConnected } = useSocket();
  const [stats, setStats] = useState({
    uploadSpeed: 0,
    downloadSpeed: 0,
    peersConnected: 0,
    credits: 2450.0,
    totalUploaded: 12.5,
    bufferHealth: 5.0,
  });

  const isBroadcasting = streamId === username;

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUserCount = (count) => {
      // Subtract 1 to exclude self, but show 0 if negative
      setStats(prev => ({ ...prev, peersConnected: Math.max(0, count - 1) }));
    };

    socket.on('room-users-update', handleUserCount);

    if (streamId) {
      socket.emit('join-stream', { streamId, username });
    } else {
      socket.emit('leave-stream');
    }

    return () => {
      socket.off('room-users-update', handleUserCount);
      // Reset peers when streamId changes or we disconnect to avoid stale stats
      setStats(prev => ({ ...prev, peersConnected: 0 }));
    };
  }, [socket, isConnected, streamId, username]);

  useEffect(() => {
    if (!streamId) return;

    const interval = setInterval(() => {
      setStats(prev => {
         let newUpload = 0;
         let newDownload = 0;

         if (isBroadcasting) {
            // Broadcasters upload the source stream
            newUpload = 12 + Math.random() * 8;
            newDownload = 0.5 + Math.random(); // Signaling & management traffic
         } else {
            // Viewers download the stream
            newDownload = 6 + Math.random() * 4;
            // Only upload if sharing is enabled
            newUpload = isSharing ? (1 + Math.random() * 3) : 0;
         }

         const earnedCredits = newUpload * 0.01;

         // Simulate fluctuating download speed when active
         const newDownload = Math.max(5, Math.min(100, prev.downloadSpeed + (Math.random() - 0.5) * 10));

         return {
             ...prev,
             uploadSpeed: parseFloat(newUpload.toFixed(1)),
             downloadSpeed: parseFloat(newDownload.toFixed(1)),
             credits: parseFloat((prev.credits + earnedCredits).toFixed(4)),
             totalUploaded: parseFloat((prev.totalUploaded + (newUpload / 8 / 1024)).toFixed(4)),
             bufferHealth: 5.0 + (Math.random() - 0.5),
         };
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      setStats(prev => ({ ...prev, uploadSpeed: 0, downloadSpeed: 0 }));
    };
  }, [isSharing, streamId, isBroadcasting]);

  return stats;
}
