import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';

const StreamCard = memo(function StreamCard({ id, title, streamer, viewers, thumbnail, tags, isLive = true }) {
  return (
    <div className="group block space-y-3">
      <Link to={`/watch/${id}`} className="block relative aspect-video rounded-lg overflow-hidden bg-neutral-800 border border-neutral-800 group-hover:border-beacon-500/50 transition-colors">
        <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        {isLive && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
            Live
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
          <Eye className="w-3 h-3 text-beacon-400" />
          <span>{viewers}</span>
        </div>
      </Link>

      <div className="flex gap-3">
        <Link to={`/channel/${streamer}`} className="block w-10 h-10 rounded-full bg-neutral-700 flex-shrink-0 overflow-hidden border border-neutral-800 hover:ring-2 hover:ring-beacon-500 transition-all">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${streamer}`} alt={streamer} className="w-full h-full object-cover" loading="lazy" />
        </Link>

        <div className="min-w-0 flex-1">
          <Link to={`/watch/${id}`} className="block font-semibold text-white leading-tight truncate group-hover:text-beacon-400 transition-colors mb-0.5">
            {title}
          </Link>
          <Link to={`/channel/${streamer}`} className="block text-sm text-neutral-400 truncate hover:text-white transition-colors">
            {streamer}
          </Link>

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[10px] font-medium hover:bg-neutral-700 transition-colors">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default StreamCard;
