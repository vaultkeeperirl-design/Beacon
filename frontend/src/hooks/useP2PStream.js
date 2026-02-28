import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './useSocket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

export const useP2PStream = (isBroadcaster = false, localStream = null, streamId = null) => {
  const { socket, isConnected } = useSocket();
  const [remoteStream, setRemoteStream] = useState(null);
  const [peers, setPeers] = useState({}); // Keep track of peer connections (mainly for broadcaster)

  // Use a ref to store peers so we can access them inside socket event callbacks without stale closures
  const peersRef = useRef({});

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

  // Clean up all peer connections when the component unmounts
  useEffect(() => {
    return () => {
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
      setPeers({});
    };
  }, []);

  return { remoteStream, peers };
};
