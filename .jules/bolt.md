## 2024-05-23 - [Frontend] Large Component Subscription to High Frequency Data
**Learning:** Large layout components like `Navbar` should not subscribe directly to high-frequency data contexts (like real-time P2P stats updating every 1s) if they only use a tiny part of it (e.g., a credit balance badge). This causes the entire heavy component to re-render unnecessarily.
**Action:** Extract the data-dependent part into a smaller, isolated sub-component (e.g., `WalletBalance`) that consumes the context, keeping the parent component stable. Use `React.memo` on the parent if needed.
