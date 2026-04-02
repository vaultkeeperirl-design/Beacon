## 2024-05-22 - Mesh Cycle Prevention

**Learning:** In a decentralized P2P mesh network using a tree topology, naive greedy parent selection can lead to cycles or "islands" where nodes are connected to each other but not to the broadcaster. Implementing a recursive (or iterative) path verification helper (`hasPathToBroadcaster`) ensures that every node in the mesh has a valid upstream path to the root.

**Action:** Always verify upstream connectivity when assigning or re-parenting nodes in a P2P tree to maintain stream integrity for all viewers.

## 2026-03-15 - Raid Notification & Validation

**Learning:** Raid functionality in a streaming platform requires cross-room synchronization. Validating target stream existence in the `activeStreams` Map prevents "dead-end" raids. Calculating viewer counts via `io.sockets.adapter.rooms.get(streamId)?.size` allows for meaningful system announcements in the target stream's chat, enhancing the social connectivity of the platform.

**Action:** Always validate target room state and notify the recipient when implementing features that move or redirect users between rooms or streams.

## 2026-03-20 - Mesh Healing & Host Promotion

**Learning:** In a dynamic P2P mesh, nodes can become orphaned due to sudden disconnects or "islands" forming when a parent loses its connection to the root. Implementing a proactive `healOrphans` function that scans the topology and re-parents disconnected nodes maintains tree integrity. Furthermore, supporting "Retroactive Host Promotion" allows a user who joins as a guest to be promoted to the root of the mesh upon authentication without disrupting existing downstream children.

**Action:** Trigger mesh healing on key lifecycle events (disconnects, capacity increases, and host arrivals) and ensure host promotion logic detaches the node from any temporary parents to prevent root-level cycles.
