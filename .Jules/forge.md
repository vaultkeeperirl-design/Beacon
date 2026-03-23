## 2024-05-22 - Mesh Cycle Prevention

**Learning:** In a decentralized P2P mesh network using a tree topology, naive greedy parent selection can lead to cycles or "islands" where nodes are connected to each other but not to the broadcaster. Implementing a recursive (or iterative) path verification helper (`hasPathToBroadcaster`) ensures that every node in the mesh has a valid upstream path to the root.

**Action:** Always verify upstream connectivity when assigning or re-parenting nodes in a P2P tree to maintain stream integrity for all viewers.

## 2026-03-15 - Raid Notification & Validation

**Learning:** Raid functionality in a streaming platform requires cross-room synchronization. Validating target stream existence in the `activeStreams` Map prevents "dead-end" raids. Calculating viewer counts via `io.sockets.adapter.rooms.get(streamId)?.size` allows for meaningful system announcements in the target stream's chat, enhancing the social connectivity of the platform.

**Action:** Always validate target room state and notify the recipient when implementing features that move or redirect users between rooms or streams.

## 2025-05-14 - P2P Mesh Healing & Host Promotion

**Learning:** In a dynamic P2P mesh network, nodes may join before the broadcaster or before high-quality relays are available. Implementing a "healing" mechanism (`healOrphans`) that periodically or event-triggeredly scans for parentless nodes ensures the topology eventually converges to a connected state. Additionally, handling node "promotion" (e.g., a viewer becoming a host after authenticating) requires explicit cleanup of existing parent/child relationships to prevent cycles and maintain tree integrity.

**Action:** Always trigger mesh healing when new potential parents join or improve their metrics, and ensure promotion logic severs old topology links before establishing new ones.
