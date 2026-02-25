import StreamCard from '../components/StreamCard';
import { Users, Wifi, Heart } from 'lucide-react';

const MOCK_FOLLOWED_STREAMS = [
  { id: 1, title: 'Building a P2P streaming app from scratch', streamer: 'JulesDev', viewers: '12.5k', tags: ['Coding', 'React', 'WebRTC'], thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600' },
  { id: 3, title: 'Cooking with reckless abandon', streamer: 'ChefChaos', viewers: '5.1k', tags: ['IRL', 'Cooking'], thumbnail: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&q=80&w=600' },
  { id: 5, title: 'Speedrunning Mario 64', streamer: 'RetroGamer', viewers: '2.9k', tags: ['Retro', 'Speedrun'], thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600' },
];

const MOCK_OFFLINE_CHANNELS = [
    { id: 9, streamer: 'TechTalks', lastSeen: '2 hours ago' },
    { id: 10, streamer: 'MusicLive', lastSeen: '5 hours ago' },
    { id: 11, streamer: 'ArtStation', lastSeen: '1 day ago' },
];

export default function Following() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-beacon-500 fill-current" />
          <h1 className="text-3xl font-bold text-white">Following</h1>
       </div>

       <div className="mb-12">
           <div className="flex items-center gap-2 mb-6">
                <Wifi className="w-5 h-5 text-red-500 animate-pulse" />
                <h2 className="text-xl font-semibold text-neutral-200">Live Channels</h2>
           </div>

           {MOCK_FOLLOWED_STREAMS.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                 {MOCK_FOLLOWED_STREAMS.map(stream => (
                   <StreamCard key={stream.id} {...stream} />
                 ))}
               </div>
           ) : (
               <div className="text-neutral-500 text-center py-12 bg-neutral-900/50 rounded-xl border border-neutral-800 border-dashed">
                   <p>No followed channels are currently live.</p>
               </div>
           )}
       </div>

       <div>
           <div className="flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-neutral-400" />
                <h2 className="text-xl font-semibold text-neutral-200">Offline Channels</h2>
           </div>

           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
               {MOCK_OFFLINE_CHANNELS.map(channel => (
                   <div key={channel.id} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex flex-col items-center gap-3 hover:border-neutral-700 transition-colors cursor-pointer group">
                       <div className="w-16 h-16 rounded-full bg-neutral-800 overflow-hidden relative border-2 border-transparent group-hover:border-beacon-500 transition-colors">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${channel.id}`} alt="Avatar" className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity" />
                       </div>
                       <div className="text-center">
                           <p className="font-medium text-neutral-300 group-hover:text-white transition-colors">{channel.streamer}</p>
                           <p className="text-xs text-neutral-500">Last live {channel.lastSeen}</p>
                       </div>
                   </div>
               ))}
           </div>
       </div>
    </div>
  );
}
