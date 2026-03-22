import React, { memo, useRef, useEffect } from 'react';
import { useP2PSettings } from '../context/P2PContext';
import { X, Server, Wifi, Zap, Activity } from 'lucide-react';

const ToggleButton = memo(function ToggleButton({ id, label, icon, iconColorClass, iconBgClass, checked, onChange }) {
  const IconComponent = icon;
  return (
    <div
      onClick={onChange}
      className="flex items-center justify-between cursor-pointer hover:bg-neutral-800/50 active:scale-[0.98] transition-all p-1.5 -mx-1.5 rounded-lg group"
    >
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${iconBgClass} ${iconColorClass}`}>
          <IconComponent className="w-3.5 h-3.5" />
        </div>
        <label
          htmlFor={id}
          className="text-xs font-semibold text-white cursor-pointer"
          onClick={(e) => e.preventDefault()}
        >
          {label}
        </label>
      </div>
      <button
        id={id}
        onClick={(e) => {
          e.stopPropagation();
          onChange();
        }}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center ${
          checked ? 'bg-beacon-600' : 'bg-neutral-700'
        }`}
      >
        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute transition-transform ${
          checked ? 'left-[18px]' : 'left-0.5'
        }`} />
      </button>
    </div>
  );
});

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

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
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
          aria-label="Close Stream Settings"
          title="Close Stream Settings"
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
            <ToggleButton
              id="low-latency-toggle"
              label="Low Latency Mode"
              icon={Zap}
              iconColorClass="text-yellow-500"
              iconBgClass="bg-yellow-500/10"
              checked={settings.lowLatency}
              onChange={() => updateSettings({ lowLatency: !settings.lowLatency })}
            />
            <ToggleButton
              id="stats-toggle"
              label="Stats for Nerds"
              icon={Activity}
              iconColorClass="text-purple-500"
              iconBgClass="bg-purple-500/10"
              checked={settings.showStats}
              onChange={() => updateSettings({ showStats: !settings.showStats })}
            />
            <ToggleButton
              id="p2p-toggle"
              label="P2P Sharing"
              icon={Server}
              iconColorClass="text-green-500"
              iconBgClass="bg-green-500/10"
              checked={isSharing}
              onChange={() => setIsSharing(!isSharing)}
            />
          </div>
        </div>
    </div>
  );
});

export default StreamSettings;
