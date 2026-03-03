## 2024-05-23 - [Frontend] Large Component Subscription to High Frequency Data
**Learning:** Large layout components like `Navbar` should not subscribe directly to high-frequency data contexts (like real-time P2P stats updating every 1s) if they only use a tiny part of it (e.g., a credit balance badge). This causes the entire heavy component to re-render unnecessarily.
**Action:** Extract the data-dependent part into a smaller, isolated sub-component (e.g., `WalletBalance`) that consumes the context, keeping the parent component stable. Use `React.memo` on the parent if needed.

## 2025-01-24 - [React] Shielding Layout from High-Frequency Pulse States
**Learning:** Components that don't depend on high-frequency state (like a 1s ad-break timer or P2P stats) still re-render if their parent does, even if they are logically "static" during that phase.
**Action:** Use `React.memo` to wrap complex sub-components in views with active timers (e.g., `Broadcast Studio`). This prevents the entire UI tree from reconciling every second, significantly reducing CPU usage during live sessions.

## 2025-05-24 - [React] Isolating High-Frequency Leaf State
**Learning:** Even with `React.memo`, if a high-frequency state (like a 1s timer) lives in a large parent component, the entire parent layout reconciles every second. `React.memo` only helps children.
**Action:** Isolate high-frequency "pulse" states into their own leaf components (e.g., `AdBreakButton`). This keeps the reconciliation scope limited to the smallest possible part of the DOM tree.

## 2025-02-28 - [React] Decoupling State from Custom Hooks used in Layouts
**Learning:** Custom hooks that encapsulate logic (like WebRTC connections in `useP2PStream`) often manage internal state (like real-time stats) and return it. If a large layout component uses that hook *just for the connection*, the internal state updates (e.g., every 2s) will force the entire layout component to re-render, causing massive DOM thrashing.
**Action:** Remove high-frequency state from the custom hook's returned values. Instead, have the hook update a global store or context, and create small, isolated leaf components (like `StreamHealthIndicator`) that subscribe to that context directly. This shields the large layout from the high-frequency pulse.

## 2025-06-15 - [Backend] High-Frequency SQL and Socket Iteration
**Learning:** Re-preparing SQL statements (`db.prepare()`) inside high-frequency socket handlers (like 2s metrics polls) causes unnecessary CPU load and memory churn. Additionally, iterating over all connected sockets ($O(N)$) to find specific users is extremely inefficient as the user base grows.
**Action:** Always use pre-prepared module-level SQL statements. Leverage Socket.io's room pattern (e.g., `io.to('user:${username}')`) for targeted broadcasts to achieve $O(1)$ lookup instead of manual $O(N)$ loops.

## 2025-06-25 - [Backend] Atomic Conditional Updates vs. RETURNING
**Learning:** Merging conditional checks into an `UPDATE` statement (e.g., `UPDATE ... WHERE credits >= ?`) is ~33% faster than separate `SELECT` and `UPDATE` calls, even within a transaction. Surprisingly, in this Node 22/better-sqlite3 environment, using the `RETURNING` clause was slightly slower than separate statements for simple row updates.
**Action:** Use atomic conditional `UPDATE` statements to reduce DB roundtrips. Verify success using `info.changes`. Avoid `RETURNING` for high-frequency simple updates if performance is critical; benchmark first.