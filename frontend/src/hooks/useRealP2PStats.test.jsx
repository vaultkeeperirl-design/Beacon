import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRealP2PStats } from './useRealP2PStats';
import * as useSocketModule from './useSocket';
import * as useP2PStreamModule from './useP2PStream';

vi.mock('./useSocket', () => ({
  useSocket: vi.fn(),
}));

vi.mock('./useP2PStream', () => ({
  subscribeToMeshStats: vi.fn(),
}));

describe('useRealP2PStats', () => {
  let mockSocket;

  beforeEach(() => {
    vi.useFakeTimers();
    mockSocket = {
      connected: true,
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };
    useSocketModule.useSocket.mockReturnValue({
      socket: mockSocket,
      isConnected: true,
    });

    // Mock the underlying mesh stats return value
    useP2PStreamModule.subscribeToMeshStats.mockImplementation((callback) => {
      callback({
        connectedPeers: 5,
        latency: 50,
        uploadSpeed: 2.5,
        downloadSpeed: 5.0,
      });
      return vi.fn(); // return mock unsubscribe function
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('updates stats when connected to a stream', async () => {
    const settings = { quality: '1080p60', maxUploadSpeed: 50, lowLatency: false };
    const { result } = renderHook(() => useRealP2PStats(true, settings, 'test-stream', 'viewer'));

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Verify it picked up the mesh stats
    expect(result.current.peersConnected).toBe(5);
    expect(result.current.latency).toBe(50);
    expect(result.current.uploadSpeed).toBe(2.5);
    expect(result.current.downloadSpeed).toBe(5.0);

    // Credits are now updated via socket event (or initial load)
    // Here it defaults to 0.0 since our mock doesn't simulate the socket response yet
    expect(result.current.credits).toBe(0.0);
  });

  it('resets stats when streamId is null', async () => {
    const settings = { quality: '1080p60', maxUploadSpeed: 50, lowLatency: false };
    const { result, rerender } = renderHook(({ streamId }) =>
        useRealP2PStats(true, settings, streamId, 'viewer'), {
        initialProps: { streamId: 'test-stream' }
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.peersConnected).toBe(5);

    // Change streamId to null
    rerender({ streamId: null });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Should reset to 0
    expect(result.current.peersConnected).toBe(0);
    expect(result.current.uploadSpeed).toBe(0);
  });
});
