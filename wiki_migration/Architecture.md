# BEACON ARCHITECTURE

## OVERVIEW
Beacon is a decentralized Peer-to-Peer (P2P) streaming platform. It removes the centralized server bottleneck by distributing the streaming load across all viewers (peers).

## CORE COMPONENTS

### 1. P2P Mesh Network (WebRTC)
The heart of Beacon.
- **Protocol:** WebRTC (Real-Time Communication).
- **Function:** Peers connect directly to exchange stream chunks.
- **Topology:** Unstructured mesh. Peers discover neighbors via the signaling server but exchange data directly.
- **Latency:** Optimized for sub-second latency where possible, but prioritized for stability.

### 2. Signaling Server (Node.js)
The matchmaker.
- **Role:** Facilitates the initial handshake (SDP offer/answer) and ICE candidate exchange.
- **Tech:** Node.js, Socket.IO.
- **State:** Ephemeral. It knows who is online but does not touch the video data.
- **Scalability:** Horizontal scaling via Redis adapter if needed (future).

### 3. Ingest & Transcoding (Local Node)
The source.
- **Role:** Captures the streamer's video, transcodes it into suitable chunks/formats.
- **Tech:** FFmpeg / Python / C.
- **Output:** WebRTC stream (VP8/VP9/H.264).

### 4. Bandwidth Accounting (The Ledger)
The economy.
- **Mechanism:** Peers track upload/download to/from other peers.
- **Incentive:** Uploading earns credits. Downloading consumes them.
- **Enforcement:** "Tit-for-tat" strategy. Peers choke connections to freeloaders.

## DATA FLOW

1. **Streamer** starts broadcast. Local node ingests and pushes to initial set of peers (Supernodes).
2. **Viewer** joins. Connects to Signaling Server to find peers watching the same stream.
3. **Signaling** introduces Viewer to potential neighbors.
4. **Viewer** establishes WebRTC connections.
5. **Peers** exchange video chunks.
6. **Viewer** becomes a relay, forwarding chunks to new viewers.

## SECURITY & PRIVACY
- **Encryption:** WebRTC is encrypted by default (DTLS/SRTP).
- **Identity:** Public keys / Crypto-wallets (Planned).
- **Anonymity:** Peers see IP addresses of neighbors (inherent to P2P). We are transparent about this. Use a VPN if you are paranoid.
