import { memo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Radio, LogOut } from 'lucide-react';
import WalletBalance from './WalletBalance';
import { useP2PSettings } from '../context/P2PContext';

const Navbar = memo(function Navbar() {
  const { username, user, token, logout } = useP2PSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/icon.png" alt="Beacon" className="w-10 h-10 object-contain" />
          <span className="text-xl font-poppins font-extrabold tracking-tight text-brand">Beacon</span>
        </Link>
        <div className="hidden md:flex ml-6 space-x-1">
           <Link to="/" className="text-neutral-300 hover:text-beacon-400 font-medium px-3 py-2 rounded-md transition-colors text-sm">Browse</Link>
           <Link to="/following" className="text-neutral-300 hover:text-beacon-400 font-medium px-3 py-2 rounded-md transition-colors text-sm">Following</Link>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-4 hidden sm:block">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-neutral-500 group-focus-within:text-beacon-500 transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-neutral-800 rounded-full leading-5 bg-neutral-950 text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-beacon-500/50 focus:ring-1 focus:ring-beacon-500/50 sm:text-sm transition-colors"
            placeholder="Search streams..."
          />
        </form>
      </div>

      <div className="flex items-center gap-3">
        {token ? (
          <>
            <WalletBalance />

            <Link
              to="/broadcast"
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors border border-neutral-700 hover:border-neutral-600"
            >
              <Radio className="w-4 h-4 text-beacon-500" />
              <span>Go Live</span>
            </Link>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700 hover:border-beacon-500 transition-colors overflow-hidden"
                aria-label="Profile Menu"
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={username} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-neutral-400" />
                )}
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl py-1 z-50">
                  <div className="px-4 py-2 border-b border-neutral-800">
                    <p className="text-sm font-medium text-white truncate">{username}</p>
                  </div>
                  <Link
                    to={`/channel/${username}`}
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  >
                    My Channel
                  </Link>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-neutral-800 hover:text-red-300 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-1.5 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="px-4 py-1.5 bg-beacon-600 hover:bg-beacon-500 text-white rounded-md text-sm font-medium transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
});

export default Navbar;
