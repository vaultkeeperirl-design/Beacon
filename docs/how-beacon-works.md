# How Beacon Works: The Core Mechanics

Beacon isn't just another streaming platform; it's a fundamental shift in how live video is distributed and monetized. By replacing centralized server farms with a decentralized Peer-to-Peer (P2P) mesh network, Beacon empowers its community.

This document provides a deep dive into the core mechanics that make Beacon possible: the P2P Mesh, Mandatory Bandwidth Sharing, and the Credit Economy.

---

## 1. The P2P Mesh Network

At the heart of Beacon is a WebRTC-powered P2P mesh network. Instead of every viewer downloading the video stream directly from a central server (which is expensive and difficult to scale), viewers download from each other.

### Topology: The Tree Structure
Beacon implements a true P2P Mesh structured as a tree.
*   **The Broadcaster (Root):** The streamer is the source of the video feed.
*   **Relay Nodes (Branches):** Viewers who are watching the stream also act as relay nodes. They receive the video chunks and immediately forward them to other viewers.
*   **The Backend (Signaling Server):** While the video flows directly peer-to-peer, our Node.js signaling server acts as the "matchmaker." It assigns viewers to parent nodes based on real-time metrics like latency and upload bandwidth (Upload Mbps).

### Dynamic Re-parenting
The network is self-healing. If a parent node disconnects, or their connection quality drops significantly (e.g., upload < 0.5 Mbps or latency > 1000ms), the backend forcefully evicts their children and quickly re-parents them to healthier nodes in the mesh. This ensures a stable viewing experience even as users join and leave the stream.

---

## 2. Mandatory Bandwidth Sharing ("The Cost of Entry")

To ensure the network always has enough capacity to serve all viewers, Beacon enforces **Mandatory Bandwidth Sharing**.

### How It Works
When you open a stream on Beacon, your browser (or desktop client) automatically establishes WebRTC connections with other peers. You are not just a passive consumer; you are an active participant in the network.
*   Your download bandwidth is used to receive the stream.
*   A portion of your upload bandwidth is automatically utilized to relay that stream to other viewers downstream in the tree.

### Why Mandatory?
This eliminates the "freeloader" problem common in early P2P networks. As the number of viewers increases, the network's overall bandwidth capacity increases proportionally. The more popular a stream gets, the stronger the network becomes.

---

## 3. The Credit Economy

Bandwidth is valuable, and Beacon treats it as a currency. We believe that if you are contributing your upload bandwidth to run the platform, you should be compensated.

### Earning Credits
Viewers earn "Credits" for relaying data.
*   **Calculation:** The backend authoritatively tracks your contribution. During the `metrics-report` socket event, the server calculates your earnings based on your `uploadMbps` (e.g., `uploadMbps * 0.01` credits per interval).
*   **Security:** These calculations happen securely in a backend SQLite database transaction, preventing clients from spoofing their stats to earn free credits.

### The Ecosystem
The Credit system creates a sustainable loop:
1.  **Advertisers/Sponsors** inject capital into the platform.
2.  **Broadcasters** earn a share of this revenue for their content.
3.  **Relay Nodes (Viewers)** earn a share of this revenue (in the form of Credits) for providing the infrastructure (bandwidth) that delivers the content.

---

## 4. Collaborative Growth

Beacon is designed to foster community and collaboration through built-in features:

### Co-Streaming Revenue Splits
Hosts can invite guests to co-stream. Revenue generated during a co-stream is distributed automatically. The `/api/tip` backend endpoint, for example, securely splits tip amounts across all `streamSquads` members using database transactions. This encourages streamers to collaborate rather than compete for the same audience.

### Auto-Host and Raids
When a stream ends, the platform keeps the momentum going. Beacon automatically raids another active streamer on the network. If the host doesn't specify a target, the system randomly selects one. This provides continuous discovery for viewers and helps smaller streamers get noticed.

---

By combining cutting-edge WebRTC technology with a fair, incentivized economy, Beacon is building a streaming platform that truly belongs to its users.
