import React, { memo } from 'react';
import { useP2PStats } from '../context/P2PContext';

/**
 * ⚡ Performance Optimization: Isolated Stream Health Indicator
 * This component consumes the high-frequency `useP2PStats()` context.
 * By isolating it, we prevent the entire Watch and Broadcast layout pages
 * from re-rendering every 1-2 seconds when P2P metrics update.
 */
const StreamHealthIndicator = memo(function StreamHealthIndicator({
  peers,
  isViewer = true,
  hasStarted = false,
  remoteStream = null,
  isBroadcastView = false
}) {
  const stats = useP2PStats();

  const getStreamHealth = () => {
    const pcArray = Object.values(peers || {});
    if (isViewer) {
      if (!remoteStream && !hasStarted) return { text: 'Offline', color: 'text-neutral-500' };
      if (!remoteStream && hasStarted) return { text: 'Reconnecting...', color: 'text-yellow-500' };
    }

    if (pcArray.length > 0) {
      const badPeers = pcArray.filter(pc => ['disconnected', 'failed', 'closed'].includes(pc.iceConnectionState));
      if (badPeers.length > pcArray.length / 2) return { text: 'Poor', color: 'text-red-500' };
      if (badPeers.length > 0) return { text: 'Fair', color: 'text-yellow-500' };
      if (stats?.latency > 300) return { text: 'Fair (High Latency)', color: 'text-yellow-500' };
    }
    return { text: 'Excellent', color: 'text-green-500' };
  };

  const streamHealth = getStreamHealth();

  if (isBroadcastView) {
    return (
      <>
        <span className={`animate-pulse ${streamHealth.color}`}>●</span> Stream Health: {streamHealth.text}
      </>
    );
  }

  return (
    <span className="flex items-center gap-1 text-neutral-400 font-semibold px-2 py-0.5 rounded border border-neutral-700 bg-neutral-800">
       <span className={`w-2 h-2 rounded-full animate-pulse ${streamHealth.color.replace('text-', 'bg-')}`}></span>
       {streamHealth.text}
    </span>
  );
});

export default StreamHealthIndicator;
