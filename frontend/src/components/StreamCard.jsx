import { Link } from 'react-router-dom';
import { User, Eye } from 'lucide-react';

export default function StreamCard({ id, title, streamer, viewers, thumbnail, tags }) {
  return (
    <Link to={`/watch/${id}`} className="group block space-y-3">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-neutral-800 border border-neutral-800 group-hover:border-beacon-500/50 transition-colors">
        <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
          Live
        </div>
        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
          <Eye className="w-3 h-3 text-beacon-400" />
          <span>{viewers}</span>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-neutral-700 flex-shrink-0 overflow-hidden border border-neutral-800">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${streamer}`} alt={streamer} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white leading-tight truncate group-hover:text-beacon-400 transition-colors">{title}</h3>
          <p className="text-sm text-neutral-400 truncate mt-0.5">{streamer}</p>
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
    </Link>
  );
}
