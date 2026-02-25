import { Wallet as WalletIcon, TrendingUp, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, Zap } from 'lucide-react';

export default function Wallet() {
  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
         <div>
            <h1 className="text-4xl font-bold text-white mb-2">Wallet & Earnings</h1>
            <p className="text-neutral-400">Track your P2P contributions and rewards</p>
         </div>
         <div className="flex gap-4">
            <button className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors border border-neutral-700 font-bold shadow-sm">
               Transaction History
            </button>
            <button className="px-6 py-2.5 bg-beacon-600 hover:bg-beacon-500 text-white rounded-lg transition-all shadow-lg shadow-beacon-600/20 font-bold transform hover:-translate-y-0.5">
               Withdraw Credits
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
         <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 p-8 rounded-2xl border border-neutral-800 relative overflow-hidden group hover:border-beacon-500/30 transition-all shadow-2xl">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
               <WalletIcon className="w-32 h-32 text-beacon-500" />
            </div>
            <div className="relative z-10">
               <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-beacon-500/10 rounded-lg">
                     <WalletIcon className="w-5 h-5 text-beacon-500" />
                  </div>
                  <p className="text-neutral-400 text-sm font-bold uppercase tracking-wider">Total Balance</p>
               </div>
               <h2 className="text-5xl font-bold text-white font-mono tracking-tight mt-4">2,450.00 <span className="text-2xl text-beacon-500">CR</span></h2>
               <div className="mt-6 flex items-center gap-2 text-green-400 text-sm font-bold bg-green-500/10 px-3 py-1 rounded-full w-fit">
                  <TrendingUp className="w-4 h-4" />
                  <span>+12.5% this week</span>
               </div>
            </div>
         </div>

         <div className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all shadow-xl">
            <div className="flex items-start justify-between mb-6">
               <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                  <ArrowUpRight className="w-8 h-8" />
               </div>
               <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest bg-neutral-800 px-2 py-1 rounded">Last 30 Days</span>
            </div>
            <p className="text-neutral-400 text-sm font-bold uppercase tracking-wider mb-2">Bandwidth Contributed</p>
            <h2 className="text-3xl font-bold text-white font-mono">1.2 TB</h2>
            <div className="w-full bg-neutral-800 h-2 rounded-full mt-6 overflow-hidden">
               <div className="bg-blue-500 h-full w-[75%] rounded-full"></div>
            </div>
            <p className="text-xs text-neutral-500 mt-3 font-medium">Top 5% of nodes</p>
         </div>

         <div className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all shadow-xl">
            <div className="flex items-start justify-between mb-6">
               <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                  <ShieldCheck className="w-8 h-8" />
               </div>
               <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest bg-neutral-800 px-2 py-1 rounded">Node Score</span>
            </div>
            <p className="text-neutral-400 text-sm font-bold uppercase tracking-wider mb-2">Reliability Rating</p>
            <h2 className="text-3xl font-bold text-white font-mono">98.5%</h2>
            <div className="w-full bg-neutral-800 h-2 rounded-full mt-6 overflow-hidden">
               <div className="bg-green-500 h-full w-[98%] rounded-full"></div>
            </div>
            <p className="text-xs text-neutral-500 mt-3 font-medium">Excellent uptime</p>
         </div>
      </div>

      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl">
         <div className="px-8 py-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/50">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
               <Clock className="w-5 h-5 text-neutral-500" />
               Recent Activity
            </h3>
            <button className="text-sm font-bold text-beacon-500 hover:text-beacon-400 transition-colors uppercase tracking-wider">View All</button>
         </div>
         <div className="divide-y divide-neutral-800/50">
            {[1, 2, 3, 4, 5, 6].map((i) => (
               <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-neutral-800/20 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-5">
                     <div className={`p-3 rounded-xl ${i % 2 === 0 ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'} group-hover:scale-110 transition-transform`}>
                        {i % 2 === 0 ? <Zap className="w-5 h-5 fill-current" /> : <ArrowUpRight className="w-5 h-5" />}
                     </div>
                     <div>
                        <p className="font-bold text-white text-sm mb-0.5">{i % 2 === 0 ? 'Ad Revenue Share' : 'Bandwidth Relay Reward'}</p>
                        <p className="text-xs text-neutral-500 font-medium">2 minutes ago • Node #8372</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="font-mono font-bold text-white text-lg">+{Math.floor(Math.random() * 50)}.00 CR</p>
                     <p className="text-xs text-green-500 font-medium">Completed</p>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
