import { useState } from 'react';
import { Camera, Mic, Settings, Monitor, Radio, Users, Percent, Trash2 } from 'lucide-react';

export default function Broadcast() {
  const [isLive, setIsLive] = useState(false);
  const [squad, setSquad] = useState([
    { id: 1, name: 'You (Host)', split: 100, isHost: true },
  ]);
  const [inviteInput, setInviteInput] = useState('');

  const addSquadMember = () => {
    if (!inviteInput) return;
    const newMember = { id: Date.now(), name: inviteInput, split: 0, isHost: false };
    const newSquad = [...squad, newMember];

    // Simple even split logic for demo
    const count = newSquad.length;
    const split = Math.floor(100 / count);
    const remainder = 100 % count;

    const updatedSquad = newSquad.map((m, idx) => ({
        ...m,
        split: idx === 0 ? split + remainder : split
    }));

    setSquad(updatedSquad);
    setInviteInput('');
  };

  const removeSquadMember = (id) => {
     const newSquad = squad.filter(m => m.id !== id);

     // Redistribute to remaining members
     const count = newSquad.length;
     const split = Math.floor(100 / count);
     const remainder = 100 % count;

     const updatedSquad = newSquad.map((m, idx) => ({
         ...m,
         split: idx === 0 ? split + remainder : split
     }));

     setSquad(updatedSquad);
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-poppins font-extrabold text-brand tracking-tight">Broadcast Studio</h1>
          <p className="text-neutral-400 mt-1">Manage your stream and network node settings</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="flex-1 md:flex-none px-4 py-2 bg-neutral-900 rounded-lg text-sm font-mono text-neutral-400 border border-neutral-800 flex items-center justify-center gap-2">
             <span className="text-green-500 animate-pulse">●</span> Stream Health: Excellent
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
               <div className="absolute inset-0 flex items-center justify-center text-neutral-700 flex-col gap-4">
                  <Camera className="w-16 h-16 opacity-50" />
                  <span className="font-medium text-lg">Camera Preview</span>
               </div>

               {/* Controls Overlay */}
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-neutral-900/90 backdrop-blur px-6 py-3 rounded-full border border-neutral-700 shadow-xl">
                  <button className="p-2 hover:bg-neutral-700 rounded-full transition-colors text-white tooltip" title="Mute Mic"><Mic className="w-5 h-5" /></button>
                  <button className="p-2 hover:bg-neutral-700 rounded-full transition-colors text-white tooltip" title="Disable Camera"><Camera className="w-5 h-5" /></button>
                  <button className="p-2 hover:bg-neutral-700 rounded-full transition-colors text-white tooltip" title="Share Screen"><Monitor className="w-5 h-5" /></button>
                  <div className="w-px h-6 bg-neutral-700 mx-2"></div>
                  <button className="p-2 hover:bg-neutral-700 rounded-full transition-colors text-white tooltip" title="Settings"><Settings className="w-5 h-5" /></button>
               </div>
            </div>

            <div className="bg-neutral-900/50 rounded-xl p-6 border border-neutral-800">
               <h3 className="font-poppins font-semibold text-white mb-6 flex items-center gap-2 text-lg">
                 <Radio className="w-5 h-5 text-beacon-500" />
                 Stream Info
               </h3>
               <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Title</label>
                    <input type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:border-beacon-500 outline-none transition-colors shadow-inner" defaultValue="Building the next big thing on Beacon!" placeholder="Enter a catchy title" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Tags</label>
                    <input type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:border-beacon-500 outline-none transition-colors shadow-inner" defaultValue="Dev, Tech, Coding" placeholder="Add tags separated by commas" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Go Live Notification</label>
                     <textarea className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:border-beacon-500 outline-none transition-colors shadow-inner h-24 resize-none" placeholder="Tell your followers what you're up to..."></textarea>
                  </div>
               </div>
               <div className="mt-6 flex justify-end">
                  <button className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium border border-neutral-700">Update Info</button>
               </div>
            </div>

            {/* Co-Streaming Section */}
            <div className="bg-neutral-900/50 rounded-xl p-6 border border-neutral-800">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="font-poppins font-semibold text-white flex items-center gap-2 text-lg">
                   <Users className="w-5 h-5 text-beacon-500" />
                   Co-Streaming & Revenue Splits
                 </h3>
                 <span className="text-xs font-bold text-beacon-400 border border-beacon-500/30 px-2 py-1 rounded bg-beacon-500/10 uppercase tracking-wide">Beta</span>
               </div>

               <p className="text-neutral-400 text-sm mb-6">
                 Collaboration over competition. Invite guests to your stream and automatically split ad revenue and bandwidth credits.
                 <span className="text-beacon-400 font-medium"> No backend deals, just smart contracts.</span>
               </p>

               <div className="space-y-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteInput}
                      onChange={(e) => setInviteInput(e.target.value)}
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:border-beacon-500 outline-none transition-colors shadow-inner"
                      placeholder="Invite guest by username..."
                    />
                    <button
                      onClick={addSquadMember}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium border border-neutral-700 flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Invite
                    </button>
                  </div>

                  <div className="bg-neutral-950 rounded-lg border border-neutral-800 overflow-hidden">
                    <div className="px-4 py-2 bg-neutral-900/50 border-b border-neutral-800 flex justify-between text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      <span>Squad Member</span>
                      <span>Revenue Split</span>
                    </div>
                    <div className="divide-y divide-neutral-800">
                      {squad.map((member) => (
                        <div key={member.id} className="px-4 py-3 flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400 border border-neutral-700">
                               {member.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                               <p className="text-sm font-medium text-white flex items-center gap-2">
                                 {member.name}
                                 {member.isHost && <span className="text-[10px] bg-beacon-600 px-1.5 py-0.5 rounded text-white uppercase tracking-wide">Host</span>}
                               </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded border border-neutral-800">
                                <Percent className="w-3 h-3 text-neutral-500" />
                                <span className="text-sm font-mono font-bold text-white">{member.split}%</span>
                             </div>
                             {!member.isHost && (
                               <button onClick={() => removeSquadMember(member.id)} className="p-1.5 hover:bg-red-500/10 text-neutral-500 hover:text-red-500 rounded transition-colors">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-500 bg-blue-500/5 p-3 rounded border border-blue-500/10">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                     <p>Smart Contract will automatically distribute payments every 24 hours.</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-neutral-900/50 rounded-xl border border-neutral-800 h-[600px] flex flex-col overflow-hidden">
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
            </div>

            <div className="bg-neutral-900/50 rounded-xl p-6 border border-neutral-800">
               <h3 className="font-poppins font-semibold text-white mb-4 text-sm uppercase tracking-wider text-neutral-400">Quick Actions</h3>
               <div className="grid grid-cols-2 gap-3">
                  <button className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium text-white transition-colors border border-neutral-700">Raid Channel</button>
                  <button className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium text-white transition-colors border border-neutral-700">Start Poll</button>
                  <button className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium text-white transition-colors border border-neutral-700">Manage Mods</button>
                  <button className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium text-white transition-colors border border-neutral-700">Ad Break (60s)</button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
