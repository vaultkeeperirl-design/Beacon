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