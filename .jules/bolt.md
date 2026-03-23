## 2025-05-14 - [Backend] O(1) Broadcaster Session Tracking
**Learning:** Iterating over all room participants ($O(N)$) to check for authenticated broadcaster sessions (e.g., in `isAnotherBroadcasterActive`) can become a bottleneck as viewers increase. This is especially true for large streams where a host disconnect triggers an $O(N)$ loop that could block the event loop.
**Action:** Use a dedicated `Map<streamId, Set<socketId>>` to track authenticated broadcaster sessions. This enables $O(1)$ lookup and state management for host sessions, supporting multi-tab/multi-session hosts efficiently while maintaining high performance regardless of viewer count.

## 2025-05-24 - [Backend] Halving DB Calls with RETURNING
**Learning:** High-frequency operations like credit distribution for metrics (every 2s) or revenue sharing (ad/tips) often require an `UPDATE` followed by a `SELECT` to get the new balance. This creates unnecessary database round-trips and event loop latency.
**Action:** Use the SQLite `RETURNING` clause (supported in 3.35.0+) to combine the update and fetch into a single atomic operation. In `better-sqlite3`, this is achieved by using `.get()` on the `UPDATE` statement. This halves the DB workload for the most frequent credit-related paths.
