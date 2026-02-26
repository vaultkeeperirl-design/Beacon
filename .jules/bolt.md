## 2024-05-23 - [Frontend] Large Component Subscription to High Frequency Data
**Learning:** Large layout components like `Navbar` should not subscribe directly to high-frequency data contexts (like real-time P2P stats updating every 1s) if they only use a tiny part of it (e.g., a credit balance badge). This causes the entire heavy component to re-render unnecessarily.
**Action:** Extract the data-dependent part into a smaller, isolated sub-component (e.g., `WalletBalance`) that consumes the context, keeping the parent component stable. Use `React.memo` on the parent if needed.

## 2025-01-24 - [React] Shielding Layout from High-Frequency Pulse States
**Learning:** Components that don't depend on high-frequency state (like a 1s ad-break timer or P2P stats) still re-render if their parent does, even if they are logically "static" during that phase.
**Action:** Use `React.memo` to wrap complex sub-components in views with active timers (e.g., `Broadcast Studio`). This prevents the entire UI tree from reconciling every second, significantly reducing CPU usage during live sessions.
