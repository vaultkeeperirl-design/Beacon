import React, { memo } from 'react';
import { Maximize, Minimize, Volume2, VolumeX, Settings, Pause, Play } from 'lucide-react';

const VideoControls = memo(({
  isPlaying,
  onPlayToggle,
  isMuted,
  onMuteToggle,
  isFullscreen,
  onFullscreenToggle,
  onSettingsToggle,
  quality
}) => {
  return (
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            className="text-white hover:text-beacon-500 transition-colors"
            onClick={onPlayToggle}
            aria-label={isPlaying ? "Pause stream" : "Play stream"}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
          </button>
          <button
            className="text-white hover:text-beacon-500 transition-colors group/vol"
            onClick={onMuteToggle}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2 text-sm font-bold text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
             <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
             LIVE
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-beacon-400 border border-beacon-500/30 px-2 py-0.5 rounded bg-beacon-500/10">
            P2P: {quality}
          </span>
          <button
            className="text-white hover:text-beacon-500 transition-colors"
            onClick={onSettingsToggle}
            aria-label="Open stream settings"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            className="text-white hover:text-beacon-500 transition-colors"
            onClick={onFullscreenToggle}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Progress Bar (Mock - live is always full) */}
      <div className="mt-4 h-1.5 w-full bg-neutral-800/50 rounded-full overflow-hidden backdrop-blur-sm">
         <div className="h-full bg-beacon-500 w-full relative animate-pulse">
         </div>
      </div>
    </div>
  );
});

VideoControls.displayName = 'VideoControls';

export default VideoControls;
