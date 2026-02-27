import React, { memo } from 'react';
import { Maximize, Minimize, Volume2, VolumeX, Settings, Pause, Play } from 'lucide-react';

const VideoControls = memo(({
  isPlaying,
  onPlayToggle,
  isMuted,
  onMuteToggle,
  volume = 1,
  onVolumeChange = () => {},
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
            aria-label={isPlaying ? "Pause stream (Space/k)" : "Play stream (Space/k)"}
            title={isPlaying ? "Pause (Space/k)" : "Play (Space/k)"}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
          </button>
          <button
            className="text-white hover:text-beacon-500 transition-colors group/vol"
            onClick={onMuteToggle}
            aria-label={isMuted ? "Unmute audio (m)" : "Mute audio (m)"}
            title={isMuted ? "Unmute (m)" : "Mute (m)"}
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>

          <div className="flex items-center gap-2 group/vol-control">
             <button
               className="text-white hover:text-beacon-500 transition-colors"
               onClick={onMuteToggle}
               aria-label={isMuted ? "Unmute audio" : "Mute audio"}
               title={isMuted ? "Unmute" : "Mute"}
             >
               {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
             </button>

             <input
               type="range"
               min="0"
               max="1"
               step="0.01"
               value={isMuted ? 0 : volume}
               onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
               className="w-24 h-1.5 bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-beacon-500 hover:accent-beacon-400 transition-all opacity-0 group-hover/vol-control:opacity-100 duration-200"
               aria-label="Volume"
             />
          </div>

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
            aria-label={isFullscreen ? "Exit Fullscreen (f)" : "Enter Fullscreen (f)"}
            title={isFullscreen ? "Exit Fullscreen (f)" : "Enter Fullscreen (f)"}
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
