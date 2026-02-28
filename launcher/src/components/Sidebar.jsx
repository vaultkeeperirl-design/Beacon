import React, { useState, useEffect } from 'react';
import { Radio, User, LogOut } from 'lucide-react';
import AuthModal from './AuthModal';

export default function Sidebar() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('beacon_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Could not parse user", e);
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('beacon_token');
    localStorage.removeItem('beacon_user');
    setUser(null);
  };

  return (
    <div className="w-16 h-screen bg-gray-950 flex flex-col items-center py-4 border-r border-gray-800">
      <div className="mb-6 p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg shadow-lg shadow-orange-900/20">
        <Radio className="w-6 h-6 text-white" />
      </div>

      <div className="flex-1 flex flex-col items-center gap-4">
        {/* Active Game Item */}
        <div className="group relative">
           <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
           <button className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700">
             <img src="icon.png" alt="Beacon" className="w-8 h-8 object-contain" />
           </button>
        </div>

        {/* Placeholder for other games */}
        <button className="w-10 h-10 rounded bg-transparent flex items-center justify-center hover:bg-gray-800 transition-colors opacity-50 cursor-not-allowed" title="More Coming Soon">
           <div className="w-8 h-8 border-2 border-dashed border-gray-600 rounded-full"></div>
        </button>
      </div>

      <div className="mt-auto flex flex-col items-center gap-4 group">
        {user ? (
          <div className="relative group/profile">
             {user.avatar_url ? (
               <button
                 onClick={() => {}}
                 title={user.username}
                 className="w-10 h-10 rounded-full bg-gray-800 border-2 border-orange-500 overflow-hidden"
               >
                 <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
               </button>
             ) : (
               <button
                 onClick={() => {}}
                 title={user.username}
                 className="w-10 h-10 rounded-full bg-gray-800 border-2 border-orange-500 flex items-center justify-center text-orange-400 font-bold"
               >
                 {user.username.substring(0, 1).toUpperCase()}
               </button>
             )}

             {/* Logout tooltip / button */}
             <div className="absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover/profile:opacity-100 transition-opacity pointer-events-none group-hover/profile:pointer-events-auto">
                <button
                  onClick={handleLogout}
                  className="bg-gray-800 border border-gray-700 p-2 rounded text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
             </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            title="Log In"
            className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 hover:border-orange-500 hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            <User className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
