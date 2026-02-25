import StreamCard from '../components/StreamCard';
import { Filter, ChevronDown, Heart, Activity } from 'lucide-react';

const MOCK_FOLLOWED_STREAMS = [
  { id: 1, title: 'Building a P2P streaming app from scratch', streamer: 'JulesDev', viewers: '12.5k', tags: ['Coding', 'React', 'WebRTC'], thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600' },
  { id: 3, title: 'Cooking with reckless abandon', streamer: 'ChefChaos', viewers: '5.1k', tags: ['IRL', 'Cooking'], thumbnail: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&q=80&w=600' },
  { id: 5, title: 'Speedrunning Mario 64', streamer: 'RetroGamer', viewers: '2.9k', tags: ['Retro', 'Speedrun'], thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600' },
];

const MOCK_OFFLINE_CHANNELS = [
    { id: 101, name: 'TechTalks', lastStream: '2 hours ago', category: 'Talk Shows', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TechTalks' },
    { id: 102, name: 'AdventureTime', lastStream: 'Yesterday', category: 'Travel', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdventureTime' },
    { id: 103, name: 'CodeWarrior', lastStream: '3 days ago', category: 'Programming', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CodeWarrior' },
    { id: 104, name: 'YogaDaily', lastStream: '5 days ago', category: 'Fitness', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=YogaDaily' },
];

export default function Following() {
  return (
    <div>
       <div className="flex items-center gap-3 mb-8">
          <div className="bg-beacon-500/10 p-3 rounded-xl border border-beacon-500/20">
            <Heart className="w-8 h-8 text-beacon-500 fill-beacon-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Following</h1>
            <p className="text-neutral-400">Keep up with your favorite streamers.</p>
          </div>
       </div>

       <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-bold text-white">Live Now</h2>
            <span className="bg-neutral-800 text-neutral-400 text-xs px-2 py-0.5 rounded-full ml-2">{MOCK_FOLLOWED_STREAMS.length}</span>
         </div>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
         {MOCK_FOLLOWED_STREAMS.map(stream => (
           <StreamCard key={stream.id} {...stream} />
         ))}
       </div>

       <div className="border-t border-neutral-800 pt-8 mb-6">
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold text-white">Offline Channels</h2>
             <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors">
                  <span>Sort by: Recently Live</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
             </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {MOCK_OFFLINE_CHANNELS.map(channel => (
                   <div key={channel.id} className="flex items-center gap-4 p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl hover:bg-neutral-800/80 hover:border-neutral-700 transition-all cursor-pointer group">
                       <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-neutral-700 group-hover:border-beacon-500/50 transition-colors relative grayscale group-hover:grayscale-0">
                           <img src={channel.avatar} alt={channel.name} className="w-full h-full object-cover" />
                       </div>
                       <div>
                           <h3 className="font-bold text-white group-hover:text-beacon-400 transition-colors">{channel.name}</h3>
                           <p className="text-xs text-neutral-500">{channel.category}</p>
                           <p className="text-xs text-neutral-600 mt-1">Last seen: {channel.lastStream}</p>
                       </div>
                   </div>
               ))}
           </div>
       </div>
    </div>
  );
}
