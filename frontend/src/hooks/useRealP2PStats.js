import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';

export function useRealP2PStats(isSharing, settings, streamId) {
  const { socket, isConnected } = useSocket();
  const [stats, setStats] = useState({
    uploadSpeed: 0,
    downloadSpeed: 0,
    peersConnected: 0,
    credits: 2450.0,
    totalUploaded: 12.5,
    bufferHealth: 5.0,
  });

  useEffect(() => {
    if (!socket || !isConnected) {
      setStats(prev => ({ ...prev, peersConnected: 0 }));
      return;
    }

    const handleUserCount = (count) => {
      // Subtract 1 to exclude self, but show 0 if negative
      setStats(prev => ({ ...prev, peersConnected: Math.max(0, count - 1) }));
    };

    socket.on('room-users-update', handleUserCount);

    if (streamId) {
      socket.emit('join-stream', streamId);
    } else {
      socket.emit('leave-stream');
    }

    return () => {
      socket.off('room-users-update', handleUserCount);
    };
  }, [socket, isConnected, streamId]);

  useEffect(() => {
    if (!isSharing || !streamId) {
      setStats(prev => ({ ...prev, uploadSpeed: 0 }));
      return;
    }

    const interval = setInterval(() => {
      setStats(prev => {
         const newUpload = Math.random() * 0.5; // Minimal keep-alive traffic simulation
         const earnedCredits = newUpload * 0.01;

         return {
             ...prev,
             uploadSpeed: parseFloat(newUpload.toFixed(1)),
             credits: parseFloat((prev.credits + earnedCredits).toFixed(4)),
             totalUploaded: parseFloat((prev.totalUploaded + (newUpload / 8 / 1024)).toFixed(4)),
             bufferHealth: 5.0 + (Math.random() - 0.5),
         };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSharing, streamId]);

  return stats;
}
