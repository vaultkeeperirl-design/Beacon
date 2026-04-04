## 2025-05-14 - [Backend] O(1) Broadcaster Session Tracking
**Learning:** Iterating over all room participants ($O(N)$) to check for authenticated broadcaster sessions (e.g., in `isAnotherBroadcasterActive`) can become a bottleneck as viewers increase. This is especially true for large streams where a host disconnect triggers an $O(N)$ loop that could block the event loop.
**Action:** Use a dedicated `Map<streamId, Set<socketId>>` to track authenticated broadcaster sessions. This enables $O(1)$ lookup and state management for host sessions, supporting multi-tab/multi-session hosts efficiently while maintaining high performance regardless of viewer count.

## 2025-05-15 - [Backend] Atomic Update with RETURNING Clause
**Learning:** Redundant database round-trips for credit updates (e.g., `UPDATE` followed by `SELECT`) can significantly increase latency and CPU overhead in high-frequency operations like ad revenue distribution or tips. SQLite (3.35.0+) supports the `RETURNING` clause, which allows fetching the updated row state in a single atomic operation.
**Action:** Use `UPDATE ... RETURNING column` combined with `better-sqlite3`'s `.get()` method to retrieve updated values immediately. This reduces database overhead by 50% for balance updates and ensures atomicity without manual transaction blocks for simple state checks.
