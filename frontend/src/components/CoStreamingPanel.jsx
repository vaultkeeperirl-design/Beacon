import React, { useState, useEffect } from 'react';
import { Users, Percent, Trash2 } from 'lucide-react';

export default function CoStreamingPanel({ username, isLive, socket }) {
  const [squad, setSquad] = useState([
    { id: 1, name: username, split: 100, isHost: true },
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

    if (isLive && socket) {
       socket.emit('update-squad', { streamId: username, squad: updatedSquad });
    }
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

     if (isLive && socket) {
        socket.emit('update-squad', { streamId: username, squad: updatedSquad });
     }
  };

  // Sync initial squad when going live
  useEffect(() => {
    if (isLive && socket) {
       socket.emit('update-squad', { streamId: username, squad: squad });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, socket, username]); // Intentional omission of squad to only run on live state change

  return (
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
  );
}
