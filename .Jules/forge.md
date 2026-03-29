## 2024-05-22 - Mesh Cycle Prevention

**Learning:** In a decentralized P2P mesh network using a tree topology, naive greedy parent selection can lead to cycles or "islands" where nodes are connected to each other but not to the broadcaster. Implementing a recursive (or iterative) path verification helper (`hasPathToBroadcaster`) ensures that every node in the mesh has a valid upstream path to the root.

**Action:** Always verify upstream connectivity when assigning or re-parenting nodes in a P2P tree to maintain stream integrity for all viewers.

## 2026-03-15 - Raid Notification & Validation

**Learning:** Raid functionality in a streaming platform requires cross-room synchronization. Validating target stream existence in the `activeStreams` Map prevents "dead-end" raids. Calculating viewer counts via `io.sockets.adapter.rooms.get(streamId)?.size` allows for meaningful system announcements in the target stream's chat, enhancing the social connectivity of the platform.

**Action:** Always validate target room state and notify the recipient when implementing features that move or redirect users between rooms or streams.

## 2025-05-15 - Mesh Healing and Broadcaster Promotion

**Learning:** In a dynamic P2P tree mesh, viewers may join before the broadcaster or high-capacity relayers. Proactive "mesh healing" is required to integrate these "orphan" nodes once capacity becomes available. Additionally, "broadcaster promotion" logic (severing existing parent bonds when a node becomes the root) is essential for maintaining a valid tree topology during retroactive authentication.

**Action:** Always implement a non-recursive healing mechanism (`healOrphans`) and explicit parent-severing logic for root nodes to ensure mesh resilience and topology integrity.
