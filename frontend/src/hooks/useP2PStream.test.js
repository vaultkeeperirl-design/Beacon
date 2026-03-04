import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useP2PStream, subscribeToMeshStats } from './useP2PStream';
import * as SocketHook from './useSocket';

// Mock WebRTC
class MockRTCPeerConnection {
  constructor() {
    this.addTrack = vi.fn();
    this.close = vi.fn();
    this.createOffer = vi.fn().mockResolvedValue({ type: 'offer', sdp: 'fake-offer' });
    this.createAnswer = vi.fn().mockResolvedValue({ type: 'answer', sdp: 'fake-answer' });
    this.setLocalDescription = vi.fn().mockResolvedValue(undefined);
    this.setRemoteDescription = vi.fn().mockResolvedValue(undefined);
    this.addIceCandidate = vi.fn().mockResolvedValue(undefined);
    this.getStats = vi.fn().mockResolvedValue(new Map());
    this.iceConnectionState = 'new';
    this.onicecandidate = null;
    this.ontrack = null;
    this.oniceconnectionstatechange = null;

    // Store instances to access them in tests
    MockRTCPeerConnection.instances.push(this);
  }
}
MockRTCPeerConnection.instances = [];

globalThis.RTCPeerConnection = MockRTCPeerConnection;

globalThis.RTCSessionDescription = class { constructor(desc) { Object.assign(this, desc); } };
globalThis.RTCIceCandidate = class { constructor(cand) { Object.assign(this, cand); } };

// Mock Socket
vi.mock('./useSocket', () => ({
  useSocket: vi.fn(),
}));

describe('useP2PStream', () => {
  let mockSocket;

  beforeEach(() => {
    vi.useFakeTimers();
    mockSocket = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    };

    SocketHook.useSocket.mockReturnValue({
      socket: mockSocket,
      isConnected: true,
    });

    MockRTCPeerConnection.instances = [];
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('subscribes and unsubscribes to global mesh stats', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToMeshStats(callback);

    // Initial call
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      latency: 0,
      uploadSpeed: 0,
      downloadSpeed: 0,
      connectedPeers: 0
    }));

    unsubscribe();
  });

  it('registers socket event listeners on mount', () => {
    const streamId = 'test-stream-id';
    const { unmount } = renderHook(() => useP2PStream(false, null, streamId));

    expect(mockSocket.on).toHaveBeenCalledWith('p2p-initiate-connection', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('offer', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('answer', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('ice-candidate', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('user-disconnected', expect.any(Function));

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith('p2p-initiate-connection', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('offer', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('answer', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('ice-candidate', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('user-disconnected', expect.any(Function));
  });

  it('closes peer connections on unmount', async () => {
    let handleOffer;
    mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'offer') handleOffer = cb;
    });

    const streamId = 'test-stream-id';
    const { unmount } = renderHook(() => useP2PStream(false, null, streamId));

    // Simulate receiving an offer to create a peer connection
    act(() => {
      handleOffer({ sender: 'peer1', offer: {} });
    });

    // Wait for the async offer handler
    await act(async () => {
      await Promise.resolve();
    });

    const mockPcInstance = MockRTCPeerConnection.instances[0];

    unmount();

    expect(mockPcInstance.close).toHaveBeenCalled();
  });

  it('polls stats periodically', async () => {
    const streamId = 'test-stream-id';
    renderHook(() => useP2PStream(false, null, streamId));

    const callback = vi.fn();
    const unsubscribe = subscribeToMeshStats(callback);

    callback.mockClear();

    // Fast forward past the 2000ms polling interval
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });

    // Since no peers are connected, it should emit 0s
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      latency: 0,
      uploadSpeed: 0,
      downloadSpeed: 0,
      connectedPeers: 0
    }));

    unsubscribe();
  });
});
