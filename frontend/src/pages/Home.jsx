import { Link } from 'react-router-dom';
import StreamCard from '../components/StreamCard';
import { Flame } from 'lucide-react';

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
       <div className="mb-10 relative h-64 sm:h-80 rounded-2xl overflow-hidden group shadow-2xl shadow-beacon-900/20">
          <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt="Featured" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-8">
             <div className="max-w-2xl animate-fade-in-up">
                <span className="bg-beacon-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block shadow-lg shadow-beacon-600/20">Featured Stream</span>
                <h1 className="text-4xl font-poppins font-extrabold text-white mb-2 leading-tight drop-shadow-md">The Grand Tournament Finals</h1>
                <p className="text-neutral-300 mb-6 line-clamp-2 text-lg drop-shadow-sm">Watch the top players compete for the championship title in this epic showdown. Powered by decentralized streaming nodes.</p>
                <div className="flex gap-4">
                  <button className="bg-white text-black hover:bg-neutral-200 px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 shadow-lg shadow-white/10 active:scale-95">
                     Watch Now
                  </button>
                  <Link to="/browse" className="bg-neutral-900/80 backdrop-blur-sm text-white border border-neutral-700 hover:bg-neutral-800 px-6 py-3 rounded-lg font-bold transition-all hover:border-neutral-500 flex items-center justify-center">
                     Browse Channels
                  </Link>
                </div>
             </div>
          </div>
       </div>

       {/* Recommended Section */}
       <div className="flex items-center gap-2 mb-6">
          <Flame className="w-6 h-6 text-beacon-500 fill-current" />
          <h2 className="text-2xl font-poppins font-bold text-white">Recommended Channels</h2>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
         {MOCK_STREAMS.map(stream => (
           <StreamCard key={stream.id} {...stream} />
         ))}
       </div>
    </div>
  );
}
