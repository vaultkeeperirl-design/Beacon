import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRealP2PStats } from './useRealP2PStats';
import * as useSocketModule from './useSocket';

vi.mock('./useSocket', () => ({
  useSocket: vi.fn(),
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
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('calculates download speed based on quality', () => {
    const settings = { quality: '480p', maxUploadSpeed: 50, lowLatency: false };
    const { result } = renderHook(() => useRealP2PStats(true, settings, 'test-stream', 'viewer'));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // 480p is 1.5Mbps, jitter is 10%, so range is 1.35 to 1.65
    expect(result.current.downloadSpeed).toBeGreaterThanOrEqual(1.3);
    expect(result.current.downloadSpeed).toBeLessThanOrEqual(1.7);
  });

  it('caps upload speed based on maxUploadSpeed', () => {
    const settings = { quality: '1080p60', maxUploadSpeed: 2, lowLatency: false };
    const { result } = renderHook(() => useRealP2PStats(true, settings, 'test-stream', 'viewer'));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // 1080p60 is 8.0Mbps. Ideal upload is 40% (3.2Mbps), but capped at 2Mbps
    expect(result.current.uploadSpeed).toBeLessThanOrEqual(2.5); // some room for jitter if any, but should be close to 2
    expect(result.current.uploadSpeed).toBeGreaterThan(0);
  });

  it('adjusts buffer health based on lowLatency setting', () => {
    const settingsLow = { quality: '1080p60', maxUploadSpeed: 50, lowLatency: true };
    const { result: resultLow } = renderHook(() => useRealP2PStats(true, settingsLow, 'test-stream', 'viewer'));

    const settingsStandard = { quality: '1080p60', maxUploadSpeed: 50, lowLatency: false };
    const { result: resultStandard } = renderHook(() => useRealP2PStats(true, settingsStandard, 'test-stream', 'viewer'));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(resultLow.current.bufferHealth).toBeGreaterThanOrEqual(1.5);
    expect(resultLow.current.bufferHealth).toBeLessThanOrEqual(2.5);

    expect(resultStandard.current.bufferHealth).toBeGreaterThanOrEqual(7.5);
    expect(resultStandard.current.bufferHealth).toBeLessThanOrEqual(8.5);
  });
});
