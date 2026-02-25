import { Wallet as WalletIcon, TrendingUp, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, Zap, Users } from 'lucide-react';
import { useP2PStats } from '../context/P2PContext';

export default function Wallet() {
  const stats = useP2PStats();
  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
         <div>
            <h1 className="text-4xl font-poppins font-extrabold text-brand mb-2">Wallet & Earnings</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
         <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 rounded-2xl border border-neutral-800 relative overflow-hidden group hover:border-beacon-500/30 transition-all shadow-2xl">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
               <WalletIcon className="w-24 h-24 text-beacon-500" />
            </div>
            <div className="relative z-10">
               <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-beacon-500/10 rounded-lg">
                     <WalletIcon className="w-5 h-5 text-beacon-500" />
                  </div>
                  <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">Total Balance</p>
               </div>
               <h2 className="text-3xl font-bold text-white font-mono tracking-tight mt-4">
                  {stats.credits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-lg text-beacon-500">CR</span>
               </h2>
               <div className="mt-4 flex items-center gap-2 text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-full w-fit">
                  <TrendingUp className="w-3 h-3" />
                  <span>+12.5%</span>
               </div>
            </div>
         </div>

         <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Users className="w-24 h-24 text-purple-500" />
            </div>
            <div className="flex items-start justify-between mb-4">
               <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                  <Users className="w-6 h-6" />
               </div>
               <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest bg-neutral-800 px-2 py-1 rounded">All Time</span>
            </div>
            <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">Squad Earnings</p>
            <h2 className="text-2xl font-bold text-white font-mono">850.50 <span className="text-sm text-neutral-500">CR</span></h2>
            <div className="mt-4 flex items-center gap-2 text-purple-400 text-xs font-bold bg-purple-500/10 px-2 py-1 rounded-full w-fit">
               <span>From 12 Co-Streams</span>
            </div>
         </div>

         <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all shadow-xl">
            <div className="flex items-start justify-between mb-4">
               <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                  <ArrowUpRight className="w-6 h-6" />
               </div>
               <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest bg-neutral-800 px-2 py-1 rounded">30 Days</span>
            </div>
            <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">Bandwidth</p>
            <h2 className="text-2xl font-bold text-white font-mono">
               {stats.totalUploaded > 1024
                  ? (stats.totalUploaded / 1024).toFixed(2) + ' TB'
                  : stats.totalUploaded.toFixed(1) + ' GB'}
            </h2>
            <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-4 overflow-hidden">
               <div className="bg-blue-500 h-full w-[75%] rounded-full"></div>
            </div>
         </div>

         <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all shadow-xl">
            <div className="flex items-start justify-between mb-4">
               <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                  <ShieldCheck className="w-6 h-6" />
               </div>
               <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest bg-neutral-800 px-2 py-1 rounded">Score</span>
            </div>
            <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">Reliability</p>
            <h2 className="text-2xl font-bold text-white font-mono">98.5%</h2>
            <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-4 overflow-hidden">
               <div className="bg-green-500 h-full w-[98%] rounded-full"></div>
            </div>
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
            {[1, 2, 3, 4, 5, 6].map((i) => {
               const isSquad = i === 3 || i === 5;
               const isAd = i % 2 === 0 && !isSquad;
               const type = isSquad ? 'Squad Stream Payout' : (isAd ? 'Ad Revenue Share' : 'Bandwidth Relay Reward');
               const colorClass = isSquad ? 'text-purple-500 bg-purple-500/10' : (isAd ? 'text-green-500 bg-green-500/10' : 'text-blue-500 bg-blue-500/10');
               const Icon = isSquad ? Users : (isAd ? Zap : ArrowUpRight);

               return (
                  <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-neutral-800/20 transition-colors group cursor-pointer">
                     <div className="flex items-center gap-5">
                        <div className={`p-3 rounded-xl ${colorClass} group-hover:scale-110 transition-transform`}>
                           <Icon className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                           <p className="font-bold text-white text-sm mb-0.5">{type}</p>
                           <p className="text-xs text-neutral-500 font-medium">
                             {isSquad ? 'Split with @GuestUser • 2 hours ago' : '2 minutes ago • Node #8372'}
                           </p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="font-mono font-bold text-white text-lg">+{((i * 13.5) % 50).toFixed(2)} CR</p>
                        <p className="text-xs text-green-500 font-medium">Completed</p>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
    </div>
  );
}
