import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Home, Users, BarChart2, MessageSquare, Radio, Compass, ShieldCheck, FileText, User } from 'lucide-react';
import P2PStats from './P2PStats';

const Sidebar = memo(function Sidebar() {
  const menuItems = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'Browse', icon: Compass, path: '/browse' },
    { name: 'Following', icon: Users, path: '/following' },
    { name: 'Wallet & Credits', icon: BarChart2, path: '/wallet' },
  ];

  return (
    <aside className="w-64 bg-neutral-900 border-r border-neutral-800 hidden lg:flex flex-col shrink-0 z-40">
      <div className="sticky top-16 h-[calc(100vh_-_4rem)] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
          {menuItems.map((item) => (
            <Link to={item.path} key={item.name} className="flex items-center gap-3 px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors group">
              <item.icon className="w-5 h-5 group-hover:text-beacon-500 transition-colors" />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          ))}

          <div className="pt-6 border-t border-neutral-800 mt-4">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4 px-3">
               Legal
            </h3>
            <div className="space-y-1 mb-6">
                <Link to="/terms" className="flex items-center gap-3 px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors group">
                    <FileText className="w-5 h-5 group-hover:text-beacon-500 transition-colors" />
                    <span className="font-medium text-sm">Terms of Service</span>
                </Link>
                <Link to="/guidelines" className="flex items-center gap-3 px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors group">
                    <ShieldCheck className="w-5 h-5 group-hover:text-beacon-500 transition-colors" />
                    <span className="font-medium text-sm">Guidelines</span>
                </Link>
            </div>

            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4 px-3">
              Recommended Channels
            </h3>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Link to={`/channel/Streamer_${i}`} key={i} className="flex items-center gap-3 px-3 py-1 cursor-pointer hover:bg-neutral-800/50 rounded-lg group transition-colors">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 overflow-hidden relative border border-neutral-700 group-hover:border-beacon-500 transition-colors flex items-center justify-center text-neutral-400">
                    <User className="w-4 h-4 opacity-50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-300 truncate group-hover:text-white transition-colors">Streamer_{i}</p>
                    <p className="text-xs text-neutral-500 truncate">Just Chatting</p>
                  </div>
                  <div className="flex items-center gap-1">
                     <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                     <span className="text-xs text-neutral-500">{((i * 0.8 + 0.5) % 5).toFixed(1)}k</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-neutral-800 bg-neutral-900">
           <P2PStats />
        </div>
      </div>
    </aside>
  );
});

export default Sidebar;
