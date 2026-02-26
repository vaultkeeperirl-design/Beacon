import React from 'react';
import { useP2PSettings } from '../context/P2PContext';
import { X, Server, Wifi, Zap, Activity } from 'lucide-react';

export default function StreamSettings({ isOpen, onClose }) {
  // Using useP2PSettings instead of useP2P to avoid unnecessary re-renders when stats update.
  // Settings only change when the user interacts with this modal.
  const { settings, updateSettings, isSharing, setIsSharing } = useP2PSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Server className="w-5 h-5 text-beacon-500" />
          Stream Configuration
        </h2>

        <div className="space-y-6">
          {/* Quality Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-neutral-300">Video Quality</label>
            <div className="grid grid-cols-3 gap-2">
              {['1080p60', '720p60', '480p'].map((q) => (
                <button
                  key={q}
                  onClick={() => updateSettings({ quality: q })}
                  aria-pressed={settings.quality === q}
                  aria-label={`Select ${q} quality`}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    settings.quality === q
                      ? 'bg-beacon-600 text-white border-beacon-500 shadow-lg shadow-beacon-600/20'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Max Upload Speed */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <label htmlFor="max-upload-speed" className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
                <Wifi className="w-4 h-4 text-blue-500" />
                Max Upload Speed
              </label>
              <span className="text-sm font-mono text-blue-400">{settings.maxUploadSpeed} Mbps</span>
            </div>
            <input
              id="max-upload-speed"
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.maxUploadSpeed}
              onChange={(e) => updateSettings({ maxUploadSpeed: Number(e.target.value) })}
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
              aria-label="Max Upload Speed"
            />
            <p className="text-xs text-neutral-500">
              Higher upload limits allow you to earn more Credits (CR) by relaying to more peers.
            </p>
          </div>

          {/* Toggles */}
          <div className="space-y-4 pt-4 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Low Latency Mode</p>
                  <p className="text-xs text-neutral-500">Reduces buffer for real-time interaction</p>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ lowLatency: !settings.lowLatency })}
                role="switch"
                aria-checked={settings.lowLatency}
                aria-label="Low Latency Mode"
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.lowLatency ? 'bg-beacon-600' : 'bg-neutral-700'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  settings.lowLatency ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Stats for Nerds</p>
                  <p className="text-xs text-neutral-500">Show detailed overlay on video</p>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ showStats: !settings.showStats })}
                role="switch"
                aria-checked={settings.showStats}
                aria-label="Show Stats"
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.showStats ? 'bg-beacon-600' : 'bg-neutral-700'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  settings.showStats ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>

             <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">P2P Sharing</p>
                  <p className="text-xs text-neutral-500">Enable/Disable relaying</p>
                </div>
              </div>
              <button
                onClick={() => setIsSharing(!isSharing)}
                role="switch"
                aria-checked={isSharing}
                aria-label="P2P Sharing"
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  isSharing ? 'bg-beacon-600' : 'bg-neutral-700'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  isSharing ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-800 flex justify-end">
             <button onClick={onClose} className="px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors text-sm">
                 Done
             </button>
        </div>
      </div>
    </div>
  );
}
