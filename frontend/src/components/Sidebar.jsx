import { memo, useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, Users, BarChart2, Compass, ShieldCheck, FileText, User } from 'lucide-react';
import P2PStats from './P2PStats';
import axios from 'axios';
import { API_URL } from '../config/api';

// 🗿 Sculptor: Extracted repetitive NavLink styling logic
const SidebarLink = memo(function SidebarLink({ to, icon, children }) {
  const Icon = icon;
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beacon-500 ${
          isActive
            ? 'text-white bg-neutral-800'
            : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-beacon-500' : 'group-hover:text-beacon-500'}`} />
          <span className="font-medium text-sm">{children}</span>
        </>
      )}
    </NavLink>
  );
});

const Sidebar = memo(function Sidebar() {
  const [recommendedChannels, setRecommendedChannels] = useState([]);

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const res = await axios.get(`${API_URL}/streams?limit=5`);
        // Limit to 5 recommended channels for the sidebar
        setRecommendedChannels(res.data);
      } catch (err) {
        console.error('Failed to fetch recommended channels:', err);
      }
    };

    fetchRecommended();
    const interval = setInterval(fetchRecommended, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

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
            <SidebarLink key={item.name} to={item.path} icon={item.icon}>
              {item.name}
            </SidebarLink>
          ))}

          <div className="pt-6 border-t border-neutral-800 mt-4">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4 px-3">
               Legal
            </h3>
            <div className="space-y-1 mb-6">
                <SidebarLink to="/terms" icon={FileText}>
                  Terms of Service
                </SidebarLink>
                <SidebarLink to="/guidelines" icon={ShieldCheck}>
                  Guidelines
                </SidebarLink>
            </div>

            {recommendedChannels.length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4 px-3">
                  Recommended Channels
                </h3>
                <div className="space-y-3">
                  {recommendedChannels.map((channel) => (
                    <Link
                      to={`/watch/${channel.id}`}
                      key={channel.id}
                      className="flex items-center gap-3 px-3 py-1 cursor-pointer hover:bg-neutral-800/50 rounded-lg group transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beacon-500"
                    >
                      <div className="w-8 h-8 rounded-full bg-neutral-800 overflow-hidden relative border border-neutral-700 group-hover:border-beacon-500 transition-colors flex items-center justify-center text-neutral-400">
                        {channel.avatar ? (
                          <img src={channel.avatar} alt={channel.streamer} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 opacity-50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-300 truncate group-hover:text-white transition-colors">{channel.streamer}</p>
                        <p className="text-xs text-neutral-500 truncate">{channel.title}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full bg-red-500 animate-pulse"
                          role="img"
                          aria-label="Live"
                        ></div>
                        <span className="text-xs text-neutral-500">
                          {channel.viewers >= 1000 ? (channel.viewers / 1000).toFixed(1) + 'k' : channel.viewers}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
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
