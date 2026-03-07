import { memo } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, Users, BarChart2, Compass, ShieldCheck, FileText, User } from 'lucide-react';
import P2PStats from './P2PStats';

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

            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4 px-3">
              Recommended Channels
            </h3>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Link
                  to={`/channel/Streamer_${i}`}
                  key={i}
                  className="flex items-center gap-3 px-3 py-1 cursor-pointer hover:bg-neutral-800/50 rounded-lg group transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beacon-500"
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-800 overflow-hidden relative border border-neutral-700 group-hover:border-beacon-500 transition-colors flex items-center justify-center text-neutral-400">
                    <User className="w-4 h-4 opacity-50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-300 truncate group-hover:text-white transition-colors">Streamer_{i}</p>
                    <p className="text-xs text-neutral-500 truncate">Just Chatting</p>
                  </div>
                  <div className="flex items-center gap-1">
                     <div
                       className="w-2 h-2 rounded-full bg-red-500 animate-pulse"
                       role="img"
                       aria-label="Live"
                     ></div>
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
