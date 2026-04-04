## 2024-05-22 - Mesh Cycle Prevention

**Learning:** In a decentralized P2P mesh network using a tree topology, naive greedy parent selection can lead to cycles or "islands" where nodes are connected to each other but not to the broadcaster. Implementing a recursive (or iterative) path verification helper (`hasPathToBroadcaster`) ensures that every node in the mesh has a valid upstream path to the root.

**Action:** Always verify upstream connectivity when assigning or re-parenting nodes in a P2P tree to maintain stream integrity for all viewers.

## 2026-03-15 - Raid Notification & Validation

**Learning:** Raid functionality in a streaming platform requires cross-room synchronization. Validating target stream existence in the `activeStreams` Map prevents "dead-end" raids. Calculating viewer counts via `io.sockets.adapter.rooms.get(streamId)?.size` allows for meaningful system announcements in the target stream's chat, enhancing the social connectivity of the platform.

**Action:** Always validate target room state and notify the recipient when implementing features that move or redirect users between rooms or streams.

## 2026-04-04 - Proactive Mesh Healing & Capacity-Aware Routing

**Learning:** Relying on passive re-parenting only during disconnects leaves "islands" in the P2P mesh when network conditions improve. Implementing  and triggering it when new upload capacity is reported (via ) allows the mesh to dynamically optimize itself. Furthermore, strictly requiring  for non-broadcaster parents prevents the formation of "dead" branches in the tree.

**Action:** Always trigger a mesh healing pass when potential parent capacity increases and enforce minimum capability requirements in parent selection logic to ensure data flow integrity.

## 2025-03-22 - Proactive Mesh Healing & Capacity-Aware Routing

**Learning:** Relying on passive re-parenting only during disconnects leaves "islands" in the P2P mesh when network conditions improve. Implementing `healOrphans` and triggering it when new upload capacity is reported (via `metrics-report`) allows the mesh to dynamically optimize itself. Furthermore, strictly requiring `uploadMbps > 0` for non-broadcaster parents prevents the formation of "dead" branches in the tree.

**Action:** Always trigger a mesh healing pass when potential parent capacity increases and enforce minimum capability requirements in parent selection logic to ensure data flow integrity.
