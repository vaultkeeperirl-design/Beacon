import { useState, useRef, useEffect, memo } from 'react';
import { Send, Smile } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { useP2PSettings } from '../context/P2PContext';

// Random color generator for anonymous users
const colors = ['text-red-400', 'text-green-400', 'text-blue-400', 'text-yellow-400', 'text-purple-400', 'text-pink-400', 'text-indigo-400'];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];
const randomUserColor = getRandomColor();

// Performance Optimization: Extract individual message to a memoized component.
// This prevents all messages from re-rendering when a single new message is added.
const ChatMessage = memo(({ msg }) => (
  <div className="text-sm break-words leading-relaxed group hover:bg-neutral-900/50 -mx-2 px-2 py-1 rounded transition-colors">
    <span className={`font-bold ${msg.color || 'text-neutral-400'} mr-2 cursor-pointer hover:underline text-xs uppercase tracking-wide opacity-90`}>{msg.user}:</span>
    <span className="text-neutral-300 group-hover:text-white transition-colors">{msg.text}</span>
  </div>
));

ChatMessage.displayName = 'ChatMessage';

export default function Chat({
  streamId,
  className = "fixed right-0 top-16 bottom-0 w-80 z-40 hidden lg:flex shadow-xl border-l border-neutral-800",
  showHeader = true
}) {
  const { socket, isConnected } = useSocket();
  const { username } = useP2PSettings();
  const [messages, setMessages] = useState([
    { id: 'welcome', user: 'System', text: 'Welcome to the chat! Connect to the swarm.', color: 'text-neutral-500' }
  ]);
  const [input, setInput] = useState('');

  const chatEndRef = useRef(null);

  // Note: Resetting of messages when streamId changes is now handled by a 'key' on
  // the component in Watch.jsx, which is more idiomatic and avoids cascading renders.

  useEffect(() => {
    if (!socket || !streamId) return;

    // Join the stream room (idempotent)
    socket.emit('join-stream', streamId);

    const handleMessage = (msg) => {
      setMessages((prev) => {
        const newMessages = [...prev, msg];
        // Performance Optimization: Limit to last 100 messages to keep DOM size and memory usage low.
        if (newMessages.length > 100) {
          return newMessages.slice(-100);
        }
        return newMessages;
      });
    };

    socket.on('chat-message', handleMessage);

    return () => {
      socket.off('chat-message', handleMessage);
    };
  }, [socket, streamId]);

  useEffect(() => {
    // Performance Optimization: Use behavior: 'auto' instead of 'smooth'
    // for faster, less CPU-intensive scrolling during high-frequency chat updates.
    chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket || !streamId) return;

    socket.emit('chat-message', {
      streamId: streamId,
      user: username,
      text: input,
      color: randomUserColor
    });

    setInput('');
  };

  return (
    <div className={`flex flex-col bg-neutral-950 ${className}`}>
      {showHeader && (
        <div className="p-3 border-b border-neutral-800 font-bold text-center uppercase tracking-wider text-xs text-neutral-500 bg-neutral-900/50 backdrop-blur-sm flex justify-between px-4">
          <span>Stream Chat</span>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} self-center`} title={isConnected ? 'Connected' : 'Disconnected'}></span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-neutral-800 bg-neutral-900/80 backdrop-blur-md">
        <div className="relative group focus-within:ring-1 focus-within:ring-beacon-500 rounded-lg transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-neutral-800/50 text-white rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none placeholder-neutral-600 transition-colors border border-transparent focus:border-beacon-500/50"
            placeholder={isConnected ? "Send a message..." : "Connecting..."}
            disabled={!isConnected}
          />
          <button
             type="submit"
             className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-beacon-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             disabled={!input.trim() || !isConnected}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-between items-center mt-3 text-[10px] text-neutral-600 font-medium">
           <div className="flex items-center gap-1.5 cursor-pointer hover:text-neutral-400 transition-colors">
             <Smile className="w-3.5 h-3.5" />
             <span>Emotes</span>
           </div>
           <span>Chat rules apply</span>
        </div>
      </form>
    </div>
  );
}
