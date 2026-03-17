## 2024-05-22 - Mesh Cycle Prevention

**Learning:** In a decentralized P2P mesh network using a tree topology, naive greedy parent selection can lead to cycles or "islands" where nodes are connected to each other but not to the broadcaster. Implementing a recursive (or iterative) path verification helper (`hasPathToBroadcaster`) ensures that every node in the mesh has a valid upstream path to the root.

**Action:** Always verify upstream connectivity when assigning or re-parenting nodes in a P2P tree to maintain stream integrity for all viewers.

## 2026-03-15 - Raid Notification & Validation

**Learning:** Raid functionality in a streaming platform requires cross-room synchronization. Validating target stream existence in the `activeStreams` Map prevents "dead-end" raids. Calculating viewer counts via `io.sockets.adapter.rooms.get(streamId)?.size` allows for meaningful system announcements in the target stream's chat, enhancing the social connectivity of the platform.

**Action:** Always validate target room state and notify the recipient when implementing features that move or redirect users between rooms or streams.

## 2026-03-17 - Broadcaster Multi-Session Stability

**Learning:** In a real-time streaming platform, a host may have multiple sessions active (e.g., multiple tabs or devices). Relying on a single socket disconnect to terminate a stream leads to accidental outages. Implementing an identity-aware session check (`isAnotherBroadcasterActive`) using the `isAuthenticated` flag and `username` ensures that a stream only ends when the *last* active authenticated broadcaster session for that `streamId` is closed.

**Action:** Always use authenticated identity-based session counting instead of simple socket counts when managing the lifecycle of global resources like active streams.
