import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

/**
 * Interface for the Poll object from the server.
 * @typedef {Object} Poll
 * @property {number|string} id - The unique identifier of the poll.
 * @property {string} question - The question being asked.
 * @property {Array<{text: string, votes: number}>} options - The possible options and their current vote counts.
 * @property {number} totalVotes - The overall total number of votes cast.
 * @property {boolean} isActive - Whether the poll is currently accepting votes.
 * @property {number|null} [duration] - The total duration the poll is set to run for, in seconds.
 */

/**
 * Custom hook to manage the lifecycle of a poll within a stream.
 *
 * Subscribes to Socket.IO events for poll creation, updates, and completion.
 * Exposes methods to start, end, and vote in polls.
 *
 * @param {string} streamId - The unique identifier of the stream/room where the poll takes place.
 * @returns {{
 *   activePoll: Poll | null,
 *   hasVoted: boolean,
 *   startPoll: (question: string, options: string[], duration?: number) => void,
 *   submitVote: (optionIndex: number) => void,
 *   endPoll: () => void
 * }} An object containing the current poll state and functions to manage it.
 */
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

  const startPoll = useCallback((question, options, duration) => {
    if (!socket || !streamId) return;
    socket.emit('create-poll', { streamId, question, options, duration });
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
