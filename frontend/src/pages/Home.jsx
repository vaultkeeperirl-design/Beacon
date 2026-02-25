import StreamCard from '../components/StreamCard';
import { Filter, ChevronDown, Flame } from 'lucide-react';

const MOCK_STREAMS = [
  { id: 1, title: 'Building a P2P streaming app from scratch', streamer: 'JulesDev', viewers: '12.5k', tags: ['Coding', 'React', 'WebRTC'], thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600' },
  { id: 2, title: 'Late Night Valorant Ranked Grind', streamer: 'FPS_God', viewers: '8.2k', tags: ['FPS', 'Competitive'], thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600' },
  { id: 3, title: 'Cooking with reckless abandon', streamer: 'ChefChaos', viewers: '5.1k', tags: ['IRL', 'Cooking'], thumbnail: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&q=80&w=600' },
  { id: 4, title: 'Just Chatting & Vibe', streamer: 'ChillZone', viewers: '3.4k', tags: ['Just Chatting'], thumbnail: 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&q=80&w=600' },
  { id: 5, title: 'Speedrunning Mario 64', streamer: 'RetroGamer', viewers: '2.9k', tags: ['Retro', 'Speedrun'], thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600' },
  { id: 6, title: 'Designing the future of UI', streamer: 'DesignMaster', viewers: '1.8k', tags: ['Design', 'Figma'], thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=600' },
  { id: 7, title: 'Exploring the mountains', streamer: 'TravelBlogger', viewers: '1.2k', tags: ['Travel', 'IRL'], thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=600' },
  { id: 8, title: 'Music Production 101', streamer: 'BeatMaker', viewers: '950', tags: ['Music', 'Creative'], thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=600' },
];

export default function Home() {
  return (
    <div>
       {/* Featured Banner */}
       <div className="mb-8 relative h-64 sm:h-80 rounded-2xl overflow-hidden group">
          <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover" alt="Featured" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-8">
             <div className="max-w-2xl animate-fade-in-up">
                <span className="bg-beacon-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block">Featured Stream</span>
                <h1 className="text-4xl font-poppins font-extrabold text-white mb-2 leading-tight">The Grand Tournament Finals</h1>
                <p className="text-neutral-300 mb-4 line-clamp-2">Watch the top players compete for the championship title in this epic showdown. Powered by decentralized streaming nodes.</p>
                <button className="bg-white text-black hover:bg-neutral-200 px-6 py-2 rounded-lg font-bold transition-colors">
                   Watch Now
                </button>
             </div>
          </div>
       </div>

       <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-beacon-500 fill-current" />
            <h2 className="text-2xl font-poppins font-bold text-white">Live Channels</h2>
         </div>
         <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors">
              <span>Sort by: Recommended</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
         </div>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
         {MOCK_STREAMS.map(stream => (
           <StreamCard key={stream.id} {...stream} />
         ))}
       </div>
    </div>
  );
}
