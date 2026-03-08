import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import StreamCard from '../components/StreamCard';
import StreamCardSkeleton from '../components/StreamCardSkeleton';
import { Filter, ChevronDown, Flame, Search, X } from 'lucide-react';
import { API_URL } from '../config/api';

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [streams, setStreams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('recommended');
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const res = await axios.get(`${API_URL}/streams`);
        setStreams(res.data);
      } catch (err) {
        console.error('Error fetching streams:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStreams();
  }, []);

  const filteredStreams = useMemo(() => {
    let result = streams;
    if (query) {
      const lowerQuery = query.toLowerCase();
      result = streams.filter(stream =>
        stream.title.toLowerCase().includes(lowerQuery) ||
        stream.streamer.toLowerCase().includes(lowerQuery) ||
        (typeof stream.tags === 'string' && stream.tags.toLowerCase().includes(lowerQuery))
      );
    }

    // Create a new array to avoid mutating the original before sorting
    let sorted = [...result];
    if (sortOrder === 'viewers') {
      sorted.sort((a, b) => (b.viewers || 0) - (a.viewers || 0));
    } else if (sortOrder === 'alphabetical') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    // 'recommended' leaves it as-is (usually ordered by the API response)

    return sorted;
  }, [query, streams, sortOrder]);

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
         <div className="flex gap-2 relative">
            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
                aria-haspopup="true"
                aria-expanded={isSortOpen}
              >
                <span>Sort by: {sortOrder === 'viewers' ? 'Most Viewers' : sortOrder === 'alphabetical' ? 'Alphabetical (A-Z)' : 'Recommended'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSortOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSortOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={() => { setSortOrder('recommended'); setIsSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-800 transition-colors ${sortOrder === 'recommended' ? 'text-beacon-400 font-bold bg-neutral-800/50' : 'text-neutral-300'}`}
                    >
                      Recommended
                    </button>
                    <button
                      onClick={() => { setSortOrder('viewers'); setIsSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-800 transition-colors border-t border-neutral-800 ${sortOrder === 'viewers' ? 'text-beacon-400 font-bold bg-neutral-800/50' : 'text-neutral-300'}`}
                    >
                      Most Viewers
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

            <button className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
         </div>
       </div>

       {isLoading ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
           {Array.from({ length: 8 }).map((_, i) => (
             <StreamCardSkeleton key={i} />
           ))}
         </div>
       ) : filteredStreams.length > 0 ? (
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
