## 2026-02-25 - Context Splitting for High-Frequency Updates
**Learning:** In React applications with real-time data (like P2P stats), putting frequently changing state in the same context as stable settings causes unnecessary re-renders across the entire component tree. Splitting the context into "stable" and "frequent" providers allows components to subscribe only to what they need.
**Action:** Always check if a context contains both high-frequency updates and stable configuration/actions, and split them if they are consumed by different components.
