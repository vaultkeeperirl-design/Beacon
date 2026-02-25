import React from 'react';
import { useP2PStats, useP2PSettings } from '../context/P2PContext';
import { Network, Upload, Download, Coins } from 'lucide-react';

export default function P2PStats() {
  const stats = useP2PStats();
  const { isSharing } = useP2PSettings();

  // If stats is undefined (e.g. context not provided), return null or fallback
  if (!stats) return null;

  return (
    <div className="bg-neutral-950/30 border border-beacon-500/20 rounded-lg p-4 w-full">
      <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-beacon-500" />
          <span className="font-semibold text-sm text-white">Node Status</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isSharing ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-xs text-neutral-400">{isSharing ? 'Relaying' : 'Offline'}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-400 text-xs">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </div>
          <span className="font-mono text-sm text-beacon-400">{stats.uploadSpeed.toFixed(1)} Mbps</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-400 text-xs">
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </div>
          <span className="font-mono text-sm text-blue-400">{stats.downloadSpeed.toFixed(1)} Mbps</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-800 mt-2">
           <div className="flex items-center gap-2 text-neutral-400 text-xs">
             <Coins className="w-3.5 h-3.5 text-yellow-500" />
             <span>Est. Earnings</span>
           </div>
           <span className="font-mono text-sm text-yellow-500">{stats.credits.toFixed(2)} CR</span>
        </div>

        <div className="text-xs text-center text-neutral-500 mt-1 pt-1">
          Peers Connected: <span className="text-white font-mono">{stats.peersConnected}</span>
        </div>
      </div>
    </div>
  );
}
