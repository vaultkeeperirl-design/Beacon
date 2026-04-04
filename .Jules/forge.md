## 2024-05-22 - Mesh Cycle Prevention

**Learning:** In a decentralized P2P mesh network using a tree topology, naive greedy parent selection can lead to cycles or "islands" where nodes are connected to each other but not to the broadcaster. Implementing a recursive (or iterative) path verification helper (`hasPathToBroadcaster`) ensures that every node in the mesh has a valid upstream path to the root.

**Action:** Always verify upstream connectivity when assigning or re-parenting nodes in a P2P tree to maintain stream integrity for all viewers.

## 2026-03-15 - Raid Notification & Validation

**Learning:** Raid functionality in a streaming platform requires cross-room synchronization. Validating target stream existence in the `activeStreams` Map prevents "dead-end" raids. Calculating viewer counts via `io.sockets.adapter.rooms.get(streamId)?.size` allows for meaningful system announcements in the target stream's chat, enhancing the social connectivity of the platform.

**Action:** Always validate target room state and notify the recipient when implementing features that move or redirect users between rooms or streams.

## 2026-03-20 - Proactive Mesh Healing & Promotion

**Learning:** In a dynamic P2P mesh, nodes often join before a broadcaster or lose their upstream path due to peer churn (creating "islands"). Implementing a `healOrphans` mechanism that is triggered by broadcaster promotion, node departures, and bandwidth availability (0 to >0 Mbps) ensures the topology remains optimized. Using a `skipHealing` flag prevents infinite recursion during these recursive re-parenting cycles.

**Action:** Always trigger proactive healing when the mesh's capacity or root status changes, and use recursion guards to maintain stability.
