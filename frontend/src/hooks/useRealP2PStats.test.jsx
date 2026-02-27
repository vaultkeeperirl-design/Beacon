import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRealP2PStats } from './useRealP2PStats';
import * as useSocketModule from './useSocket';
import * as useP2PMeshModule from './useP2PMesh';

vi.mock('./useSocket', () => ({
  useSocket: vi.fn(),
}));

vi.mock('./useP2PMesh', () => ({
  useP2PMesh: vi.fn(),
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
    useP2PMeshModule.useP2PMesh.mockReturnValue({
      connectedPeers: 5,
      latency: 50,
      uploadSpeed: 2.5,
      downloadSpeed: 5.0,
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

    // Verify credits accrue (uploadSpeed * 0.01)
    // 2450.0 initial + (2.5 * 0.01) = 2450.025
    expect(result.current.credits).toBeCloseTo(2450.025);
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
