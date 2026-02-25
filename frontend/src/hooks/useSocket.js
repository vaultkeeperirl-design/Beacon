import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const getBackendUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const params = new URLSearchParams(window.location.search);
    const port = params.get('port');
    if (port) return `http://localhost:${port}`;
  }
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
};

let socket;

export const getSocket = () => {
    if (!socket) {
        const url = getBackendUrl();
        socket = io(url, {
            transports: ['websocket'],
            reconnection: true,
        });
    }
    return socket;
};

export const useSocket = () => {
  const socketInstance = getSocket();
  const [isConnected, setIsConnected] = useState(socketInstance.connected);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
    };
  }, [socketInstance]);

  return { socket: socketInstance, isConnected };
};
