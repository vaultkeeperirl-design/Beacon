## 2025-05-14 - [Backend] O(1) Broadcaster Session Tracking
**Learning:** Iterating over all room participants ($O(N)$) to check for authenticated broadcaster sessions (e.g., in `isAnotherBroadcasterActive`) can become a bottleneck as viewers increase. This is especially true for large streams where a host disconnect triggers an $O(N)$ loop that could block the event loop.
**Action:** Use a dedicated `Map<streamId, Set<socketId>>` to track authenticated broadcaster sessions. This enables $O(1)$ lookup and state management for host sessions, supporting multi-tab/multi-session hosts efficiently while maintaining high performance regardless of viewer count.

## 2025-05-15 - [Backend] Atomic Credit Updates with RETURNING
**Learning:** High-frequency database operations (like `metrics-report` every 2s) that require fetching the updated state (e.g., new balance) can be halved in cost by using the SQLite `RETURNING` clause (supported since 3.35.0). This converts a 2-step process (Update then Select) into a single atomic operation.
**Action:** Replace `stmt.run()` followed by a separate `SELECT` with `stmt.get()` on a query using `RETURNING`. This reduces database round-trips and simplifies transaction logic for high-throughput paths.
