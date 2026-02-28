import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, UserCheck, MessageSquare, Share2, MoreHorizontal, Video, Calendar, Info, Clock, Heart } from 'lucide-react';
import { useP2PSettings } from '../context/P2PContext';
import StreamCard from '../components/StreamCard';
import axios from 'axios';

export default function Channel() {
  const { username } = useParams();
  const { username: currentUsername } = useP2PSettings();
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [channelData, setChannelData] = useState(null);

  const isOwnProfile = currentUsername === username;

  useEffect(() => {
    // Fetch real channel data
    axios.get(`http://localhost:3000/api/users/${username}`)
      .then(res => {
        setChannelData({
          username: res.data.username,
          displayName: res.data.username,
          avatar: res.data.avatar_url,
          banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1920', // Keep mock banner
          bio: res.data.bio || "Tech enthusiast, coder, and gamer.",
          followers: res.data.follower_count || 0,
          following: 150,
          socials: { twitter: "@" + res.data.username, github: 'github.com/' + res.data.username, website: 'example.com' }
        });
      })
      .catch(err => {
        console.error('Failed to fetch channel data', err);
        // Fallback for missing/mock users
        setChannelData({
          username: username,
          displayName: username, // In a real app, this might differ
          avatar: null,
          banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1920',
          bio: 'Tech enthusiast, coder, and gamer. Streaming development of open source projects and occasional gaming sessions. Join the community!',
          followers: 12500,
          following: 150,
          socials: {
            twitter: '@' + username,
            github: 'github.com/' + username,
            website: 'example.com'
          }
        });
      });
  }, [username]);

  if (!channelData) return <div className="p-8 text-center text-neutral-400 animate-pulse">Loading channel...</div>;

  const MOCK_VIDEOS = [
    { id: 101, title: 'Building a P2P App - Part 1', streamer: username, viewers: '5.2k', tags: ['Coding', 'React'], thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600', isLive: false, duration: '2:30:15' },
    { id: 102, title: 'Late Night Coding Session', streamer: username, viewers: '3.1k', tags: ['Chill', 'Dev'], thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600', isLive: false, duration: '4:12:00' },
    { id: 103, title: 'React 19 Features Overview', streamer: username, viewers: '8.5k', tags: ['Tech', 'News'], thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=600', isLive: false, duration: '45:20' },
    { id: 104, title: 'Debugging Production Issues', streamer: username, viewers: '2.8k', tags: ['Bugfix', 'Live'], thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=600', isLive: false, duration: '1:15:00' },
  ];

  return (
    <div className="-mt-6 -mx-6">
      {/* Banner */}
      <div className="h-60 md:h-80 w-full relative group">
        <img src={channelData.banner} alt="Channel Banner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent"></div>
      </div>

      {/* Channel Header */}
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="flex flex-col md:flex-row items-end -mt-12 md:-mt-16 mb-8 gap-6">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-neutral-900 bg-neutral-800 overflow-hidden relative z-10 shadow-2xl">
            <img src={channelData.avatar} alt={channelData.username} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-poppins font-bold text-white truncate">{channelData.displayName}</h1>
              {/* Verified Badge Mock */}
              <div className="bg-beacon-500 text-white p-0.5 rounded-full">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-neutral-400">
              <span>{channelData.followers.toLocaleString()} followers</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                 {channelData.socials.twitter}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pb-2 w-full md:w-auto">
             {!isOwnProfile && (
               <button
                 onClick={() => setIsFollowing(!isFollowing)}
                 className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg ${
                   isFollowing
                   ? 'bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white shadow-none'
                   : 'bg-beacon-600 hover:bg-beacon-500 text-white shadow-beacon-600/20'
                 }`}
               >
                 {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                 <span>{isFollowing ? 'Following' : 'Follow'}</span>
               </button>
             )}

             {isOwnProfile && (
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-bold transition-colors border border-neutral-700">
                  <span>Customize Channel</span>
                </button>
             )}

             <button className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-colors border border-neutral-700">
               <Share2 className="w-5 h-5" />
             </button>
             <button className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-colors border border-neutral-700">
               <MoreHorizontal className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-neutral-800 mb-8 overflow-x-auto">
          {['home', 'about', 'schedule', 'videos', 'clips'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`pb-4 px-2 font-medium text-sm capitalize transition-colors relative whitespace-nowrap ${
                 activeTab === tab
                 ? 'text-beacon-500'
                 : 'text-neutral-400 hover:text-white'
               }`}
             >
               {tab}
               {activeTab === tab && (
                 <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-beacon-500 rounded-t-full"></div>
               )}
             </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="pb-12">
           {activeTab === 'home' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                   {/* Featured / Recent Stream */}
                   <section>
                      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Video className="w-5 h-5 text-beacon-500" />
                        Recent Broadcasts
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {MOCK_VIDEOS.slice(0, 2).map(video => (
                          <StreamCard key={video.id} {...video} streamer={channelData.displayName} />
                        ))}
                      </div>
                   </section>
                </div>

                <div className="space-y-6">
                   <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                      <h3 className="font-bold text-white mb-4">About {channelData.displayName}</h3>
                      <p className="text-neutral-400 text-sm leading-relaxed mb-4">
                        {channelData.bio}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-6">
                         {['English', 'Development', 'Strategy', 'Cozy'].map(tag => (
                           <span key={tag} className="px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-400 font-medium">
                             {tag}
                           </span>
                         ))}
                      </div>
                      <div className="border-t border-neutral-800 pt-4 space-y-3">
                         <div className="flex items-center gap-3 text-sm text-neutral-400">
                            <Heart className="w-4 h-4" />
                            <span>{channelData.followers.toLocaleString()} Followers</span>
                         </div>
                         <div className="flex items-center gap-3 text-sm text-neutral-400">
                            <Clock className="w-4 h-4" />
                            <span>Schedule: Mon, Wed, Fri</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'videos' && (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
               {MOCK_VIDEOS.map(video => (
                 <StreamCard key={video.id} {...video} streamer={channelData.displayName} />
               ))}
               {MOCK_VIDEOS.map(video => (
                 <StreamCard key={`${video.id}-dup`} {...video} id={`${video.id}-dup`} streamer={channelData.displayName} />
               ))}
             </div>
           )}

           {activeTab === 'about' && (
             <div className="max-w-2xl">
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">About the Streamer</h2>
                  <div className="prose prose-invert max-w-none">
                     <p className="text-neutral-300 leading-relaxed mb-4">
                       Hey everyone! I'm {channelData.displayName}, a full-stack developer who loves building cool things and sharing the process.
                       I started streaming to connect with other devs and build a community around open source software.
                     </p>
                     <p className="text-neutral-300 leading-relaxed mb-4">
                       On this channel, you'll mostly see me working on React, Node.js, and WebRTC projects.
                       Occasionally we switch it up with some indie game sessions or tech talks.
                     </p>
                     <h3 className="text-xl font-bold text-white mt-8 mb-4">Specs</h3>
                     <ul className="space-y-2 text-neutral-400 list-disc pl-5">
                       <li>CPU: AMD Ryzen 9 5950X</li>
                       <li>GPU: NVIDIA GeForce RTX 3080</li>
                       <li>RAM: 64GB DDR4</li>
                       <li>Mic: Shure SM7B</li>
                     </ul>
                  </div>
                </div>
             </div>
           )}

           {activeTab === 'schedule' && (
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 flex flex-col items-center justify-center text-center py-20">
                 <Calendar className="w-16 h-16 text-neutral-700 mb-4" />
                 <h3 className="text-xl font-bold text-white mb-2">Schedule Coming Soon</h3>
                 <p className="text-neutral-400 max-w-md">
                   {channelData.displayName} hasn't posted a stream schedule yet. Turn on notifications to know when they go live!
                 </p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
