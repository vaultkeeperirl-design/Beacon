## 2025-05-14 - [Backend] O(1) Broadcaster Session Tracking
**Learning:** Iterating over all room participants ($O(N)$) to check for authenticated broadcaster sessions (e.g., in `isAnotherBroadcasterActive`) can become a bottleneck as viewers increase. This is especially true for large streams where a host disconnect triggers an $O(N)$ loop that could block the event loop.
**Action:** Use a dedicated `Map<streamId, Set<socketId>>` to track authenticated broadcaster sessions. This enables $O(1)$ lookup and state management for host sessions, supporting multi-tab/multi-session hosts efficiently while maintaining high performance regardless of viewer count.

## 2025-05-15 - [Backend] Atomic DB Updates with RETURNING
**Learning:** Performing an `UPDATE` followed by a `SELECT` (e.g., for credit balances) doubles database round-trips and introduces potential race conditions if not wrapped in a transaction.
**Action:** Use the SQLite `RETURNING` clause (available in 3.35.0+) to retrieve updated values atomically within the `UPDATE` statement itself. This halves the number of database operations for high-frequency tasks like credit distribution and metrics reporting, improving both performance and data consistency.
