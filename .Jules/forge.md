## 2024-05-22 - Mesh Cycle Prevention

**Learning:** In a decentralized P2P mesh network using a tree topology, naive greedy parent selection can lead to cycles or "islands" where nodes are connected to each other but not to the broadcaster. Implementing a recursive (or iterative) path verification helper (`hasPathToBroadcaster`) ensures that every node in the mesh has a valid upstream path to the root.

**Action:** Always verify upstream connectivity when assigning or re-parenting nodes in a P2P tree to maintain stream integrity for all viewers.

## 2026-03-15 - Raid Notification & Validation

**Learning:** Raid functionality in a streaming platform requires cross-room synchronization. Validating target stream existence in the `activeStreams` Map prevents "dead-end" raids. Calculating viewer counts via `io.sockets.adapter.rooms.get(streamId)?.size` allows for meaningful system announcements in the target stream's chat, enhancing the social connectivity of the platform.

**Action:** Always validate target room state and notify the recipient when implementing features that move or redirect users between rooms or streams.

## 2024-05-23 - Proactive Mesh Healing & Promotion

**Learning:** In a dynamic P2P mesh, nodes often join before the broadcaster is active or before they have sufficient bandwidth. Implementing a `healOrphans` mechanism that is triggered by broadcaster arrival, node removal, or bandwidth increases (0 to positive) ensures the mesh remains connected and optimized. Additionally, retroactive host promotion (promoting a user to broadcaster if they authenticate while already in their stream room) prevents mesh role desync during state transitions.

**Action:** Use a `triggerHeal` parameter in mesh assignment functions to prevent recursion, and always trigger healing when new capacity (broadcaster or relay bandwidth) enters the network.
