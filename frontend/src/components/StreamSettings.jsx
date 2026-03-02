import React, { memo, useRef, useEffect } from 'react';
import { useP2PSettings } from '../context/P2PContext';
import { X, Server, Wifi, Zap, Activity } from 'lucide-react';

const StreamSettings = memo(function StreamSettings({ isOpen, onClose }) {
  // Using useP2PSettings instead of useP2P to avoid unnecessary re-renders when stats update.
  // Settings only change when the user interacts with this modal.
  const { settings, updateSettings, isSharing, setIsSharing, username, updateUsername } = useP2PSettings();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-16 right-4 z-50 bg-neutral-900/95 border border-neutral-800 rounded-xl w-72 p-4 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-200"
    >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-400 hover:text-white transition-colors"
          aria-label="Close"
          title="Close Settings"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-beacon-500" />
          Stream Configuration
        </h2>

        <div className="space-y-4 pr-1">
           {/* User Settings */}
          <div className="space-y-2 pb-3 border-b border-neutral-800">
            <label htmlFor="username" className="text-xs font-semibold text-neutral-300">Display Name</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => updateUsername(e.target.value)}
              className="w-full bg-neutral-800 text-white rounded px-2 py-1.5 text-xs border border-neutral-700 focus:outline-none focus:border-beacon-500"
              placeholder="Enter your username"
            />
          </div>

          {/* Quality Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">Video Quality</label>
            <div className="grid grid-cols-3 gap-1.5">
              {['1080p60', '720p60', '480p'].map((q) => (
                <button
                  key={q}
                  onClick={() => updateSettings({ quality: q })}
                  aria-pressed={settings.quality === q}
                  aria-label={`Select ${q} quality`}
                  className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
                    settings.quality === q
                      ? 'bg-beacon-600 text-white border-beacon-500 shadow-md shadow-beacon-600/20'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Max Upload Speed */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label htmlFor="max-upload-speed" className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-blue-500" />
                Max Upload Speed
              </label>
              <span className="text-xs font-mono text-blue-400">{settings.maxUploadSpeed} Mbps</span>
            </div>
            <input
              id="max-upload-speed"
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.maxUploadSpeed}
              onChange={(e) => updateSettings({ maxUploadSpeed: Number(e.target.value) })}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
              aria-label="Max Upload Speed"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-3 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-500/10 rounded-lg text-yellow-500">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs font-semibold text-white">Low Latency Mode</p>
              </div>
              <button
                onClick={() => updateSettings({ lowLatency: !settings.lowLatency })}
                role="switch"
                aria-checked={settings.lowLatency}
                aria-label="Low Latency Mode"
                className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center ${
                  settings.lowLatency ? 'bg-beacon-600' : 'bg-neutral-700'
                }`}
              >
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute transition-transform ${
                  settings.lowLatency ? 'left-[18px]' : 'left-0.5'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-500">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs font-semibold text-white">Stats for Nerds</p>
              </div>
              <button
                onClick={() => updateSettings({ showStats: !settings.showStats })}
                role="switch"
                aria-checked={settings.showStats}
                aria-label="Show Stats"
                className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center ${
                  settings.showStats ? 'bg-beacon-600' : 'bg-neutral-700'
                }`}
              >
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute transition-transform ${
                  settings.showStats ? 'left-[18px]' : 'left-0.5'
                }`} />
              </button>
            </div>

             <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-500/10 rounded-lg text-green-500">
                  <Server className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs font-semibold text-white">P2P Sharing</p>
              </div>
              <button
                onClick={() => setIsSharing(!isSharing)}
                role="switch"
                aria-checked={isSharing}
                aria-label="P2P Sharing"
                className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center ${
                  isSharing ? 'bg-beacon-600' : 'bg-neutral-700'
                }`}
              >
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute transition-transform ${
                  isSharing ? 'left-[18px]' : 'left-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>
    </div>
  );
});

export default StreamSettings;
