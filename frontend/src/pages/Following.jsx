import StreamCard from '../components/StreamCard';
import { Filter, ChevronDown, Heart, Activity } from 'lucide-react';
import { useFollowing } from '../context/FollowingContext';

// Keep mocks for offline or if needed, but primarily use context
const MOCK_OFFLINE_CHANNELS = [
    { id: 101, name: 'TechTalks', lastStream: '2 hours ago', category: 'Talk Shows', avatar: null },
    { id: 102, name: 'AdventureTime', lastStream: 'Yesterday', category: 'Travel', avatar: null },
    { id: 103, name: 'CodeWarrior', lastStream: '3 days ago', category: 'Programming', avatar: null },
    { id: 104, name: 'YogaDaily', lastStream: '5 days ago', category: 'Fitness', avatar: null },
];

export default function Following() {
  const { followedChannels } = useFollowing();

  // In a real app, we would fetch live status here.
  // For now, we assume followed channels that are marked 'isLive' are live.
  const liveChannels = followedChannels.filter(c => c.isLive);

  return (
    <div>
       <div className="flex items-center gap-3 mb-8">
          <div className="bg-beacon-500/10 p-3 rounded-xl border border-beacon-500/20">
            <Heart className="w-8 h-8 text-beacon-500 fill-beacon-500" />
          </div>
          <div>
            <h1 className="text-3xl font-poppins font-extrabold text-brand">Following</h1>
            <p className="text-neutral-400">Keep up with your favorite streamers.</p>
          </div>
       </div>

       <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-poppins font-bold text-white">Live Now</h2>
            <span className="bg-neutral-800 text-neutral-400 text-xs px-2 py-0.5 rounded-full ml-2">{liveChannels.length}</span>
         </div>
       </div>

       {liveChannels.length > 0 ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
           {liveChannels.map(channel => (
             <StreamCard
                key={channel.id}
                id={channel.id}
                title={channel.title || 'Untitled Stream'}
                streamer={channel.name}
                viewers="1.2k" // Mock viewers
                tags={channel.tags || ['Live']}
                thumbnail={`https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600`} // Mock thumbnail
             />
           ))}
         </div>
       ) : (
         <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-12 text-center mb-12">
            <p className="text-neutral-400 mb-4">You are not following any live channels.</p>
            <p className="text-sm text-neutral-500">Go explore and follow some streamers!</p>
         </div>
       )}

       <div className="border-t border-neutral-800 pt-8 mb-6">
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-poppins font-bold text-white">Offline Channels</h2>
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
                       <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-neutral-700 group-hover:border-beacon-500/50 transition-colors relative flex items-center justify-center text-neutral-400">
                           {channel.avatar ? (
                               <img src={channel.avatar} alt={channel.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                           ) : (
                               <User className="w-6 h-6 opacity-50 grayscale group-hover:grayscale-0 transition-all" />
                           )}
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
