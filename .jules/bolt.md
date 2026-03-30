## 2025-05-14 - [Backend] O(1) Broadcaster Session Tracking
**Learning:** Iterating over all room participants ($O(N)$) to check for authenticated broadcaster sessions (e.g., in `isAnotherBroadcasterActive`) can become a bottleneck as viewers increase. This is especially true for large streams where a host disconnect triggers an $O(N)$ loop that could block the event loop.
**Action:** Use a dedicated `Map<streamId, Set<socketId>>` to track authenticated broadcaster sessions. This enables $O(1)$ lookup and state management for host sessions, supporting multi-tab/multi-session hosts efficiently while maintaining high performance regardless of viewer count.

## 2026-03-30 - [Backend] Atomic Credit Updates with RETURNING
**Learning:** High-frequency credit operations (metrics reports every 2s, tips, ads) traditionally require an UPDATE followed by a SELECT to retrieve the new balance for frontend synchronization. This doubles the database round-trips. SQLite 3.35.0+ supports the RETURNING clause, which allows performing both operations in a single atomic step.
**Action:** Use 'UPDATE ... RETURNING credits' and 'db.prepare(sql).get()' in better-sqlite3 to halve database latency for credit-intensive paths. Consolidated transaction results also allow for deduplicated websocket emissions, further reducing event loop pressure.
