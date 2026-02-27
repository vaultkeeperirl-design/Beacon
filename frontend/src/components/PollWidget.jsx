import { useState } from 'react';
import { usePoll } from '../hooks/usePoll';

export default function PollWidget({ streamId }) {
  const { activePoll, hasVoted, submitVote } = usePoll(streamId);
  const [localVote, setLocalVote] = useState(null);

  if (!activePoll) return null;

  const handleVote = (index) => {
    if (!hasVoted) {
      setLocalVote(index);
      submitVote(index);
    }
  };

  const totalVotes = activePoll.totalVotes || 0;

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 p-4 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <svg className="w-16 h-16 text-beacon-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      </div>

      <div className="relative z-10">
        <h3 className="font-bold text-white text-sm mb-3 flex items-center justify-between">
          <span>{activePoll.question}</span>
          <span className="text-[10px] font-mono text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded">{totalVotes} VOTES</span>
        </h3>

        <div className="space-y-2">
          {activePoll.options.map((option, idx) => {
            const percent = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

            return (
              <button
                key={idx}
                onClick={() => handleVote(idx)}
                disabled={hasVoted}
                className={`w-full relative h-9 rounded-lg overflow-hidden group/opt transition-all ${
                  hasVoted ? 'cursor-default' : 'hover:ring-1 hover:ring-beacon-500/50 cursor-pointer'
                }`}
              >
                {/* Background Bar */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    hasVoted && localVote === idx ? 'bg-beacon-600/40' : 'bg-neutral-800'
                  }`}
                  style={{ width: hasVoted ? `${percent}%` : '0%' }}
                ></div>

                {/* Content */}
                <div className="absolute inset-0 flex items-center justify-between px-3">
                  <span className={`text-xs font-medium z-10 transition-colors ${
                    hasVoted && localVote === idx ? 'text-beacon-400' : 'text-neutral-300 group-hover/opt:text-white'
                  }`}>
                    {option.text}
                    {hasVoted && localVote === idx && <span className="ml-2 text-[10px] bg-beacon-600/20 text-beacon-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">You</span>}
                  </span>

                  {hasVoted && (
                    <span className="text-xs font-bold text-white z-10 font-mono">{percent}%</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
