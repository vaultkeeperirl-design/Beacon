import { useState, useRef, useEffect } from 'react';
import { Camera, Mic, MicOff, CameraOff, Settings, Monitor, Radio, Users, Percent, Trash2 } from 'lucide-react';
import { useP2PSettings } from '../context/P2PContext';
import Chat from '../components/Chat';
import StreamSettings from '../components/StreamSettings';
import PollCreator from '../components/PollCreator';
import AdBreakButton from '../components/AdBreakButton';
import StreamHealthIndicator from '../components/StreamHealthIndicator';
import CoStreamingPanel from '../components/CoStreamingPanel';
import { usePoll } from '../hooks/usePoll';
import { useP2PStream } from '../hooks/useP2PStream';
import { useSocket } from '../hooks/useSocket';

export default function Broadcast() {
  const { username, setCurrentStreamId } = useP2PSettings();
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPollCreatorOpen, setIsPollCreatorOpen] = useState(false);
  const [title, setTitle] = useState('Building the next big thing on Beacon!');
  const [tags, setTags] = useState('Dev, Tech, Coding');
  const [notification, setNotification] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Poll hook
  const { startPoll, activePoll, endPoll } = usePoll(username);
  const { socket } = useSocket();

  // Store the active local stream in state so it can be passed to the WebRTC hook
  const [activeStream, setActiveStream] = useState(null);

  useEffect(() => {
    if (isLive) {
      setActiveStream(streamRef.current);
    } else {
      setActiveStream(null);
    }
  }, [isLive]);

  // Manage WebRTC Broadcaster stream connection
  // Note: meshStats was removed from the returned hook state to prevent 2s polling re-renders
  const { peers } = useP2PStream(true, activeStream, username);

  useEffect(() => {
    if (isLive) {
      setCurrentStreamId(username);
      if (socket) {
        socket.emit('join-stream', { streamId: username, username: username });
      }
    } else {
      setCurrentStreamId(null);
      if (socket) {
        socket.emit('leave-stream');
      }
    }
    return () => {
      setCurrentStreamId(null);
    };
  }, [isLive, username, setCurrentStreamId, socket]);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isSharingScreen) {
      // Stop the screen tracks properly
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      // Revert to camera stream
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      setIsSharingScreen(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always"
          },
          audio: false
        });

        screenStreamRef.current = screenStream;

        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }

        // Handle the case where user stops sharing via browser UI
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrack.onended = () => {
          if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
          }
          setIsSharingScreen(false);
          screenStreamRef.current = null;
        };

        setIsSharingScreen(true);
      } catch (err) {
        console.error("Error starting screen share:", err);
      }
    }
  };

  const handleUpdateInfo = () => {
    setIsUpdating(true);
    // Simulate API call to update stream metadata
    setTimeout(() => {
      setIsUpdating(false);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    }, 1000);
  };

  const handleStartPoll = (question, options, duration) => {
    startPoll(question, options, duration);
  };

  const handlePollClick = () => {
    if (activePoll) {
      endPoll();
    } else {
      setIsPollCreatorOpen(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-poppins font-extrabold text-brand tracking-tight">Broadcast Studio</h1>
          <p className="text-neutral-400 mt-1">Manage your stream and network node settings</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           {isLive && (
             <div className="flex-1 md:flex-none px-4 py-2 bg-neutral-900 rounded-lg text-sm font-mono text-neutral-400 border border-neutral-800 flex items-center justify-center gap-2" title="Connected Peers">
               <Users className="w-4 h-4 text-beacon-500" />
               <span className="font-bold text-white">{Object.keys(peers).length}</span> viewers
             </div>
           )}
           <div className="flex-1 md:flex-none px-4 py-2 bg-neutral-900 rounded-lg text-sm font-mono text-neutral-400 border border-neutral-800 flex items-center justify-center gap-2">
             <StreamHealthIndicator peers={peers} isViewer={false} isBroadcastView={true} hasStarted={isLive} />
           </div>
           <button
             onClick={() => setIsLive(!isLive)}
             className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-white transition-all shadow-lg ${
               isLive
               ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20'
               : 'bg-beacon-600 hover:bg-beacon-500 shadow-beacon-600/20'
             }`}
           >
             {isLive ? 'End Stream' : 'Go Live'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative group border border-neutral-800 shadow-2xl ring-1 ring-neutral-800">
               <video
                 ref={videoRef}
                 autoPlay
                 muted
                 playsInline
                 className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : 'block'}`}
               />
               {isCameraOff && (
                  <div className="absolute inset-0 flex items-center justify-center text-neutral-700 flex-col gap-4 bg-neutral-950">
                    <CameraOff className="w-16 h-16 opacity-50" />
                    <span className="font-medium text-lg text-neutral-500 uppercase tracking-widest">Camera Disabled</span>
                  </div>
               )}

               {/* Controls Overlay */}
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-neutral-900/90 backdrop-blur px-6 py-3 rounded-full border border-neutral-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={toggleMic}
                    className={`p-2 rounded-full transition-colors tooltip ${isMuted ? 'bg-red-500 text-white hover:bg-red-600' : 'hover:bg-neutral-700 text-white'}`}
                    title={isMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={toggleCamera}
                    className={`p-2 rounded-full transition-colors tooltip ${isCameraOff ? 'bg-red-500 text-white hover:bg-red-600' : 'hover:bg-neutral-700 text-white'}`}
                    title={isCameraOff ? "Enable Camera" : "Disable Camera"}
                  >
                    {isCameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={toggleScreenShare}
                    className={`p-2 rounded-full transition-colors tooltip ${isSharingScreen ? 'bg-beacon-600 text-white shadow-lg shadow-beacon-600/50' : 'hover:bg-neutral-700 text-white'}`}
                    title={isSharingScreen ? "Stop Sharing" : "Share Screen"}
                  >
                    <Monitor className="w-5 h-5" />
                  </button>
                  <div className="w-px h-6 bg-neutral-700 mx-2"></div>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 hover:bg-neutral-700 rounded-full transition-colors text-white tooltip"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
               </div>
            </div>

            <div className="bg-neutral-900/50 rounded-xl p-6 border border-neutral-800">
               <h3 className="font-poppins font-semibold text-white mb-6 flex items-center gap-2 text-lg">
                 <Radio className="w-5 h-5 text-beacon-500" />
                 Stream Info
               </h3>
               <div className="space-y-5">
                  <div>
                    <label htmlFor="stream-title" className="block text-sm font-medium text-neutral-400 mb-2">Title</label>
                    <input
                      id="stream-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:border-beacon-500 outline-none transition-colors shadow-inner"
                      placeholder="Enter a catchy title"
                    />
                  </div>
                  <div>
                    <label htmlFor="stream-tags" className="block text-sm font-medium text-neutral-400 mb-2">Tags</label>
                    <input
                      id="stream-tags"
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:border-beacon-500 outline-none transition-colors shadow-inner"
                      placeholder="Add tags separated by commas"
                    />
                  </div>
                  <div>
                    <label htmlFor="stream-notification" className="block text-sm font-medium text-neutral-400 mb-2">Go Live Notification</label>
                     <textarea
                       id="stream-notification"
                       value={notification}
                       onChange={(e) => setNotification(e.target.value)}
                       className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:border-beacon-500 outline-none transition-colors shadow-inner h-24 resize-none"
                       placeholder="Tell your followers what you're up to..."
                     ></textarea>
                  </div>
               </div>
               <div className="mt-6 flex items-center justify-end gap-4">
                  {updateSuccess && (
                    <span className="text-green-500 text-sm font-medium animate-fade-in">
                      Changes saved successfully!
                    </span>
                  )}
                  <button
                    onClick={handleUpdateInfo}
                    disabled={isUpdating}
                    className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium border border-neutral-700"
                  >
                    {isUpdating ? 'Saving...' : 'Update Info'}
                  </button>
               </div>
            </div>

            {/* Co-Streaming Section */}
            <CoStreamingPanel username={username} isLive={isLive} socket={socket} />
         </div>

         <div className="space-y-6">
            <div className="bg-neutral-900/50 rounded-xl border border-neutral-800 h-[600px] flex flex-col overflow-hidden">
               {isLive ? (
                  <Chat streamId={username} className="relative hidden lg:flex h-full" />
               ) : (
                  <>
                    <div className="p-4 border-b border-neutral-800 bg-neutral-900 font-semibold text-sm text-neutral-400 uppercase tracking-wider text-center">
                        Stream Chat Preview
                    </div>
                    <div className="flex-1 flex items-center justify-center text-neutral-600 text-sm italic bg-neutral-950/30">
                        <div className="text-center p-8">
                          <p className="mb-2">Chat is offline.</p>
                          <p className="text-xs text-neutral-700">Messages will appear here once you go live.</p>
                        </div>
                    </div>
                    <div className="p-4 border-t border-neutral-800 bg-neutral-900">
                        <div className="w-full h-10 bg-neutral-800 rounded-lg animate-pulse"></div>
                    </div>
                  </>
               )}
            </div>

            <div className="bg-neutral-900/50 rounded-xl p-6 border border-neutral-800">
               <h3 className="font-poppins font-semibold text-white mb-4 text-sm uppercase tracking-wider text-neutral-400">Quick Actions</h3>
               <div className="grid grid-cols-2 gap-3">
                  <button className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium text-white transition-colors border border-neutral-700">Raid Channel</button>
                  <button
                    onClick={handlePollClick}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                      activePoll
                        ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700'
                    }`}
                  >
                    {activePoll ? 'End Active Poll' : 'Start Poll'}
                  </button>
                  <button className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium text-white transition-colors border border-neutral-700">Manage Mods</button>
                  <AdBreakButton />
               </div>
            </div>
         </div>
      </div>
      {/* Settings Modal */}
      <StreamSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      {/* Poll Creator Modal */}
      <PollCreator
        isOpen={isPollCreatorOpen}
        onClose={() => setIsPollCreatorOpen(false)}
        onStartPoll={handleStartPoll}
      />
    </div>
  );
}
