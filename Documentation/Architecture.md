# Architecture Overview

**Beacon** is built as a decentralized application (dApp) leveraging peer-to-peer (P2P) technology for video streaming. This architecture reduces reliance on centralized servers and empowers the community.

## High-Level Components

The system consists of three main components:

1.  **Frontend (React Application)**
    -   **Tech Stack**: React, Vite, Tailwind CSS.
    -   **Role**: User interface for browsing streams, watching content, managing wallet, and broadcasting. It handles WebRTC connections and P2P logic in the browser.
    -   **Location**: `frontend/`

2.  **Signaling Server (Backend)**
    -   **Tech Stack**: Node.js, Express, Socket.IO.
    -   **Role**: Facilitates the initial connection between peers (Signaling). It helps peers exchange SDP (Session Description Protocol) offers and answers and ICE candidates. Once connected, media flows directly between peers, bypassing the server.
    -   **Location**: `backend/`

3.  **P2P Mesh Network**
    -   **Tech Stack**: WebRTC.
    -   **Role**: Transmits video and audio data directly between users. Every viewer acts as a node, relaying data to others to distribute bandwidth load.

## Data Flow

1.  **Discovery**: A user (Viewer) connects to the Signaling Server via WebSocket.
2.  **Signaling**: The Viewer requests to join a stream. The Signaling Server helps them find the Broadcaster or another Relay Node.
3.  **Connection**: WebRTC handshake (Offer/Answer) occurs via the Signaling Server.
4.  **Streaming**: Video chunks are transmitted directly between peers (Broadcaster -> Relay -> Viewer) using WebRTC Data Channels or Media Streams.

## Mandatory Bandwidth Sharing

A core architectural principle is **Mandatory Bandwidth Sharing**.
-   When a user watches a stream, they automatically become a potential relay node.
-   Their upload bandwidth is utilized to serve the stream to other viewers.
-   This creates a scalable mesh where capacity grows with the user base.

## Directory Structure

-   **frontend/**: Contains the source code for the client-side application.
    -   `src/components`: Reusable UI components.
    -   `src/pages`: Route components (Home, Watch, Broadcast, etc.).
    -   `src/context`: Global state management (P2PContext).
    -   `src/hooks`: Custom hooks for P2P logic and Socket.IO.
-   **backend/**: Contains the signaling server code.
    -   `server.js`: Main entry point handling Socket.IO events.
-   **Documentation/**: Project documentation (you are here).

For more details on specific features, see [Features](Features.md).
