import React from 'react';
import { render, screen } from '@testing-library/react';
import StreamHealthIndicator from './StreamHealthIndicator';
import { useP2PStats } from '../context/P2PContext';
import { vi } from 'vitest';

vi.mock('../context/P2PContext', () => ({
  useP2PStats: vi.fn(),
}));

describe('StreamHealthIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Offline for viewer when not started and no remote stream', () => {
    useP2PStats.mockReturnValue({ latency: 50 });
    render(
      <StreamHealthIndicator
        peers={{}}
        isViewer={true}
        hasStarted={false}
        remoteStream={null}
      />
    );
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('renders Reconnecting... for viewer when started but no remote stream', () => {
    useP2PStats.mockReturnValue({ latency: 50 });
    render(
      <StreamHealthIndicator
        peers={{}}
        isViewer={true}
        hasStarted={true}
        remoteStream={null}
      />
    );
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
  });

  it('renders Poor when more than half of peers are disconnected', () => {
    useP2PStats.mockReturnValue({ latency: 50 });
    const peers = {
      peer1: { iceConnectionState: 'disconnected' },
      peer2: { iceConnectionState: 'failed' },
      peer3: { iceConnectionState: 'connected' },
    };
    render(
      <StreamHealthIndicator
        peers={peers}
        isViewer={false} // not a viewer, so it bypasses offline/reconnecting
      />
    );
    expect(screen.getByText('Poor')).toBeInTheDocument();
  });

  it('renders Fair when some peers are disconnected', () => {
    useP2PStats.mockReturnValue({ latency: 50 });
    const peers = {
      peer1: { iceConnectionState: 'disconnected' },
      peer2: { iceConnectionState: 'connected' },
      peer3: { iceConnectionState: 'connected' },
    };
    render(
      <StreamHealthIndicator
        peers={peers}
        isViewer={false}
      />
    );
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('renders Fair (High Latency) when latency > 300 and all peers are fine', () => {
    useP2PStats.mockReturnValue({ latency: 350 });
    const peers = {
      peer1: { iceConnectionState: 'connected' },
    };
    render(
      <StreamHealthIndicator
        peers={peers}
        isViewer={false}
      />
    );
    expect(screen.getByText('Fair (High Latency)')).toBeInTheDocument();
  });

  it('renders Excellent when latency <= 300 and all peers are fine', () => {
    useP2PStats.mockReturnValue({ latency: 50 });
    const peers = {
      peer1: { iceConnectionState: 'connected' },
    };
    render(
      <StreamHealthIndicator
        peers={peers}
        isViewer={false}
      />
    );
    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('renders correctly for broadcast view', () => {
    useP2PStats.mockReturnValue({ latency: 50 });
    const peers = {
      peer1: { iceConnectionState: 'connected' },
    };
    render(
      <StreamHealthIndicator
        peers={peers}
        isViewer={false}
        isBroadcastView={true}
      />
    );
    expect(screen.getByText(/Stream Health:/)).toBeInTheDocument();
    expect(screen.getByText(/Excellent/)).toBeInTheDocument();
  });
});
