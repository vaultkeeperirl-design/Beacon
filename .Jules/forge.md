## 2024-05-22 - Mesh Cycle Prevention

**Learning:** In a decentralized P2P mesh network using a tree topology, naive greedy parent selection can lead to cycles or "islands" where nodes are connected to each other but not to the broadcaster. Implementing a recursive (or iterative) path verification helper (`hasPathToBroadcaster`) ensures that every node in the mesh has a valid upstream path to the root.

**Action:** Always verify upstream connectivity when assigning or re-parenting nodes in a P2P tree to maintain stream integrity for all viewers.

## 2026-03-15 - Verified Socket Authentication Flagging

**Learning:** Relying on client-provided usernames in socket events (like `join-stream`) allows for identity spoofing. Implementing an internal `socket.isAuthenticated` flag, set only after a successful JWT-verified `register-auth` handshake, provides a robust way to secure host-only actions and credit distribution.

**Action:** Always use a server-verified authentication flag for sensitive socket operations and ensure integration tests perform the necessary auth handshake.
