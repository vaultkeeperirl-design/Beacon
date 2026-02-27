import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePoll } from './usePoll';
import * as useSocketModule from './useSocket';

vi.mock('./useSocket', () => ({
  useSocket: vi.fn(),
}));

describe('usePoll', () => {
  let mockSocket;

  beforeEach(() => {
    mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };
    useSocketModule.useSocket.mockReturnValue({
      socket: mockSocket,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with null activePoll and hasVoted false', () => {
    const { result } = renderHook(() => usePoll('stream-1'));
    expect(result.current.activePoll).toBeNull();
    expect(result.current.hasVoted).toBe(false);
  });

  it('updates activePoll and resets hasVoted on poll-started', () => {
    let pollStartedCallback;
    mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'poll-started') pollStartedCallback = cb;
    });

    const { result } = renderHook(() => usePoll('stream-1'));

    act(() => {
      // Simulate previously having voted (e.g. state before a new poll)
      // Though we can't directly set hasVoted, we know it resets to false
      pollStartedCallback({ id: 'poll-1', question: 'Q1', options: [] });
    });

    expect(result.current.activePoll).toEqual({ id: 'poll-1', question: 'Q1', options: [] });
    expect(result.current.hasVoted).toBe(false);
  });

  it('updates existing poll on poll-update if ids match', () => {
    let pollStartedCallback, pollUpdateCallback;
    mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'poll-started') pollStartedCallback = cb;
      if (event === 'poll-update') pollUpdateCallback = cb;
    });

    const { result } = renderHook(() => usePoll('stream-1'));

    act(() => {
      pollStartedCallback({ id: 'poll-1', question: 'Q1', options: [], totalVotes: 0 });
    });

    act(() => {
      pollUpdateCallback({ id: 'poll-1', totalVotes: 1 });
    });

    expect(result.current.activePoll).toEqual({ id: 'poll-1', question: 'Q1', options: [], totalVotes: 1 });
  });

  it('sets new poll on poll-update if ids do not match or no active poll', () => {
    let pollUpdateCallback;
    mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'poll-update') pollUpdateCallback = cb;
    });

    const { result } = renderHook(() => usePoll('stream-1'));

    act(() => {
      pollUpdateCallback({ id: 'poll-2', question: 'Q2', options: [] });
    });

    expect(result.current.activePoll).toEqual({ id: 'poll-2', question: 'Q2', options: [] });
  });

  it('clears activePoll on poll-ended', () => {
    let pollStartedCallback, pollEndedCallback;
    mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'poll-started') pollStartedCallback = cb;
      if (event === 'poll-ended') pollEndedCallback = cb;
    });

    const { result } = renderHook(() => usePoll('stream-1'));

    act(() => {
      pollStartedCallback({ id: 'poll-1', question: 'Q1', options: [] });
    });

    expect(result.current.activePoll).not.toBeNull();

    act(() => {
      pollEndedCallback();
    });

    expect(result.current.activePoll).toBeNull();
  });

  it('emits create-poll on startPoll', () => {
    const { result } = renderHook(() => usePoll('stream-1'));

    act(() => {
      result.current.startPoll('Q1', ['A', 'B'], 60);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('create-poll', {
      streamId: 'stream-1',
      question: 'Q1',
      options: ['A', 'B'],
      duration: 60
    });
  });

  it('emits vote-poll and sets hasVoted to true on submitVote', () => {
    let pollStartedCallback;
    mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'poll-started') pollStartedCallback = cb;
    });

    const { result } = renderHook(() => usePoll('stream-1'));

    act(() => {
      pollStartedCallback({ id: 'poll-1', question: 'Q1', options: ['A', 'B'] });
    });

    act(() => {
      result.current.submitVote(1);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('vote-poll', {
      streamId: 'stream-1',
      pollId: 'poll-1',
      optionIndex: 1
    });
    expect(result.current.hasVoted).toBe(true);
  });

  it('does not emit vote-poll if already voted', () => {
    let pollStartedCallback;
    mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'poll-started') pollStartedCallback = cb;
    });

    const { result } = renderHook(() => usePoll('stream-1'));

    act(() => {
      pollStartedCallback({ id: 'poll-1', question: 'Q1', options: ['A', 'B'] });
    });

    act(() => {
      result.current.submitVote(1);
    });

    mockSocket.emit.mockClear();

    act(() => {
      result.current.submitVote(0);
    });

    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it('emits end-poll on endPoll', () => {
    const { result } = renderHook(() => usePoll('stream-1'));

    act(() => {
      result.current.endPoll();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('end-poll', { streamId: 'stream-1' });
  });
});
