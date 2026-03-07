import { useState, useEffect, useMemo } from 'react';
import StreamCard from '../components/StreamCard';
import StreamCardSkeleton from '../components/StreamCardSkeleton';
import { ChevronDown, Heart, Activity, User } from 'lucide-react';
import { useFollowing } from '../context/FollowingContext';
import axios from 'axios';
import { API_URL } from '../config/api';

export default function Following() {
  const { followedChannels } = useFollowing();
  const [liveStreams, setLiveStreams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('recently-live');
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    const fetchLiveStreams = async () => {
      try {
        const res = await axios.get(`${API_URL}/streams`);
        setLiveStreams(res.data);
      } catch (err) {
        console.error('Failed to fetch live streams', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLiveStreams();
  }, []);

  const { liveChannels, offlineChannels } = useMemo(() => {
    const live = [];
    const offline = [];

    // ⚡ Performance Optimization: Replace O(N*M) nested loop with O(N+M) Map lookup
    // Creates a map of live streams keyed by streamer name/id for O(1) access
    const liveStreamsMap = new Map();
    for (const stream of liveStreams) {
      liveStreamsMap.set(stream.streamer, stream);
    }

    followedChannels.forEach(channel => {
      // Check if the followed channel is in the active streams list using the Map
      const activeStream = liveStreamsMap.get(channel.id) || liveStreamsMap.get(channel.name);
      if (activeStream) {
        live.push({
          ...channel,
          ...activeStream, // Override with active stream data (e.g. title, viewers, thumbnail)
          isLive: true
        });
      } else {
        offline.push({
          ...channel,
          isLive: false
        });
      }
    });

    return { liveChannels: live, offlineChannels: offline };
  }, [followedChannels, liveStreams]);

  const sortedOfflineChannels = useMemo(() => {
    let sorted = [...offlineChannels];
    if (sortOrder === 'alphabetical') {
      sorted.sort((a, b) => {
        const nameA = a.name || a.username || a.id || '';
        const nameB = b.name || b.username || b.id || '';
        return nameA.localeCompare(nameB);
      });
    }
    return sorted;
  }, [offlineChannels, sortOrder]);

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
            {!isLoading && <span className="bg-beacon-500 text-white font-bold text-xs px-2 py-0.5 rounded-full ml-2">{liveChannels.length}</span>}
         </div>
       </div>

       {isLoading ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
           {Array.from({ length: 4 }).map((_, i) => (
             <StreamCardSkeleton key={i} />
           ))}
         </div>
       ) : liveChannels.length > 0 ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
           {liveChannels.map(channel => (
             <StreamCard
                key={channel.id}
                id={channel.id}
                title={channel.title || 'Untitled Stream'}
                streamer={channel.streamer || channel.name}
                viewers={channel.viewers || 0}
                avatar={channel.avatar}
                tags={typeof channel.tags === 'string' ? channel.tags.split(',').map(t => t.trim()) : (channel.tags || ['Live'])}
                thumbnail={channel.thumbnail || `https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600`}
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
             <div className="flex gap-2 relative">
                <div className="relative">
                  <button
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
                    aria-haspopup="true"
                    aria-expanded={isSortOpen}
                  >
                    <span>Sort by: {sortOrder === 'recently-live' ? 'Recently Live' : 'Alphabetical (A-Z)'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSortOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)}></div>
                      <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <button
                          onClick={() => { setSortOrder('recently-live'); setIsSortOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-800 transition-colors ${sortOrder === 'recently-live' ? 'text-beacon-400 font-bold bg-neutral-800/50' : 'text-neutral-300'}`}
                        >
                          Recently Live
                        </button>
                        <button
                          onClick={() => { setSortOrder('alphabetical'); setIsSortOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-800 transition-colors border-t border-neutral-800 ${sortOrder === 'alphabetical' ? 'text-beacon-400 font-bold bg-neutral-800/50' : 'text-neutral-300'}`}
                        >
                          Alphabetical (A-Z)
                        </button>
                      </div>
                    </>
                  )}
                </div>
             </div>
           </div>

           {sortedOfflineChannels.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {sortedOfflineChannels.map(channel => (
                     <div key={channel.id} className="flex items-center gap-4 p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl hover:bg-neutral-800/80 hover:border-neutral-700 transition-all cursor-pointer group">
                         <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-neutral-700 group-hover:border-beacon-500/50 transition-colors relative flex items-center justify-center text-neutral-400 flex-shrink-0">
                             {channel.avatar ? (
                                 <img src={channel.avatar} alt={channel.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                             ) : (
                                 <User className="w-6 h-6 opacity-50 grayscale group-hover:grayscale-0 transition-all" />
                             )}
                         </div>
                         <div className="min-w-0">
                             <h3 className="font-bold text-white group-hover:text-beacon-400 transition-colors truncate">{channel.name}</h3>
                             <p className="text-xs text-neutral-500 truncate">{channel.title || 'Offline'}</p>
                         </div>
                     </div>
                 ))}
             </div>
           ) : (
             <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-xl p-8 text-center">
                 <p className="text-neutral-500 text-sm">You are not following any offline channels.</p>
             </div>
           )}
       </div>
    </div>
  );
}
