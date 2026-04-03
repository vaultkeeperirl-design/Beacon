## 2025-05-14 - [Backend] O(1) Broadcaster Session Tracking
**Learning:** Iterating over all room participants ($O(N)$) to check for authenticated broadcaster sessions (e.g., in `isAnotherBroadcasterActive`) can become a bottleneck as viewers increase. This is especially true for large streams where a host disconnect triggers an $O(N)$ loop that could block the event loop.
**Action:** Use a dedicated `Map<streamId, Set<socketId>>` to track authenticated broadcaster sessions. This enables $O(1)$ lookup and state management for host sessions, supporting multi-tab/multi-session hosts efficiently while maintaining high performance regardless of viewer count.

## 2025-05-15 - [Backend] Consolidating Balance Updates with RETURNING
**Learning:** Frequent "UPDATE then SELECT" patterns for state updates (e.g., wallet balance changes) result in redundant database round-trips. This is particularly costly for high-frequency events like `metrics-report` or mass credit distributions.
**Action:** Consolidate these operations into a single atomic database call using the SQLite `RETURNING` clause. Execute via `better-sqlite3`'s `.get()` method to retrieve the updated record directly. This effectively halves the database execution overhead for these critical paths.
