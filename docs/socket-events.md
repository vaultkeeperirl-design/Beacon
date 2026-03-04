# Socket.IO Event Reference

This document outlines the WebSocket events handled by the Beacon backend server (`backend/server.js`) via Socket.IO. These events manage real-time interactions, WebRTC signaling, P2P mesh topology, and the bandwidth economy.

## Connection & Rooms

### `join-stream`
Sent by a client to join a specific stream's room.
- **Payload:** `{ streamId: string }`
- **Server Actions:**
  - Adds the socket to the Socket.IO room named `streamId`.
  - Sends a `room-users-update` to all users in the room with the new user count.
  - If the stream is active, sends `stream-info-updated` to the new user.
  - If a poll is active, sends `poll-started` to the new user.

### `leave-stream`
Sent by a client to leave their current stream's room.
- **Payload:** None.
- **Server Actions:**
  - Removes the socket from its current room.
  - Sends a `room-users-update` to remaining users.
  - If the socket was part of the mesh network, it removes the node and triggers reparenting if necessary.

## Real-Time Interaction

### `chat-message`
Broadcasts a chat message to the stream's room.
- **Payload:** `{ streamId: string, user: string, text: string, color: string }`
- **Server Actions:**
  - Validates the message length (max 500 characters).
  - Broadcasts the message to all users in the `streamId` room.

### `create-poll`
Creates a new poll for the stream. **Host only.**
- **Payload:** `{ streamId: string, question: string, options: string[], duration?: number }`
- **Server Actions:**
  - Validates the host, question length (max 200), and options (min 2, max 5).
  - Emits `poll-started` to all users in the room.

### `vote-poll`
Submits a vote for an active poll.
- **Payload:** `{ streamId: string, pollId: number, optionIndex: number }`
- **Server Actions:**
  - Validates the poll and option index.
  - Ensures a user can only vote once.
  - Emits `poll-update` to all users in the room.

### `end-poll`
Ends an active poll early. **Host only.**
- **Payload:** `{ streamId: string }`
- **Server Actions:**
  - Clears the poll and emits `poll-ended` to all users in the room.

### `update-stream-info`
Updates the stream's title and tags. **Host only.**
- **Payload:** `{ streamId: string, title: string, tags: string }`
- **Server Actions:**
  - Updates the active stream metadata.
  - Emits `stream-info-updated` to all users in the room.

## P2P Mesh & Economy

### `metrics-report`
Reports a node's bandwidth and latency metrics. This event is crucial for the Beacon economy and mesh health.
- **Payload:** `{ streamId: string, latency: number, uploadMbps: number }`
- **Server Actions:**
  - Rate limits the event to 1 per second per user.
  - Updates the node's metrics in the mesh topology.
  - If the user is authenticated, securely calculates and credits their bandwidth contribution.
  - Checks if the node is "poor performing" (high latency or low upload). If so, it forcefully evicts its children and triggers reparenting.

### `update-squad`
Updates the stream's revenue split squad. **Host only.**
- **Payload:** `{ streamId: string, squad: { name: string, split: number }[] }`
- **Server Actions:**
  - Validates that the total split percentage equals 100%.
  - Updates the squad details in memory.

## WebRTC Signaling

These events facilitate the direct peer-to-peer connections between users, bypassing the central server.

### `offer`
Sends a WebRTC offer to a specific target peer.
- **Payload:** `{ target: string, [other WebRTC data] }`
- **Server Actions:** Forwards the payload to the target socket, adding `sender: socket.id`.

### `answer`
Sends a WebRTC answer in response to an offer.
- **Payload:** `{ target: string, [other WebRTC data] }`
- **Server Actions:** Forwards the payload to the target socket, adding `sender: socket.id`.

### `ice-candidate`
Sends a WebRTC ICE candidate to a specific target peer.
- **Payload:** `{ target: string, candidate: object }`
- **Server Actions:** Forwards the candidate to the target socket, adding `sender: socket.id`.

### `signal`
A generic signaling fallback event (sometimes used by custom hooks).
- **Payload:** `{ to: string, signal: object }`
- **Server Actions:** Forwards the signal to the target socket.

## System Events

### `disconnect`
Fired automatically when a socket drops the connection.
- **Server Actions:**
  - If the socket was a host, ends the stream, cleans up polls/squads, and emits `stream-ended` (potentially with an auto-raid redirect).
  - Removes the node from the P2P mesh network.
  - Updates room user counts.
