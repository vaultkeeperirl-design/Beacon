## 2024-05-22 - Mesh Cycle Prevention

**Learning:** In a decentralized P2P mesh network using a tree topology, naive greedy parent selection can lead to cycles or "islands" where nodes are connected to each other but not to the broadcaster. Implementing a recursive (or iterative) path verification helper (`hasPathToBroadcaster`) ensures that every node in the mesh has a valid upstream path to the root.

**Action:** Always verify upstream connectivity when assigning or re-parenting nodes in a P2P tree to maintain stream integrity for all viewers.

## 2026-03-15 - Raid Notification & Validation

**Learning:** Raid functionality in a streaming platform requires cross-room synchronization. Validating target stream existence in the `activeStreams` Map prevents "dead-end" raids. Calculating viewer counts via `io.sockets.adapter.rooms.get(streamId)?.size` allows for meaningful system announcements in the target stream's chat, enhancing the social connectivity of the platform.

**Action:** Always validate target room state and notify the recipient when implementing features that move or redirect users between rooms or streams.

## 2026-03-20 - Mesh Healing & Retroactive Host Activation

**Learning:** P2P mesh topologies are highly dynamic; proactive healing (`healOrphans`) triggered by new capacity (broadcaster joins or relayers increase bandwidth) significantly reduces the time nodes spend in an orphaned state. Additionally, supporting "retroactive host activation" during the authentication flow ensures that streamers who join their own room before logging in are correctly promoted to broadcasters without needing to refresh.

**Action:** Trigger mesh re-balancing on all capacity-increasing events and implement identity-based role promotion in the late-authentication flow.
