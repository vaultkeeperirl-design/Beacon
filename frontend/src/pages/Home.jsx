import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div>
       {/* Featured Banner */}
       <div className="mb-8 relative h-64 sm:h-80 rounded-2xl overflow-hidden group">
          <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover" alt="Featured" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-8">
             <div className="max-w-2xl animate-fade-in-up">
                <span className="bg-beacon-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block">Featured Stream</span>
                <h1 className="text-4xl font-poppins font-extrabold text-white mb-2 leading-tight">The Grand Tournament Finals</h1>
                <p className="text-neutral-300 mb-4 line-clamp-2">Watch the top players compete for the championship title in this epic showdown. Powered by decentralized streaming nodes.</p>
                <div className="flex gap-4">
                  <button className="bg-white text-black hover:bg-neutral-200 px-6 py-2 rounded-lg font-bold transition-colors">
                     Watch Now
                  </button>
                  <Link to="/browse" className="bg-neutral-900/80 backdrop-blur-sm text-white border border-neutral-700 hover:bg-neutral-800 px-6 py-2 rounded-lg font-bold transition-colors flex items-center justify-center">
                     Browse Channels
                  </Link>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
