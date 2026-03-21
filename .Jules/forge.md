## 2024-05-22 - Mesh Cycle Prevention

**Learning:** In a decentralized P2P mesh network using a tree topology, naive greedy parent selection can lead to cycles or "islands" where nodes are connected to each other but not to the broadcaster. Implementing a recursive (or iterative) path verification helper (`hasPathToBroadcaster`) ensures that every node in the mesh has a valid upstream path to the root.

**Action:** Always verify upstream connectivity when assigning or re-parenting nodes in a P2P tree to maintain stream integrity for all viewers.

## 2026-03-15 - Raid Notification & Validation

**Learning:** Raid functionality in a streaming platform requires cross-room synchronization. Validating target stream existence in the `activeStreams` Map prevents "dead-end" raids. Calculating viewer counts via `io.sockets.adapter.rooms.get(streamId)?.size` allows for meaningful system announcements in the target stream's chat, enhancing the social connectivity of the platform.

**Action:** Always validate target room state and notify the recipient when implementing features that move or redirect users between rooms or streams.

## 2026-05-12 - Scalable Broadcaster Session Tracking

**Learning:** For real-time broadcaster presence checks during high-frequency events (like room transitions, authentication, or disconnections), iterating through all sockets in a room (O(N)) is inefficient and scales poorly with viewer count. Implementing a dedicated `broadcasterSessions` Map (`Map<streamId, Set<socketId>>`) allows for O(1) lookups. This approach also naturally handles multi-session scenarios (e.g., one broadcaster with multiple tabs) by tracking unique socket IDs per stream.

**Action:** Prefer Map-based session tracking over room-wide socket iteration for frequent identity or role verification to maintain server performance as the application scales.
