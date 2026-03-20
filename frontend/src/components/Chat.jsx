import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Send, Smile } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import PollWidget from './PollWidget';

// Performance Optimization: Extract individual message to a memoized component.
// This prevents all messages from re-rendering when a single new message is added.
const ChatMessage = memo(({ msg, onMention }) => (
  <div className={`text-sm break-words leading-relaxed group hover:bg-neutral-900/50 -mx-2 px-2 py-1 rounded transition-colors ${msg.isPending ? 'opacity-50' : ''}`}>
    {msg.user === 'System' ? (
      <span className={`font-bold ${msg.color || 'text-neutral-400'} mr-2 text-xs uppercase tracking-wide opacity-90`}>{msg.user}:</span>
    ) : (
      <button
        onClick={() => onMention?.(msg.user)}
        className={`font-bold ${msg.color || 'text-neutral-400'} mr-2 hover:underline text-xs uppercase tracking-wide opacity-90 transition-all active:scale-95 focus:outline-none focus-visible:ring-1 focus-visible:ring-beacon-500 rounded px-0.5`}
        aria-label={`Mention ${msg.user}`}
        title={`Mention ${msg.user}`}
      >
        {msg.user}:
      </button>
    )}
    <span className="text-neutral-300 group-hover:text-white transition-colors">{msg.text}</span>
  </div>
));

ChatMessage.displayName = 'ChatMessage';

const EMOTES = ['🔥', '🚀', '💎', '🙌', '👀', '✨', '⚡', '🌉', '🛠️', '🏗️'];
const EMOTE_LABELS = {
  '🔥': 'Fire',
  '🚀': 'Rocket',
  '💎': 'Gem',
  '🙌': 'Raising Hands',
  '👀': 'Eyes',
  '✨': 'Sparkles',
  '⚡': 'Bolt',
  '🌉': 'Bridge',
  '🛠️': 'Tools',
  '🏗️': 'Building'
};

const Chat = memo(function Chat({
  streamId,
  className = "fixed right-0 top-16 bottom-0 w-80 z-40 hidden lg:flex shadow-xl border-l border-neutral-800",
  showHeader = true
}) {
  const { messages, sendMessage, isConnected } = useChat(streamId);
  const [input, setInput] = useState('');
  const [isEmotePickerOpen, setIsEmotePickerOpen] = useState(false);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const emotePickerRef = useRef(null);

  // Note: Resetting of messages when streamId changes is now handled by a 'key' on
  // the component in Watch.jsx, which is more idiomatic and avoids cascading renders.

  useEffect(() => {
    // Performance Optimization: Use behavior: 'auto' instead of 'smooth'
    // for faster, less CPU-intensive scrolling during high-frequency chat updates.
    chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  // Global 'Enter' listener to automatically focus chat input
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // If user presses Enter and we are NOT already in an interactive element
      const activeElement = document.activeElement;
      const activeTag = activeElement?.tagName;
      const isContentEditable = activeElement?.isContentEditable;
      if (e.key === 'Enter' && !isContentEditable && !['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT', 'A'].includes(activeTag)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emotePickerRef.current && !emotePickerRef.current.contains(e.target)) {
        setIsEmotePickerOpen(false);
      }
    };
    if (isEmotePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEmotePickerOpen]);

  const addEmote = (emote) => {
    setInput(prev => prev + emote);
    setIsEmotePickerOpen(false);
    inputRef.current?.focus();
  };

  const handleMention = useCallback((targetUser) => {
    const mention = `@${targetUser} `;
    setInput(prev => {
      if (prev.endsWith(' ') || prev.length === 0) return prev + mention;
      return prev + ' ' + mention;
    });
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Use the return value to determine if the message was "sent" (optimistically added)
    // This allows clearing the input even if offline, preserving optimistic UI behavior.
    if (sendMessage(input)) {
      setInput('');
    }
  };

  return (
    <div className={`flex flex-col bg-neutral-950 ${className}`}>
      {showHeader && (
        <div className="p-3 border-b border-neutral-800 font-bold text-center uppercase tracking-wider text-xs text-neutral-500 bg-neutral-900/50 backdrop-blur-sm flex justify-between px-4">
          <span>Stream Chat</span>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} self-center`} title={isConnected ? 'Connected' : 'Disconnected'}></span>
        </div>
      )}

      {/* Poll Widget Area - Renders only if there is an active poll for this stream */}
      <PollWidget streamId={streamId} />

      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} onMention={handleMention} />
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-800 bg-neutral-900/80 backdrop-blur-md relative">
        {input.length >= 400 && (
          <div className="absolute -top-6 right-4 text-[10px] font-bold font-mono text-neutral-500 bg-neutral-950/80 px-2 py-0.5 rounded border border-neutral-800/50">
            <span className={input.length >= 500 ? 'text-red-500' : ''}>{input.length}</span> / 500
          </div>
        )}

        <div className="relative group focus-within:ring-1 focus-within:ring-beacon-500 rounded-lg transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.target.blur();
              }
            }}
            maxLength={500}
            className="w-full bg-neutral-800/50 text-white rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none placeholder-neutral-600 transition-colors border border-transparent focus:border-beacon-500/50"
            placeholder={isConnected ? "Send a message... (Press Enter)" : "Connecting..."}
            disabled={!isConnected}
            aria-label="Chat message"
          />
          <button
             type="submit"
             className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-beacon-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             disabled={!input.trim() || !isConnected}
             aria-label="Send message"
             title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-between items-center mt-3 text-[10px] text-neutral-600 font-medium">
           <div className="relative" ref={emotePickerRef}>
             <button
               type="button"
               onClick={() => setIsEmotePickerOpen(!isEmotePickerOpen)}
               className="flex items-center gap-1.5 cursor-pointer hover:text-neutral-400 transition-colors focus-visible:ring-1 focus-visible:ring-beacon-500 rounded outline-none"
               aria-label="Open emotes menu"
               title="Open emotes menu"
               aria-expanded={isEmotePickerOpen}
               aria-haspopup="true"
             >
               <Smile className="w-3.5 h-3.5" />
               <span>Emotes</span>
             </button>

             {isEmotePickerOpen && (
               <div className="absolute bottom-full mb-2 left-0 w-max bg-neutral-900 border border-neutral-800 rounded-lg p-2 shadow-2xl grid grid-cols-5 gap-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                 {EMOTES.map(emote => (
                   <button
                     key={emote}
                     type="button"
                     onClick={() => addEmote(emote)}
                     className="w-8 h-8 flex items-center justify-center hover:bg-neutral-800 rounded transition-all text-lg active:scale-95"
                     aria-label={`Insert ${EMOTE_LABELS[emote] || 'emote'}`}
                     title={`Insert ${EMOTE_LABELS[emote] || 'emote'}`}
                   >
                     {emote}
                   </button>
                 ))}
               </div>
             )}
           </div>
           <span>Chat rules apply</span>
        </div>
      </form>
    </div>
  );
});

export default Chat;
