import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import StreamCard from '../components/StreamCard';
import { Filter, ChevronDown, Flame, Search, X } from 'lucide-react';

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

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const filteredStreams = useMemo(() => {
    if (!query) return MOCK_STREAMS;
    const lowerQuery = query.toLowerCase();
    return MOCK_STREAMS.filter(stream =>
      stream.title.toLowerCase().includes(lowerQuery) ||
      stream.streamer.toLowerCase().includes(lowerQuery) ||
      stream.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }, [query]);

  const clearSearch = () => {
    setSearchParams({});
  };

  return (
    <div>
       <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-2">
            {query ? (
              <Search className="w-6 h-6 text-beacon-500" />
            ) : (
              <Flame className="w-6 h-6 text-beacon-500 fill-current" />
            )}
            <h2 className="text-2xl font-poppins font-bold text-white">
              {query ? `Search Results for "${query}"` : 'Live Channels'}
            </h2>
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

       {filteredStreams.length > 0 ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
           {filteredStreams.map(stream => (
             <StreamCard key={stream.id} {...stream} />
           ))}
         </div>
       ) : (
         <div className="flex flex-col items-center justify-center py-20 text-center">
           <div className="bg-neutral-900 p-4 rounded-full mb-4">
             <Search className="w-8 h-8 text-neutral-500" />
           </div>
           <h3 className="text-xl font-bold text-white mb-2">No channels found</h3>
           <p className="text-neutral-400 mb-6">We couldn't find any channels matching "{query}"</p>
           <button
             onClick={clearSearch}
             className="flex items-center gap-2 px-6 py-2.5 bg-beacon-600 hover:bg-beacon-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-beacon-600/20"
           >
             <X className="w-4 h-4" />
             Clear Search
           </button>
         </div>
       )}
    </div>
  );
}
