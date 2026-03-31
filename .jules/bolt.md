## 2025-05-14 - [Backend] O(1) Broadcaster Session Tracking
**Learning:** Iterating over all room participants ($O(N)$) to check for authenticated broadcaster sessions (e.g., in `isAnotherBroadcasterActive`) can become a bottleneck as viewers increase. This is especially true for large streams where a host disconnect triggers an $O(N)$ loop that could block the event loop.
**Action:** Use a dedicated `Map<streamId, Set<socketId>>` to track authenticated broadcaster sessions. This enables $O(1)$ lookup and state management for host sessions, supporting multi-tab/multi-session hosts efficiently while maintaining high performance regardless of viewer count.

## 2026-03-31 - [Backend] Database Optimization with RETURNING Clause
**Learning:** High-frequency credit operations (e.g., in `metrics-report` every 2s) were previously performing an `UPDATE` followed by a `SELECT` to retrieve the new balance. This double-trip pattern increases database latency and CPU overhead as the swarm scales.
**Action:** Use the SQLite `RETURNING` clause (supported in `better-sqlite3`) to perform the update and retrieval in a single atomic operation. This pattern effectively halves the database round-trips for high-throughput tasks like metrics reporting and revenue distribution.
