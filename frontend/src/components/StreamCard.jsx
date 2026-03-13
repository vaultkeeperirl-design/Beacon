import { memo, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Eye, User } from 'lucide-react';

// ⚡ Performance Optimization: StreamCard is a high-frequency component used in lists.
// By processing tags and thumbnails internally with useMemo, we allow the parent
// to pass raw data (like a comma-separated string for tags). This ensures that
// React.memo can bail out on re-renders since it will receive the same string
// reference instead of a new array created by .split() in the parent's render loop.
const StreamCard = memo(function StreamCard({ id, title = 'Untitled Stream', streamer, viewers = 0, thumbnail, tags, avatar, isLive = true }) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Memoize tag processing to avoid re-calculating on every render
  // and to provide a stable reference if tags haven't changed.
  const processedTags = useMemo(() => {
    if (!tags) return ['Live'];
    if (Array.isArray(tags)) return tags.length > 0 ? tags : ['Live'];
    if (typeof tags === 'string') {
      const split = tags.split(',').map(t => t.trim()).filter(Boolean);
      return split.length > 0 ? split : ['Live'];
    }
    return ['Live'];
  }, [tags]);

  // Memoize thumbnail with fallback
  const displayThumbnail = useMemo(() => {
    return thumbnail || `https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600`;
  }, [thumbnail]);

  return (
    <div className="group block space-y-3">
      <Link to={`/watch/${id}`} className="block relative aspect-video rounded-lg overflow-hidden bg-neutral-800 border border-neutral-800 group-hover:border-beacon-500/50 transition-colors">
        {!isLoaded && (
          <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
        )}
        <img
          src={displayThumbnail}
          alt={title}
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
        />
        {isLive && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
            Live
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
          <Eye className="w-3 h-3 text-beacon-400" />
          <span>{(viewers || 0).toLocaleString()}</span>
        </div>
      </Link>

      <div className="flex gap-3">
        <Link to={`/channel/${streamer}`} className="block w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0 overflow-hidden border border-neutral-800 hover:ring-2 hover:ring-beacon-500 transition-all text-neutral-400">
          {avatar ? (
            <img src={avatar} alt={streamer} className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 opacity-50" />
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <Link to={`/watch/${id}`} className="block font-semibold text-white leading-tight truncate group-hover:text-beacon-400 transition-colors mb-0.5">
            {title}
          </Link>
          <Link to={`/channel/${streamer}`} className="block text-sm text-neutral-400 truncate hover:text-white transition-colors">
            {streamer}
          </Link>

          {processedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {processedTags.map(tag => (
                <Link
                  key={tag}
                  to={`/browse?q=${encodeURIComponent(tag)}`}
                  aria-label={`Search for tag: ${tag}`}
                  title={`Search for tag: ${tag}`}
                  className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[10px] font-medium hover:bg-neutral-700 hover:text-beacon-400 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default StreamCard;
