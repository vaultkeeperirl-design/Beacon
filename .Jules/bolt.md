## 2026-02-25 - Context Splitting for High-Frequency Updates
**Learning:** In React applications with real-time data (like P2P stats), putting frequently changing state in the same context as stable settings causes unnecessary re-renders across the entire component tree. Splitting the context into "stable" and "frequent" providers allows components to subscribe only to what they need.
**Action:** Always check if a context contains both high-frequency updates and stable configuration/actions, and split them if they are consumed by different components.

## 2026-02-26 - Idiomatic State Reset vs. Persistence
**Learning:** Using the `key` prop to reset component state (like a chat list) is idiomatic and efficient, but it clears all local state. Persistent user state (like identity/username) must be moved up to a context or higher-level component to survive these resets.
**Action:** When using `key` for performance-driven state resets, audit the component for any state that should actually persist across those resets and move it to a stable provider.
