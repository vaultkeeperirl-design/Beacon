import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRealP2PStats } from './useRealP2PStats';
import * as useSocketModule from './useSocket';
import * as useP2PStreamModule from './useP2PStream';
import axios from 'axios';

vi.mock('axios');

vi.mock('./useSocket', () => ({
  useSocket: vi.fn(),
}));

vi.mock('./useP2PStream', () => ({
  subscribeToMeshStats: vi.fn(),
}));

describe('useRealP2PStats', () => {
  let mockSocket;
  let mockSubscribeCallback;
  let mockUnsubscribe;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.clearAllMocks();

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

    mockUnsubscribe = vi.fn();

    // Capture the callback passed to subscribeToMeshStats
    useP2PStreamModule.subscribeToMeshStats.mockImplementation((callback) => {
      mockSubscribeCallback = callback;

      // Call it immediately with some default values to simulate the real behavior
      callback({
        connectedPeers: 5,
        latency: 50,
        uploadSpeed: 2.5,
        downloadSpeed: 5.0,
      });

      return mockUnsubscribe;
    });

    axios.get.mockResolvedValue({ data: { balance: 10.5 } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates stats when connected to a stream', async () => {
    const settings = { quality: '1080p60', maxUploadSpeed: 50, lowLatency: false };
    const { result } = renderHook(() => useRealP2PStats(true, settings, 'test-stream', 'viewer'));

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Verify it picked up the initial mesh stats
    expect(result.current.peersConnected).toBe(5);
    expect(result.current.latency).toBe(50);
    expect(result.current.uploadSpeed).toBe(2.5);
    expect(result.current.downloadSpeed).toBe(5.0);

    // Initial totalUploaded should be 12.5 (from the hook definition) plus the newly uploaded amount
    const uploadedInInterval = (2.5 * 2) / 8 / 1024;
    expect(result.current.totalUploaded).toBe(parseFloat((12.5 + uploadedInInterval).toFixed(4)));

    // Emit a new stat update via the captured callback
    act(() => {
      mockSubscribeCallback({
        connectedPeers: 6,
        latency: 45,
        uploadSpeed: 3.0,
        downloadSpeed: 6.0,
      });
    });

    expect(result.current.peersConnected).toBe(6);
    expect(result.current.uploadSpeed).toBe(3.0);
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

    // Emitting a stat update should now reset stats because streamId is null
    act(() => {
        mockSubscribeCallback({
            connectedPeers: 5,
            latency: 50,
            uploadSpeed: 2.5,
            downloadSpeed: 5.0,
        });
    });

    // Should reset to 0
    expect(result.current.peersConnected).toBe(0);
    expect(result.current.uploadSpeed).toBe(0);
    expect(result.current.downloadSpeed).toBe(0);
    expect(result.current.latency).toBe(0);

    // Check optimization branch where it returns `prev` if already 0
    const prevStats = result.current;

    act(() => {
        mockSubscribeCallback({
            connectedPeers: 5,
            latency: 50,
            uploadSpeed: 2.5,
            downloadSpeed: 5.0,
        });
    });

    // Identity should be the same
    expect(result.current).toBe(prevStats);
  });

  it('resets stats when isSharing is false', async () => {
    const settings = { quality: '1080p60', maxUploadSpeed: 50, lowLatency: false };
    const { result, rerender } = renderHook(({ isSharing }) =>
        useRealP2PStats(isSharing, settings, 'test-stream', 'viewer'), {
        initialProps: { isSharing: true }
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.peersConnected).toBe(5);

    // Turn off sharing
    rerender({ isSharing: false });

    act(() => {
        mockSubscribeCallback({
            connectedPeers: 5,
            latency: 50,
            uploadSpeed: 2.5,
            downloadSpeed: 5.0,
        });
    });

    expect(result.current.peersConnected).toBe(0);
    expect(result.current.uploadSpeed).toBe(0);
  });

  it('fetches initial balance if token exists', async () => {
    localStorage.setItem('beacon_token', 'valid-token');

    const settings = { quality: '1080p60', maxUploadSpeed: 50, lowLatency: false };

    let renderResult;
    await act(async () => {
      renderResult = renderHook(() => useRealP2PStats(true, settings, 'test-stream', 'viewer'));
    });

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/wallet'), expect.any(Object));
    expect(renderResult.result.current.credits).toBe(10.5);
  });

  it('does not fetch initial balance if token is missing', async () => {
    const settings = { quality: '1080p60', maxUploadSpeed: 50, lowLatency: false };

    await act(async () => {
      renderHook(() => useRealP2PStats(true, settings, 'test-stream', 'viewer'));
    });

    expect(axios.get).not.toHaveBeenCalled();
  });

  it('emits join-stream on mount with streamId and leave-stream on unmount/null streamId', () => {
    const settings = { quality: '1080p60', maxUploadSpeed: 50, lowLatency: false };

    const { rerender } = renderHook(({ streamId }) => useRealP2PStats(true, settings, streamId, 'testuser'), {
        initialProps: { streamId: 'stream-1' }
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('join-stream', { streamId: 'stream-1', username: 'testuser' });

    rerender({ streamId: null });

    expect(mockSocket.emit).toHaveBeenCalledWith('leave-stream');
  });

  it('listens to wallet-update events and updates credits', () => {
    const settings = { quality: '1080p60', maxUploadSpeed: 50, lowLatency: false };

    const { result, unmount } = renderHook(() => useRealP2PStats(true, settings, 'stream-1', 'testuser'));

    // Capture the registered event handler
    const eventHandlers = {};
    mockSocket.on.mock.calls.forEach(call => {
        eventHandlers[call[0]] = call[1];
    });

    expect(eventHandlers['wallet-update']).toBeDefined();

    // Trigger the wallet update
    act(() => {
        eventHandlers['wallet-update']({ balance: 42.0 });
    });

    expect(result.current.credits).toBe(42.0);

    // Trigger with same balance should return previous state reference (optimization)
    const prevStats = result.current;
    act(() => {
        eventHandlers['wallet-update']({ balance: 42.0 });
    });

    expect(result.current).toBe(prevStats);

    // Verify it cleans up on unmount
    unmount();
    expect(mockSocket.off).toHaveBeenCalledWith('wallet-update', expect.any(Function));
  });

  it('returns previous stats object if no values changed (shallow equality optimization)', () => {
    const settings = { quality: '1080p60', maxUploadSpeed: 50, lowLatency: false };

    const { result } = renderHook(() => useRealP2PStats(true, settings, 'test-stream', 'viewer'));

    // Emit the exact same stats (totalUploaded calculation needs to be identical, so we pass 0 for uploadSpeed to prevent it from growing)
    act(() => {
        mockSubscribeCallback({
            connectedPeers: 5,
            latency: 50,
            uploadSpeed: 0,
            downloadSpeed: 5.0,
        });
    });

    const updatedStats1 = result.current;

    // Now emit the exact same thing again
    act(() => {
        mockSubscribeCallback({
            connectedPeers: 5,
            latency: 50,
            uploadSpeed: 0,
            downloadSpeed: 5.0,
        });
    });

    const updatedStats2 = result.current;

    // Should be referentially identical due to optimization
    expect(updatedStats1).toBe(updatedStats2);
  });
});
