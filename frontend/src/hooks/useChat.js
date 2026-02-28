import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';
import { useP2PSettings } from '../context/P2PContext';

// Random color generator for anonymous users
const colors = ['text-red-400', 'text-green-400', 'text-blue-400', 'text-yellow-400', 'text-purple-400', 'text-pink-400', 'text-indigo-400'];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];
const randomUserColor = getRandomColor();

/**
 * Custom hook to manage real-time chat functionality for a specific stream.
 *
 * Handles connecting to the chat room, receiving messages, optimistically
 * updating the UI when sending messages, and receiving system notifications
 * for users joining/leaving.
 *
 * @param {string} streamId - The unique identifier of the stream/room to join.
 * @returns {{
 *   messages: Array<{id: string, user: string, text: string, color: string, isPending?: boolean}>,
 *   sendMessage: (text: string) => boolean,
 *   isConnected: boolean
 * }} The chat state and functions to interact with it.
 */
export const useChat = (streamId) => {
  const { socket, isConnected } = useSocket();
  const { username } = useP2PSettings();
  const [messages, setMessages] = useState([
    { id: 'welcome', user: 'System', text: 'Welcome to the chat! Connect to the swarm.', color: 'text-neutral-500' }
  ]);

  useEffect(() => {
    if (!socket || !streamId) return;

    // Join the stream room (idempotent)
    socket.emit('join-stream', { streamId, username });

    const handleMessage = (msg) => {
      setMessages((prev) => {
        // Optimistic UI Reconciliation
        // We attempt to match the incoming message with a pending message in our local state.
        // Priority match: msg.senderId === socket.id (Robust, relies on backend sending senderId)
        // Fallback match: msg.user === username AND msg.text (Defensive, in case senderId is missing)

        const isFromMe = (msg.senderId && msg.senderId === socket.id) ||
                         (msg.user === username); // Simple check, refined inside findIndex

        if (isFromMe) {
          const pendingIndex = prev.findIndex(m =>
            m.isPending &&
            m.text === msg.text &&
            (m.user === msg.user) // Ensure user matches too
          );

          if (pendingIndex !== -1) {
            const newMessages = [...prev];
            // Replace the pending message with the real server message (removing isPending flag)
            // We use the server's ID, which might cause a re-mount of the ChatMessage component,
            // but that is acceptable for the benefit of consistency.
            newMessages[pendingIndex] = { ...msg, isPending: false };
            return newMessages;
          }
        }

        const newMessages = [...prev, msg];
        // Performance Optimization: Limit to last 100 messages to keep DOM size and memory usage low.
        if (newMessages.length > 100) {
          return newMessages.slice(-100);
        }
        return newMessages;
      });
    };

    const handleUserEvent = (data, eventType) => {
       const userLabel = data.username || `User (${data.id.substring(0, 4)})`;
       const text = eventType === 'connected' ? 'joined the chat' : 'left the chat';

       setMessages((prev) => [
         ...prev.slice(-99),
         {
           id: `${data.id}-${Date.now()}`,
           user: 'System',
           text: `${userLabel} ${text}`,
           color: 'text-neutral-500'
         }
       ]);
    };

    socket.on('chat-message', handleMessage);
    socket.on('user-connected', (data) => handleUserEvent(data, 'connected'));
    socket.on('user-disconnected', (data) => handleUserEvent(data, 'disconnected'));

    return () => {
      socket.off('chat-message', handleMessage);
      socket.off('user-connected');
      socket.off('user-disconnected');
    };
  }, [socket, streamId, username]);

  const sendMessage = (text) => {
    if (!text.trim() || !socket || !streamId) return false;

    // Optimistic Update: Immediately add message to state with pending flag
    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      user: username,
      text: text,
      color: randomUserColor,
      isPending: true
    };

    setMessages(prev => {
      const newMessages = [...prev, tempMsg];
      if (newMessages.length > 100) return newMessages.slice(-100);
      return newMessages;
    });

    socket.emit('chat-message', {
      streamId: streamId,
      user: username,
      text: text,
      color: randomUserColor
    });

    return true;
  };

  return { messages, sendMessage, isConnected };
};
