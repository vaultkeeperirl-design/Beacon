import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSocket, getSocket } from './useSocket';

// Mock socket.io-client
vi.mock('socket.io-client', () => {
  return {
    io: vi.fn(() => ({
      connected: false,
      on: vi.fn(),
      off: vi.fn(),
    }))
  };
});

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a socket instance and connection status', () => {
    const { result } = renderHook(() => useSocket());

    expect(result.current.socket).toBeDefined();
    expect(result.current.isConnected).toBe(false);
  });

  it('updates connection status on connect and disconnect events', () => {
    let connectCb, disconnectCb;

    // We need to access the mock to get the registered callbacks
    const mockSocket = getSocket();
    mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'connect') connectCb = cb;
      if (event === 'disconnect') disconnectCb = cb;
    });

    const { result } = renderHook(() => useSocket());

    expect(result.current.isConnected).toBe(false);

    act(() => {
      connectCb();
    });

    expect(result.current.isConnected).toBe(true);

    act(() => {
      disconnectCb();
    });

    expect(result.current.isConnected).toBe(false);
  });
});
