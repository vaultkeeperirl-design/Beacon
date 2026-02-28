import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);

/**
 * Singleton instance of the Socket.IO client.
 * @type {import('socket.io-client').Socket | undefined}
 */
let socket;

/**
 * Retrieves the global Socket.IO instance, initializing it if necessary.
 * Ensures only a single WebSocket connection is maintained throughout the app lifecycle.
 *
 * @returns {import('socket.io-client').Socket} The initialized Socket.IO client.
 */
export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true,
        });
    }
    return socket;
};

/**
 * Custom hook to consume the global Socket.IO instance and its connection state.
 *
 * Subscribes to connection lifecycle events to provide real-time status.
 *
 * @returns {{
 *   socket: import('socket.io-client').Socket,
 *   isConnected: boolean
 * }} An object containing the socket instance and current connection flag.
 */
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
