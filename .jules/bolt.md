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

## 2025-07-05 - [Backend] O(N) Greedy Selection vs. O(N log N) Sorting
**Learning:** Using `Array.sort()` for selecting the best node in a high-frequency tracking Map (like the P2P Mesh) is inefficient. It forces O(N log N) complexity and creates O(N) intermediate objects for every join/leave event, leading to CPU spikes and GC pressure as the viewer count grows.
**Action:** Implement a single-pass O(N) greedy selection algorithm that tracks the 'best' candidate using primitive variables. This avoids all intermediate allocations and ensures the tracker scales linearly with the number of concurrent viewers.

## 2025-07-15 - [React] Preventing Redundant Re-renders with State Identity
**Learning:** Even when using a high-frequency context provider, if the stats object returned by a hook (like `useRealP2PStats`) is a new object every second, every subscriber will re-render regardless of whether the values inside the object have changed. React only skips re-renders if the state reference is identical.
**Action:** Implement shallow equality checks inside the `setStats` functional updates. If the new values match the current state, return the previous state reference (`prev`) instead of a new object. This stops the re-render chain across all context subscribers when network metrics are stable.

## 2025-07-20 - [React] Stable Prop References for List Rendering
**Learning:** Performing inline data transformations (e.g., `.split(',')` on tags or template literals for URLs) inside a parent's `.map()` loop creates new array/string references on every render. This forces `React.memo`'d children (like `StreamCard`) to re-render even if the underlying data is identical, causing O(N) reconciliation overhead.
**Action:** Move data normalization and formatting logic inside the child component using `useMemo`. This allows the child to receive stable, raw props from the parent and effectively bail out of redundant re-renders.
