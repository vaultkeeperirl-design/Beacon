import { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';

export default function Chat() {
  const [messages, setMessages] = useState([
    { id: 1, user: 'CryptoKing', text: 'Yooo this quality is insane for P2P!', color: 'text-red-400' },
    { id: 2, user: 'NodeRunner99', text: 'Sharing 50mbps right now, credits go brrr', color: 'text-green-400' },
    { id: 3, user: 'Alice_In_Chains', text: 'Is this really decentralized?', color: 'text-blue-400' },
    { id: 4, user: 'Satoshi_Nakamoto', text: 'This is the way.', color: 'text-yellow-400' },
    { id: 5, user: 'Vitalik_B', text: 'Gas fees are low here lol', color: 'text-purple-400' },
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), user: 'You', text: input, color: 'text-beacon-500' }]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 border-l border-neutral-800 w-80 fixed right-0 top-16 bottom-0 z-40 hidden lg:flex shadow-xl">
      <div className="p-3 border-b border-neutral-800 font-bold text-center uppercase tracking-wider text-xs text-neutral-500 bg-neutral-900/50 backdrop-blur-sm">
        Stream Chat
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm break-words leading-relaxed group hover:bg-neutral-900/50 -mx-2 px-2 py-1 rounded transition-colors">
            <span className={`font-bold ${msg.color} mr-2 cursor-pointer hover:underline text-xs uppercase tracking-wide opacity-90`}>{msg.user}:</span>
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
            placeholder="Send a message..."
          />
          <button
             type="submit"
             className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-beacon-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             disabled={!input.trim()}
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
