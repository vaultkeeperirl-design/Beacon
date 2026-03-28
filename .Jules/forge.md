## 2024-05-22 - Mesh Cycle Prevention

**Learning:** In a decentralized P2P mesh network using a tree topology, naive greedy parent selection can lead to cycles or "islands" where nodes are connected to each other but not to the broadcaster. Implementing a recursive (or iterative) path verification helper (`hasPathToBroadcaster`) ensures that every node in the mesh has a valid upstream path to the root.

**Action:** Always verify upstream connectivity when assigning or re-parenting nodes in a P2P tree to maintain stream integrity for all viewers.

## 2026-03-15 - Raid Notification & Validation

**Learning:** Raid functionality in a streaming platform requires cross-room synchronization. Validating target stream existence in the `activeStreams` Map prevents "dead-end" raids. Calculating viewer counts via `io.sockets.adapter.rooms.get(streamId)?.size` allows for meaningful system announcements in the target stream's chat, enhancing the social connectivity of the platform.

**Action:** Always validate target room state and notify the recipient when implementing features that move or redirect users between rooms or streams.

## 2026-03-28 - Proactive P2P Mesh Healing & Promotion

**Learning:** Tree-based P2P topologies often suffer from "join-order orphans" where nodes join when no capacity is available and remain disconnected even after capacity (e.g., the broadcaster) appears. Implementing a recursion-guarded `healOrphans` mechanism triggered by broadcaster activation or relay bandwidth promotion ensures a resilient, self-balancing mesh. Severing existing parent relationships during broadcaster promotion is also critical to prevent cycles and maintain the broadcaster as the canonical root.

**Action:** Always implement proactive re-balancing triggers in stateful topologies to ensure eventual consistency and optimal resource utilization as node capabilities change dynamically.
