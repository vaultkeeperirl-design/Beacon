import { useState, useEffect, useRef } from 'react';
import SimplePeer from 'simple-peer';
import { useSocket } from './useSocket';

export function useP2PMesh() {
  const { socket, isConnected } = useSocket();
  const peersRef = useRef({}); // Store peer instances: { socketId: SimplePeer }
  const [meshStats, setMeshStats] = useState({
    connectedPeers: 0,
    latency: 0,
    uploadSpeed: 0,
    downloadSpeed: 0
  });

  // Refs for calculating speed
  const bytesSentRef = useRef(0);
  const bytesReceivedRef = useRef(0);
  // Initialize with null and set in effect to avoid purity error
  const lastSpeedCheckRef = useRef(null);

  useEffect(() => {
      if (lastSpeedCheckRef.current === null) {
          lastSpeedCheckRef.current = Date.now();
      }
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const createPeer = (userToSignal) => {
      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        }
      });

      peer.on('signal', signal => {
        socket.emit('signal', { to: userToSignal, signal });
      });

      setupPeerEvents(peer, userToSignal);
      return peer;
    };

    const addPeer = (incomingSignal, callerID) => {
      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        }
      });

      peer.on('signal', signal => {
        socket.emit('signal', { to: callerID, signal });
      });

      peer.signal(incomingSignal);
      setupPeerEvents(peer, callerID);
      return peer;
    };

    const setupPeerEvents = (peer, remoteSocketId) => {
        peer.on('connect', () => {
            console.log(`P2P Connected to ${remoteSocketId}`);
            setMeshStats(prev => ({ ...prev, connectedPeers: Object.keys(peersRef.current).length }));
        });

        peer.on('data', data => {
            const size = data.length;
            bytesReceivedRef.current += size;

            try {
                const message = JSON.parse(data.toString());
                if (message.type === 'ping') {
                    // Send pong
                    peer.send(JSON.stringify({ type: 'pong', timestamp: message.timestamp }));
                } else if (message.type === 'pong') {
                    // Calculate RTT
                    const rtt = Date.now() - message.timestamp;
                    // Update latency (simple moving average)
                    setMeshStats(prev => ({
                        ...prev,
                        latency: prev.latency === 0 ? rtt : Math.round((prev.latency * 0.7) + (rtt * 0.3))
                    }));
                }
            } catch (e) {
                // Ignore non-JSON data (if any raw buffers are sent)
            }
        });

        peer.on('close', () => {
            console.log(`P2P Disconnected from ${remoteSocketId}`);
            if (peersRef.current[remoteSocketId]) {
                delete peersRef.current[remoteSocketId];
            }
            setMeshStats(prev => ({ ...prev, connectedPeers: Object.keys(peersRef.current).length }));
        });

        peer.on('error', (err) => {
            console.error('P2P Error:', err);
             if (peersRef.current[remoteSocketId]) {
                delete peersRef.current[remoteSocketId];
            }
             setMeshStats(prev => ({ ...prev, connectedPeers: Object.keys(peersRef.current).length }));
        });

        peersRef.current[remoteSocketId] = peer;
    };

    socket.on('user-connected', ({ id }) => {
        console.log("User connected, initiating P2P:", id);
        if (!peersRef.current[id]) {
            const peer = createPeer(id);
            peersRef.current[id] = peer;
        }
    });

    socket.on('signal', ({ from, signal }) => {
        // "from" is the sender's socket ID
        if (!peersRef.current[from]) {
            // New incoming connection
            const peer = addPeer(signal, from);
            peersRef.current[from] = peer;
        } else {
            // Existing peer, forward signal (e.g., candidates)
            peersRef.current[from].signal(signal);
        }
    });

    socket.on('user-disconnected', ({ id }) => {
        if (peersRef.current[id]) {
            peersRef.current[id].destroy();
            delete peersRef.current[id];
             setMeshStats(prev => ({ ...prev, connectedPeers: Object.keys(peersRef.current).length }));
        }
    });

    return () => {
        socket.off('user-connected');
        socket.off('signal');
        socket.off('user-disconnected');
        Object.values(peersRef.current).forEach(peer => peer.destroy());
        peersRef.current = {};
    };
  }, [socket, isConnected]);

  // Heartbeat & Throughput Calculation Loop
  useEffect(() => {
    const interval = setInterval(() => {
        const now = Date.now();
        const timeDiff = (now - lastSpeedCheckRef.current) / 1000; // seconds

        if (timeDiff > 0) {
            const uploadSpeed = (bytesSentRef.current / 1024 / 1024 * 8) / timeDiff; // Mbps
            const downloadSpeed = (bytesReceivedRef.current / 1024 / 1024 * 8) / timeDiff; // Mbps

            setMeshStats(prev => ({
                ...prev,
                uploadSpeed: parseFloat(uploadSpeed.toFixed(4)), // higher precision for low traffic
                downloadSpeed: parseFloat(downloadSpeed.toFixed(4))
            }));

            // Reset counters
            bytesSentRef.current = 0;
            bytesReceivedRef.current = 0;
            lastSpeedCheckRef.current = now;
        }

        // Send Pings
        Object.values(peersRef.current).forEach(peer => {
            if (peer.connected) {
                const pingMsg = JSON.stringify({ type: 'ping', timestamp: Date.now() });
                peer.send(pingMsg);
                bytesSentRef.current += pingMsg.length;
            }
        });

    }, 2000); // Check speed every 2s

    return () => clearInterval(interval);
  }, []);

  return meshStats;
}
