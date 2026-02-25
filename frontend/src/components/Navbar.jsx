import { Link } from 'react-router-dom';
import { Search, User, Zap, Wallet, Radio } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-beacon-500 rounded-lg flex items-center justify-center transform rotate-3">
            <Zap className="text-white fill-current w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Beacon</span>
        </Link>
        <div className="hidden md:flex ml-6 space-x-1">
           <Link to="/" className="text-neutral-300 hover:text-beacon-400 font-medium px-3 py-2 rounded-md transition-colors text-sm">Browse</Link>
           <Link to="/following" className="text-neutral-300 hover:text-beacon-400 font-medium px-3 py-2 rounded-md transition-colors text-sm">Following</Link>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-4 hidden sm:block">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-neutral-500 group-focus-within:text-beacon-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-neutral-800 rounded-full leading-5 bg-neutral-950 text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-beacon-500/50 focus:ring-1 focus:ring-beacon-500/50 sm:text-sm transition-colors"
            placeholder="Search streams..."
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link to="/wallet">
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-neutral-400 bg-neutral-950 px-3 py-1.5 rounded-full border border-neutral-800 hover:border-beacon-500/30 transition-colors cursor-pointer group">
             <Wallet className="w-3.5 h-3.5 text-beacon-500 group-hover:text-beacon-400 transition-colors" />
             <span className="font-mono text-white group-hover:text-beacon-100">2,450 CR</span>
          </div>
        </Link>

        <Link to="/broadcast">
            <button className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors border border-neutral-700 hover:border-neutral-600">
              <Radio className="w-4 h-4 text-beacon-500" />
              <span>Go Live</span>
            </button>
        </Link>

        <button className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700 hover:border-beacon-500 transition-colors">
          <User className="w-4 h-4 text-neutral-400" />
        </button>
      </div>
    </nav>
  );
}
