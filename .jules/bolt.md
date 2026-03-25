## 2025-05-14 - [Backend] O(1) Broadcaster Session Tracking
**Learning:** Iterating over all room participants ($O(N)$) to check for authenticated broadcaster sessions (e.g., in `isAnotherBroadcasterActive`) can become a bottleneck as viewers increase. This is especially true for large streams where a host disconnect triggers an $O(N)$ loop that could block the event loop.
**Action:** Use a dedicated `Map<streamId, Set<socketId>>` to track authenticated broadcaster sessions. This enables $O(1)$ lookup and state management for host sessions, supporting multi-tab/multi-session hosts efficiently while maintaining high performance regardless of viewer count.

## 2025-05-15 - [Backend] Atomic Database Updates with RETURNING
**Learning:** Performing an `UPDATE` followed by a `SELECT` (e.g., for credit balances) doubles the database round-trips for high-frequency operations like metrics reporting and tipping. In SQLite 3.35.0+, the `RETURNING` clause allows these to be combined into a single atomic operation.
**Action:** Use `UPDATE ... RETURNING <columns>` to fetch updated state immediately after a write. This pattern reduces latency and ensures the returned state is perfectly synchronized with the update within the same statement execution.
