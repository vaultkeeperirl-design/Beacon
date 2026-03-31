## 2024-05-22 - Mesh Cycle Prevention

**Learning:** In a decentralized P2P mesh network using a tree topology, naive greedy parent selection can lead to cycles or "islands" where nodes are connected to each other but not to the broadcaster. Implementing a recursive (or iterative) path verification helper (`hasPathToBroadcaster`) ensures that every node in the mesh has a valid upstream path to the root.

**Action:** Always verify upstream connectivity when assigning or re-parenting nodes in a P2P tree to maintain stream integrity for all viewers.

## 2026-03-15 - Raid Notification & Validation

**Learning:** Raid functionality in a streaming platform requires cross-room synchronization. Validating target stream existence in the `activeStreams` Map prevents "dead-end" raids. Calculating viewer counts via `io.sockets.adapter.rooms.get(streamId)?.size` allows for meaningful system announcements in the target stream's chat, enhancing the social connectivity of the platform.

**Action:** Always validate target room state and notify the recipient when implementing features that move or redirect users between rooms or streams.

## 2024-03-31 - Proactive Mesh Healing & Retroactive Host Activation

**Learning:** P2P meshes in a browser environment are highly dynamic. Relying on join-order alone leads to sub-optimal topologies where viewers remain orphaned even when capacity becomes available. Implementing a `healOrphans` mechanism triggered by broadcaster joins or relay bandwidth transitions ensures the mesh self-balances. Furthermore, retroactive host promotion in the authentication handler allows users who join as guests to upgrade their session to a broadcaster without a room re-join.

**Action:** Trigger mesh re-balancing whenever a potential parent's state changes (joins, bandwidth increase, or promotion) to ensure maximum connectivity.
