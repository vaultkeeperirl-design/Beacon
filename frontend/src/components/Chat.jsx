import { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

// Random color generator for anonymous users
const colors = ['text-red-400', 'text-green-400', 'text-blue-400', 'text-yellow-400', 'text-purple-400', 'text-pink-400', 'text-indigo-400'];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];
const randomUserColor = getRandomColor();

export default function Chat() {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  // Generate a random user ID for this session if not logged in
  const [username] = useState(() => 'Anon_' + Math.floor(Math.random() * 10000));

  const chatEndRef = useRef(null);

  useEffect(() => {
    // Only add welcome message on mount
    setMessages([
      { id: 'welcome', user: 'System', text: 'Welcome to the chat! Connect to the swarm.', color: 'text-neutral-500' }
    ]);
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Join the default stream room (or dynamic based on props)
    // For now, assuming global 'test-stream'
    // Note: We might be joining twice if P2PContext also joins, but rooms are sets, so it's fine.
    // However, it's cleaner if the Page handles joining. But Chat needs to know streamId.
    // Since we hardcode 'test-stream' for now, this is okay.
    socket.emit('join-stream', 'test-stream');

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chat-message', handleMessage);

    return () => {
      socket.off('chat-message', handleMessage);
    };
  }, [socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    socket.emit('chat-message', {
      streamId: 'test-stream',
      user: username,
      text: input,
      color: randomUserColor
    });

    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 border-l border-neutral-800 w-80 fixed right-0 top-16 bottom-0 z-40 hidden lg:flex shadow-xl">
      <div className="p-3 border-b border-neutral-800 font-bold text-center uppercase tracking-wider text-xs text-neutral-500 bg-neutral-900/50 backdrop-blur-sm flex justify-between px-4">
        <span>Stream Chat</span>
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} self-center`} title={isConnected ? 'Connected' : 'Disconnected'}></span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm break-words leading-relaxed group hover:bg-neutral-900/50 -mx-2 px-2 py-1 rounded transition-colors">
            <span className={`font-bold ${msg.color || 'text-neutral-400'} mr-2 cursor-pointer hover:underline text-xs uppercase tracking-wide opacity-90`}>{msg.user}:</span>
            <span className="text-neutral-300 group-hover:text-white transition-colors">{msg.text}</span>
          </div>
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
