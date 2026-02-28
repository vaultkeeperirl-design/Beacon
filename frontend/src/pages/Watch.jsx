import VideoPlayer from '../components/VideoPlayer';
import Chat from '../components/Chat';
import { Share2, ThumbsUp, MoreHorizontal, UserPlus, UserCheck, Check } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useP2PSettings } from '../context/P2PContext';
import { useFollowing } from '../context/FollowingContext';
import { useSocket } from '../hooks/useSocket';
import { useP2PStream } from '../hooks/useP2PStream';
import StreamHealthIndicator from '../components/StreamHealthIndicator';

import { useState } from 'react';

export default function Watch() {
  const { id } = useParams();
  const { username } = useP2PSettings();
  const [hasStarted, setHasStarted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const navigate = useNavigate();
  // Using useP2PSettings to avoid re-rendering the whole page every second when stats update
  const { setCurrentStreamId } = useP2PSettings();
  const { follow, unfollow, isFollowing } = useFollowing();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleStreamEnded = ({ redirect }) => {
       if (redirect) {
         // Auto-host / Raid logic
         navigate(`/watch/${redirect}`);
       } else {
         navigate('/');
       }
    };

    socket.on('stream-ended', handleStreamEnded);

    return () => {
      socket.off('stream-ended', handleStreamEnded);
    };
  }, [socket, navigate]);

  useEffect(() => {
    if (id) {
       setCurrentStreamId(id);
    }
    return () => {
       setCurrentStreamId(null);
    };
  }, [id, setCurrentStreamId]);

  const isFollowed = isFollowing(id);
  // Use the P2P hook as a viewer
  // Note: meshStats was removed from the returned hook state to prevent 2s polling re-renders
  const { remoteStream, peers } = useP2PStream(false, null, id);

  useEffect(() => {
    if (remoteStream) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasStarted(true);
    }
  }, [remoteStream]);

  useEffect(() => {
    if (socket && id && username) {
      socket.emit('join-stream', { streamId: id, username: username });
    }
    return () => {
      if (socket) {
        socket.emit('leave-stream');
      }
    };
  }, [id, username, socket]);

  useEffect(() => {
    let timeout;
    if (isCopied) {
      timeout = setTimeout(() => setIsCopied(false), 2000);
    }
    return () => clearTimeout(timeout);
  }, [isCopied]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
    }
  };

  const handleFollowToggle = () => {
    if (isFollowed) {
      unfollow(id);
    } else {
      follow({
        id: id,
        name: id,
        // Using a generic avatar icon if we don't have real data yet in this context
        avatar: null,
        title: 'Building a P2P streaming app from scratch', // Mock title for now
        isLive: true,
        category: 'Software Development' // Mock category
      });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex-1 flex flex-col h-full overflow-y-auto lg:overflow-hidden pb-20 lg:pb-0 pr-0 lg:pr-80">
         <div className="w-full relative">
           <VideoPlayer stream={remoteStream} />
           {!remoteStream && (
             <div className="absolute top-0 left-0 w-full h-full bg-black flex items-center justify-center flex-col z-10 aspect-video rounded-lg ring-1 ring-neutral-800">
                <div className="w-10 h-10 border-4 border-beacon-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-white font-medium animate-pulse">
                  {hasStarted ? "Reconnecting to Mesh..." : "Waiting for host to go live..."}
                </p>
             </div>
           )}
         </div>

         <div className="py-6 px-4 lg:px-0">
           <div className="flex flex-col md:flex-row items-start justify-between gap-4">
             <div>
               <h1 className="text-2xl md:text-3xl font-poppins font-extrabold text-brand mb-2 leading-tight">Building a P2P streaming app from scratch</h1>
               <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
                 <div className="flex items-center gap-2">
                    <Link to={`/channel/${id}`} className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border border-neutral-700 hover:ring-2 hover:ring-beacon-500 transition-all text-neutral-400">
                       <UserPlus className="w-5 h-5 opacity-50" />
                    </Link>
                    <Link to={`/channel/${id}`} className="text-white font-bold hover:text-beacon-400 cursor-pointer transition-colors">{id}</Link>
                 </div>
                 <span className="hidden md:inline">•</span>
                 <span className="bg-neutral-800 px-2 py-0.5 rounded text-beacon-400 font-medium border border-neutral-700">Software Development</span>
                 <span className="hidden md:inline">•</span>
                 <span className="flex items-center gap-1 text-red-500 font-semibold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    LIVE
                 </span>
                 <span className="hidden md:inline">•</span>
                 <StreamHealthIndicator peers={peers} isViewer={true} hasStarted={hasStarted} remoteStream={remoteStream} />
               </div>
             </div>

             <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                <button
                  onClick={handleFollowToggle}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-white rounded-lg font-bold transition-all shadow-lg transform hover:-translate-y-0.5 ${
                    isFollowed
                      ? 'bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 shadow-none'
                      : 'bg-beacon-600 hover:bg-beacon-500 shadow-beacon-600/20'
                  }`}
                >
                  {isFollowed ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  <span>{isFollowed ? 'Following' : 'Follow'}</span>
                </button>
                <button
                  className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-colors border border-neutral-700"
                  aria-label="Like stream"
                  title="Like stream"
                >
                  <ThumbsUp className="w-5 h-5" />
                </button>
                <button
                  onClick={handleShare}
                  className={`p-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-all border border-neutral-700 ${isCopied ? 'text-beacon-500 border-beacon-500/50' : 'text-neutral-400 hover:text-white'}`}
                  aria-label={isCopied ? "Copied!" : "Share stream"}
                  title={isCopied ? "Copied!" : "Share stream"}
                >
                  {isCopied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                </button>
                <button
                  className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-colors border border-neutral-700"
                  aria-label="More options"
                  title="More options"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
             </div>
           </div>

           <div className="mt-8 bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-xl p-6 border border-neutral-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <img src="/icon.png" alt="Beacon" className="w-48 h-48 object-contain" />
              </div>
              <h3 className="font-poppins font-semibold text-white mb-3 text-lg relative z-10">About this stream</h3>
              <p className="text-neutral-300 text-sm leading-relaxed relative z-10 max-w-3xl">
                 Welcome to the future of streaming! This stream is powered by the Beacon P2P Mesh Network.
                 By watching, you are actively participating in the distribution of this stream to other viewers in your region.
                 The longer you watch and the better your connection, the more <span className="text-beacon-400 font-mono">Credits</span> you earn.
                 Check your real-time contribution stats in the bottom right corner!
              </p>
              <div className="mt-5 flex flex-wrap gap-2 relative z-10">
                 {['P2P', 'Decentralized', 'WebRTC', 'React', 'Coding', 'Open Source'].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 transition-colors rounded-full text-xs text-neutral-400 font-medium border border-neutral-700 cursor-pointer">#{tag}</span>
                 ))}
              </div>
           </div>
         </div>
      </div>

      {/* ⚡ Performance Optimization: Using a key here ensures that Chat state resets
          idiomatically when the stream changes, avoiding expensive cascading renders
          and keeping the code cleaner. */}
      <Chat key={id} streamId={id} />
    </div>
  );
}
