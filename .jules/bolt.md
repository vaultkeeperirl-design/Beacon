## 2025-05-14 - [Backend] O(1) Broadcaster Session Tracking
**Learning:** Iterating over all room participants ($O(N)$) to check for authenticated broadcaster sessions (e.g., in `isAnotherBroadcasterActive`) can become a bottleneck as viewers increase. This is especially true for large streams where a host disconnect triggers an $O(N)$ loop that could block the event loop.
**Action:** Use a dedicated `Map<streamId, Set<socketId>>` to track authenticated broadcaster sessions. This enables $O(1)$ lookup and state management for host sessions, supporting multi-tab/multi-session hosts efficiently while maintaining high performance regardless of viewer count.

## 2025-05-14 - [Backend] SQLite RETURNING for Atomic Updates
**Learning:** High-frequency credit operations (e.g., metrics-report every 2s) that use an `UPDATE` followed by a `SELECT` to fetch the new state double the database round-trips and increase latency.
**Action:** Use the `RETURNING` clause (e.g., `UPDATE ... RETURNING credits`) to perform the update and fetch the new balance in a single atomic operation. This reduces database overhead and prevents potential race conditions between the update and the read.
