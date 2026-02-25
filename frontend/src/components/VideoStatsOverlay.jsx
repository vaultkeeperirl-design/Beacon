import React from 'react';
import { useP2PStats, useP2PSettings } from '../context/P2PContext';

export default function VideoStatsOverlay() {
  const stats = useP2PStats();
  const { settings } = useP2PSettings();

  if (!settings.showStats) return null;

  return (
    <div className="absolute top-4 left-4 z-20 bg-black/80 backdrop-blur-md rounded-lg p-4 border border-white/10 font-mono text-xs text-white/90 shadow-xl pointer-events-none select-none max-w-xs animate-in fade-in duration-200">
      <h3 className="font-bold text-beacon-400 mb-2 border-b border-white/10 pb-1">STATS FOR NERDS</h3>
      <div className="space-y-1">
        <div className="flex justify-between gap-8">
          <span className="text-white/60">Quality:</span>
          <span>{settings.quality}</span>
        </div>
        <div className="flex justify-between gap-8">
          <span className="text-white/60">Latency:</span>
          <span>{settings.lowLatency ? 'Low (~2s)' : 'Standard (~8s)'}</span>
        </div>
        <div className="flex justify-between gap-8">
          <span className="text-white/60">Peers:</span>
          <span>{stats.peersConnected} connected</span>
        </div>
        <div className="flex justify-between gap-8">
          <span className="text-white/60">Upload:</span>
          <span className="text-green-400">{stats.uploadSpeed.toFixed(1)} Mbps</span>
        </div>
        <div className="flex justify-between gap-8">
          <span className="text-white/60">Download:</span>
          <span className="text-blue-400">{stats.downloadSpeed.toFixed(1)} Mbps</span>
        </div>
         <div className="flex justify-between gap-8">
          <span className="text-white/60">Buffer:</span>
          <span>{stats.bufferHealth.toFixed(2)}s</span>
        </div>
        <div className="flex justify-between gap-8">
          <span className="text-white/60">Frame Drops:</span>
          <span className="text-yellow-500">0 (0%)</span>
        </div>
         <div className="flex justify-between gap-8">
          <span className="text-white/60">P2P Ratio:</span>
          <span className="text-purple-400">{(stats.uploadSpeed / (stats.downloadSpeed || 1)).toFixed(2)}x</span>
        </div>
      </div>
    </div>
  );
}
