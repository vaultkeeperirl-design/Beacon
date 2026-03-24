## 2024-05-22 - Mesh Cycle Prevention

**Learning:** In a decentralized P2P mesh network using a tree topology, naive greedy parent selection can lead to cycles or "islands" where nodes are connected to each other but not to the broadcaster. Implementing a recursive (or iterative) path verification helper (`hasPathToBroadcaster`) ensures that every node in the mesh has a valid upstream path to the root.

**Action:** Always verify upstream connectivity when assigning or re-parenting nodes in a P2P tree to maintain stream integrity for all viewers.

## 2026-03-15 - Raid Notification & Validation

**Learning:** Raid functionality in a streaming platform requires cross-room synchronization. Validating target stream existence in the `activeStreams` Map prevents "dead-end" raids. Calculating viewer counts via `io.sockets.adapter.rooms.get(streamId)?.size` allows for meaningful system announcements in the target stream's chat, enhancing the social connectivity of the platform.

**Action:** Always validate target room state and notify the recipient when implementing features that move or redirect users between rooms or streams.

## 2026-03-24 - P2P Mesh Healing & Retroactive Activation

**Learning:** Decentralized P2P meshes are sensitive to join order. Implementing a `healOrphans` mechanism that re-evaluates parentless nodes whenever a new potential parent (broadcaster or high-bandwidth relay) appears ensures the tree remains connected. Additionally, "retroactive host activation" in the authentication handler prevents state desync if a streamer joins their own room before completing the handshake.

**Action:** Always trigger mesh re-evaluation (`healOrphans`) on broadcaster promotion or relay bandwidth updates to maintain optimal P2P topology.
