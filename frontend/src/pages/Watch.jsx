import { useParams } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import Chat from '../components/Chat';
import P2PStats from '../components/P2PStats';
import { P2PProvider } from '../context/P2PContext';
import { Share2, ThumbsUp, MoreHorizontal, UserPlus, Zap } from 'lucide-react';

export default function Watch() {
  const { id } = useParams();

  return (
    <P2PProvider>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-64px)] overflow-hidden">
        <div className="flex-1 flex flex-col h-full overflow-y-auto lg:overflow-hidden pb-20 lg:pb-0 pr-0 lg:pr-80">
           <div className="w-full">
             <VideoPlayer />
           </div>

           <div className="py-6 px-4 lg:px-0">
             <div className="flex flex-col md:flex-row items-start justify-between gap-4">
               <div>
                 <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">Building a P2P streaming app from scratch</h1>
                 <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
                   <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700">
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=JulesDev`} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-white font-bold hover:text-beacon-400 cursor-pointer transition-colors">JulesDev</span>
                   </div>
                   <span className="hidden md:inline">•</span>
                   <span className="bg-neutral-800 px-2 py-0.5 rounded text-beacon-400 font-medium border border-neutral-700">Software Development</span>
                   <span className="hidden md:inline">•</span>
                   <span className="flex items-center gap-1 text-red-500 font-semibold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      LIVE
                   </span>
                 </div>
               </div>

               <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-beacon-600 hover:bg-beacon-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-beacon-600/20 transform hover:-translate-y-0.5">
                    <UserPlus className="w-4 h-4" />
                    <span>Follow</span>
                  </button>
                  <button className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-colors border border-neutral-700">
                    <ThumbsUp className="w-5 h-5" />
                  </button>
                  <button className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-colors border border-neutral-700">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-colors border border-neutral-700">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
               </div>
             </div>

             <div className="mt-8 bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-xl p-6 border border-neutral-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Zap className="w-48 h-48 text-beacon-500" />
                </div>
                <h3 className="font-semibold text-white mb-3 text-lg relative z-10">About this stream</h3>
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

        <Chat />
        <P2PStats />
      </div>
    </P2PProvider>
  );
}
