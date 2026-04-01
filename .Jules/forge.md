## 2024-05-22 - Mesh Cycle Prevention

**Learning:** In a decentralized P2P mesh network using a tree topology, naive greedy parent selection can lead to cycles or "islands" where nodes are connected to each other but not to the broadcaster. Implementing a recursive (or iterative) path verification helper (`hasPathToBroadcaster`) ensures that every node in the mesh has a valid upstream path to the root.

**Action:** Always verify upstream connectivity when assigning or re-parenting nodes in a P2P tree to maintain stream integrity for all viewers.

## 2026-03-15 - Raid Notification & Validation

**Learning:** Raid functionality in a streaming platform requires cross-room synchronization. Validating target stream existence in the `activeStreams` Map prevents "dead-end" raids. Calculating viewer counts via `io.sockets.adapter.rooms.get(streamId)?.size` allows for meaningful system announcements in the target stream's chat, enhancing the social connectivity of the platform.

**Action:** Always validate target room state and notify the recipient when implementing features that move or redirect users between rooms or streams.

## 2026-03-20 - Proactive Mesh Healing & Retroactive Host Promotion

**Learning:** In a dynamic P2P topology, viewers often join before the broadcaster, creating a "cold start" problem where nodes remain orphans. Implementing a `healOrphans` function triggered by the broadcaster's arrival ensures immediate connectivity. Furthermore, users may join their own room as guests before authenticating; retroactive promotion in the `register-auth` handler ensures they are correctly identified as the root node in the mesh.

**Action:** Always implement a "healing" trigger when the root node of a tree topology joins late to integrate existing orphaned children.
