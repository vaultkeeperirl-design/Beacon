import React from 'react';
import { Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useP2PStats } from '../context/P2PContext';

export default function WalletBalance() {
  const stats = useP2PStats();

  return (
    <Link to="/wallet">
      <div className="hidden md:flex items-center gap-2 text-xs font-medium text-neutral-400 bg-neutral-950 px-3 py-1.5 rounded-full border border-neutral-800 hover:border-beacon-500/30 transition-colors cursor-pointer group">
         <Wallet className="w-3.5 h-3.5 text-beacon-500 group-hover:text-beacon-400 transition-colors" />
         <span className="font-mono text-white group-hover:text-beacon-100">
            {stats.credits.toLocaleString(undefined, { maximumFractionDigits: 0 })} CR
         </span>
      </div>
    </Link>
  );
}
