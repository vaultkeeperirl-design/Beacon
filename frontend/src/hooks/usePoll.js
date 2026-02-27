import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

export function usePoll(streamId) {
  const { socket } = useSocket();
  const [activePoll, setActivePoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (!socket || !streamId) return;

    const handlePollStarted = (poll) => {
      setActivePoll(poll);
      setHasVoted(false);
    };

    const handlePollUpdate = (poll) => {
      if (activePoll && activePoll.id === poll.id) {
         setActivePoll(prev => ({ ...prev, ...poll }));
      } else {
         // New poll or initial sync
         setActivePoll(poll);
      }
    };

    const handlePollEnded = () => {
      setActivePoll(null);
      setHasVoted(false);
    };

    socket.on('poll-started', handlePollStarted);
    socket.on('poll-update', handlePollUpdate);
    socket.on('poll-ended', handlePollEnded);

    return () => {
      socket.off('poll-started', handlePollStarted);
      socket.off('poll-update', handlePollUpdate);
      socket.off('poll-ended', handlePollEnded);
    };
  }, [socket, streamId, activePoll]);

  const startPoll = useCallback((question, options) => {
    if (!socket || !streamId) return;
    socket.emit('create-poll', { streamId, question, options });
  }, [socket, streamId]);

  const submitVote = useCallback((optionIndex) => {
    if (!socket || !streamId || !activePoll || hasVoted) return;

    socket.emit('vote-poll', {
      streamId,
      pollId: activePoll.id,
      optionIndex
    });
    setHasVoted(true);
  }, [socket, streamId, activePoll, hasVoted]);

  const endPoll = useCallback(() => {
    if (!socket || !streamId) return;
    socket.emit('end-poll', { streamId });
  }, [socket, streamId]);

  return {
    activePoll,
    hasVoted,
    startPoll,
    submitVote,
    endPoll
  };
}
