## 2024-05-22 - Mesh Cycle Prevention

**Learning:** In a decentralized P2P mesh network using a tree topology, naive greedy parent selection can lead to cycles or "islands" where nodes are connected to each other but not to the broadcaster. Implementing a recursive (or iterative) path verification helper (`hasPathToBroadcaster`) ensures that every node in the mesh has a valid upstream path to the root.

**Action:** Always verify upstream connectivity when assigning or re-parenting nodes in a P2P tree to maintain stream integrity for all viewers.

## 2026-03-15 - Raid Notification & Validation

**Learning:** Raid functionality in a streaming platform requires cross-room synchronization. Validating target stream existence in the `activeStreams` Map prevents "dead-end" raids. Calculating viewer counts via `io.sockets.adapter.rooms.get(streamId)?.size` allows for meaningful system announcements in the target stream's chat, enhancing the social connectivity of the platform.

**Action:** Always validate target room state and notify the recipient when implementing features that move or redirect users between rooms or streams.

## 2025-05-15 - Multi-Session Broadcaster Stability

**Learning:** In socket-based streaming, a single user (the broadcaster) may have multiple active sessions (e.g., multiple browser tabs). Relying on a simple disconnect event to terminate a stream leads to fragility. Implementing a reference-counting-like check (`isAnotherBroadcasterActive`) that verifies the presence of other authenticated sockets for the same identity in the room ensures the stream remains alive during partial disconnects or tab closures.

**Action:** Use authenticated identity checks and room-wide session validation instead of individual socket lifecycle events to manage global stream state.
