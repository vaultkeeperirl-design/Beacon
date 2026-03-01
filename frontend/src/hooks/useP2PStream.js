import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './useSocket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

// Global state to store the latest mesh stats so other hooks (like useRealP2PStats) can read it without instantiating WebRTC.
let globalMeshStats = {
  latency: 0,
  uploadSpeed: 0,
  downloadSpeed: 0,
  connectedPeers: 0
};
let globalMeshStatsSubscribers = new Set();

/**
 * Subscribes a callback function to global mesh network statistics updates.
 *
 * This function allows components to react to changes in P2P mesh performance
 * (such as upload speed, download speed, latency, and connected peers) without
 * re-rendering the entire component tree that uses `useP2PStream`.
 *
 * @param {Function} callback - A function that receives the latest mesh statistics object.
 * @returns {Function} An unsubscribe function to remove the callback, preventing memory leaks.
 */
export const subscribeToMeshStats = (callback) => {
  globalMeshStatsSubscribers.add(callback);
  callback(globalMeshStats); // send initial
  return () => globalMeshStatsSubscribers.delete(callback);
};

const updateGlobalMeshStats = (newStats) => {
  globalMeshStats = newStats;
  globalMeshStatsSubscribers.forEach(cb => cb(globalMeshStats));
};

/**
 * Custom hook to manage WebRTC Peer-to-Peer streaming connections.
 *
 * Handles signaling, connection establishment, stream relaying, and dynamic
 * mesh network statistics polling. It supports both broadcaster (sending a local stream)
 * and viewer/relay (receiving and forwarding a remote stream) roles.
 *
 * @param {boolean} [isBroadcaster=false] - If true, the hook acts as the root node, sending `localStream`.
 * @param {MediaStream|null} [localStream=null] - The broadcaster's local media stream to share.
 * @param {string|null} [streamId=null] - The unique identifier of the stream being accessed.
 * @returns {{
 *   remoteStream: MediaStream|null,
 *   peers: Object<string, RTCPeerConnection>
 * }} An object containing the received remote stream (if not a broadcaster) and active peer connections.
 */
export const useP2PStream = (isBroadcaster = false, localStream = null, streamId = null) => {
  const { socket, isConnected } = useSocket();
  const [remoteStream, setRemoteStream] = useState(null);
  const [peers, setPeers] = useState({}); // Keep track of peer connections (mainly for broadcaster)
  const [parentPeerId, setParentPeerId] = useState(null); // Track the parent node we are receiving from

  // Use a ref to store peers so we can access them inside socket event callbacks without stale closures
  const peersRef = useRef({});
  const parentPeerIdRef = useRef(null);

  // ⚡ Performance Optimization:
  // We remove `meshStats` from React state here.
  // Previously, `setMeshStats` was called every 2 seconds by the polling interval,
  // causing any component using this hook (like the entire Watch or Broadcast page)
  // to re-render constantly. Now, we only update the global subscribers.
  // Components that need the stats can use `useRealP2PStats` or `subscribeToMeshStats` directly.

  // Track previously recorded bytes to calculate speed
  const prevBytesRef = useRef({ sent: 0, received: 0, timestamp: Date.now() });

  useEffect(() => {
    parentPeerIdRef.current = parentPeerId;
  }, [parentPeerId]);

  const addPeer = useCallback((id, peerConnection) => {
    peersRef.current[id] = peerConnection;
    setPeers(prev => ({ ...prev, [id]: peerConnection }));
  }, []);

  const removePeer = useCallback((id) => {
    if (peersRef.current[id]) {
      peersRef.current[id].close();
      const newPeers = { ...peersRef.current };
      delete newPeers[id];
      peersRef.current = newPeers;
      setPeers(newPeers);

      if (id === parentPeerIdRef.current) {
        console.log(`[Mesh] Parent ${id} disconnected. We are now an orphan.`);
        setParentPeerId(null);
        setRemoteStream(null);
      }
    }
  }, []);

  const createPeerConnection = useCallback((targetId, streamToSend) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // If we have a stream to send (local or relayed remote), add its tracks
    if (streamToSend) {
      streamToSend.getTracks().forEach(track => {
        pc.addTrack(track, streamToSend);
      });
    }

    // Handle receiving ICE candidates from the remote peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          target: targetId,
          candidate: event.candidate
        });
      }
    };

    // Handle receiving remote tracks from a parent node
    pc.ontrack = (event) => {
      if (!isBroadcaster && event.streams && event.streams[0]) {
        // We received a stream! Update our state so we can play it,
        // and also use it to relay to any future children.
        setRemoteStream(event.streams[0]);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
        removePeer(targetId);
      }
    };

    return pc;
  }, [socket, isBroadcaster, removePeer]);

  // Use a ref for remote stream to access latest in socket callbacks
  const remoteStreamRef = useRef(null);
  useEffect(() => {
    remoteStreamRef.current = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (!socket || !isConnected || !streamId) return;

    // Tracker assigns us a child node to send our stream to.
    // This could be the localStream (if we are the broadcaster)
    // or the remoteStream we are currently receiving (if we are a relay).
    const handleInitiateConnection = async ({ childId }) => {
      let streamToSend = null;
      if (isBroadcaster && localStream) {
        streamToSend = localStream;
      } else if (!isBroadcaster && remoteStreamRef.current) {
        streamToSend = remoteStreamRef.current;
      }

      if (streamToSend) {
        console.log(`[Mesh] Initiating connection to child ${childId}`);
        const pc = createPeerConnection(childId, streamToSend);
        addPeer(childId, pc);

        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', { target: childId, offer });
        } catch (err) {
          console.error('Error creating offer:', err);
        }
      } else {
        console.warn(`[Mesh] Assigned child ${childId} but have no stream to send yet!`);
      }
    };

    // Receive an offer from our assigned parent node
    const handleOffer = async ({ sender, offer }) => {
      console.log(`[Mesh] Received offer from parent ${sender}`);
      const pc = createPeerConnection(sender, null);
      addPeer(sender, pc);
      setParentPeerId(sender);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { target: sender, answer });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    };

    // Receive an answer from a child we sent an offer to
    const handleAnswer = async ({ sender, answer }) => {
      console.log(`[Mesh] Received answer from child ${sender}`);
      const pc = peersRef.current[sender];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error handling answer:', err);
        }
      }
    };

    // Both: Receive ICE candidates
    const handleIceCandidate = async ({ sender, candidate }) => {
      const pc = peersRef.current[sender];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    };

    const handleUserDisconnected = ({ id }) => {
      removePeer(id);
    };

    socket.on('p2p-initiate-connection', handleInitiateConnection);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('user-disconnected', handleUserDisconnected);

    return () => {
      socket.off('p2p-initiate-connection', handleInitiateConnection);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('user-disconnected', handleUserDisconnected);
    };
  }, [socket, isConnected, isBroadcaster, localStream, streamId, createPeerConnection, addPeer, removePeer]);

  // Poll RTCPeerConnection stats periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      const pcs = Object.values(peersRef.current);
      if (pcs.length === 0) {
        updateGlobalMeshStats({
          uploadSpeed: 0,
          downloadSpeed: 0,
          latency: 0,
          connectedPeers: 0
        });
        return;
      }

      let totalBytesSent = 0;
      let totalBytesReceived = 0;
      let currentLatency = 0;
      let latencyCount = 0;

      for (const pc of pcs) {
        if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') continue;

        try {
          const stats = await pc.getStats();
          stats.forEach(report => {
            if (report.type === 'transport') {
              totalBytesSent += report.bytesSent || 0;
              totalBytesReceived += report.bytesReceived || 0;
            }
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              if (report.currentRoundTripTime) {
                currentLatency += (report.currentRoundTripTime * 1000);
                latencyCount++;
              }
            }
          });
        } catch (err) {
          console.error("Error getting stats:", err);
        }
      }

      const now = Date.now();
      const timeDiffSeconds = (now - prevBytesRef.current.timestamp) / 1000;

      let uploadMbps = 0;
      let downloadMbps = 0;

      if (timeDiffSeconds > 0) {
        const sentDiff = totalBytesSent - prevBytesRef.current.sent;
        const recDiff = totalBytesReceived - prevBytesRef.current.received;

        if (sentDiff > 0) uploadMbps = (sentDiff * 8) / 1000000 / timeDiffSeconds;
        if (recDiff > 0) downloadMbps = (recDiff * 8) / 1000000 / timeDiffSeconds;
      }

      prevBytesRef.current = {
        sent: totalBytesSent,
        received: totalBytesReceived,
        timestamp: now
      };

      const avgLatency = latencyCount > 0 ? Math.round(currentLatency / latencyCount) : 0;

      // If we are a client and have metrics, emit them to backend for advanced routing
      if (!isBroadcaster && socket && isConnected) {
         socket.emit('metrics-report', {
            streamId,
            latency: avgLatency,
            uploadMbps
         });
      }

      const newStats = {
        uploadSpeed: uploadMbps,
        downloadSpeed: downloadMbps,
        latency: avgLatency,
        connectedPeers: pcs.length
      };

      updateGlobalMeshStats(newStats);

    }, 2000);

    return () => clearInterval(interval);
  }, [socket, isConnected, isBroadcaster, streamId]);

  // Clean up all peer connections when the component unmounts
  useEffect(() => {
    return () => {
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
      setPeers({});
    };
  }, []);

  // Note: meshStats is no longer returned as state from this hook
  return { remoteStream, peers };
};
