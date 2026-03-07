## 2024-05-23 - [Test setup missing]
**Learning:** The project lacks a test runner setup despite instructions to run tests.
**Action:** I will install Vitest and configure it before adding tests.

## 2025-05-15 - [Media Stream Management in Broadcast]
**Learning:** For broadcast previews, using a ref to keep the stream active while toggling the visibility of the video element prevents re-attaching the srcObject and ensures a smoother UI transition when toggling the camera.
**Action:** Always use a persistent stream ref and toggle track 'enabled' properties instead of stopping/starting tracks for simple UI toggles.

## 2025-05-23 - [Reusable Real-time Components]
**Learning:** Refactoring fixed sidebar components (like Chat) to accept a `className` prop allows them to be embedded into complex grid layouts (like the Broadcast Studio) without duplicating logic.
**Action:** Always design sidebar components with layout flexibility to support both fixed and inline modes.

## 2025-02-25 - [Proper Media Stream Cleanup]
**Learning:** When implementing screen sharing via `getDisplayMedia`, merely removing the stream from a video element is insufficient; all tracks must be explicitly stopped via `track.stop()` to terminate capture and remove browser-level indicators.
**Action:** Always store the `MediaStream` in a `useRef` and iterate over tracks to stop them during cleanup or state toggles.

## 2025-05-24 - [Fullscreen UI Management]
**Learning:** To maintain custom video controls during fullscreen, use  on the container element rather than the video element itself. Additionally, always listen for the `fullscreenchange` event on the document to keep React state in sync when the user exits fullscreen via system keys like Escape.
**Action:** Use a container ref for fullscreen and a dedicated effect for event listener cleanup.

## 2025-05-24 - [Fullscreen UI Management]
**Learning:** To maintain custom video controls during fullscreen, use `requestFullscreen()` on the container element rather than the video element itself. Additionally, always listen for the `fullscreenchange` event on the document to keep React state in sync when the user exits fullscreen via system keys like Escape.
**Action:** Use a container ref for fullscreen and a dedicated effect for event listener cleanup.

## 2025-05-25 - [Broadcast Studio Placeholder Elimination]
**Learning:** Turning static placeholders into controlled components involves adding `useState` hooks for input values, implementing async simulation (e.g., `setTimeout`) for loading/success states, and ensuring proper accessibility by linking labels to inputs via `htmlFor` and `id`.
**Action:** Always verify that input labels are correctly associated and provide clear visual feedback for "saving" operations.

## 2025-05-26 - [Real-time Wallet Synchronization]
**Learning:** To synchronize state across multiple devices or browser tabs for a specific user, use a dedicated Socket.io room pattern (e.g., `user:${username}`). This ensures that events like `wallet-update` reach all active sessions regardless of which one triggered the update.
**Action:** Implement a `join` to a user-specific room during the initial connection or authentication handshake.

## 2025-05-27 - [Transactional Integrity and Side Effects]
**Learning:** Decoupling side effects (like Socket.io emissions) from database transactions is crucial for maintaining consistency. Emitting events inside a transaction can lead to "phantom" updates if the transaction later fails.
**Action:** Refactor data distribution helpers to return a list of updates, and have the caller perform the broadcasts only after the transaction successfully commits.

## 2025-03-05 - Add sorting to Browse page
**Learning:** Reusable UI components for filtering/sorting on static datasets. The `streams` array is filtered using `query` first and then we can simply clone the array using `[...result]` and sort it via standard javascript `sort()` capabilities using a React `useMemo` dependency array to update optimally without excessive re-renders.
**Action:** Can use a very similar approach when tackling other list-oriented views such as the "Following" page or the "Home" page stream feeds.
## 2026-03-05 - [Optimistic UI Rollback Pattern]
**Learning:** When implementing optimistic updates for network-bound actions (like follows), rolling back to a consistent state is best achieved by re-fetching the source of truth from the backend API upon failure. This approach avoids stale closures and manual state preservation issues.
**Action:** Implement a re-fetch of the backend state within the `catch` block of an optimistic update to ensure long-term consistency.

## 2026-03-05 - Add sorting to Following page
**Learning:** Reusable UI components for filtering/sorting on static datasets in `Following.jsx`. We created a shallow array copy for `offlineChannels` using `[...result]` and sorted it via standard Javascript `sort()` using `a.name.localeCompare(b.name)`, encapsulated in a React `useMemo` block.
**Action:** When handling data directly returned from APIs, it's safer to provide robust fallback logic inside `sort()` comparisons (e.g., `const nameA = a.name || a.username || '';`) to prevent UI crashes if some entities lack optional attributes.

## 2026-03-07 - [Hydrating Transient Mesh Metadata]
**Learning:** Live stream metadata in `activeStreams` (backend) is transient and initialized from the database during the `join-stream` socket event. To avoid UI placeholders, this metadata must include all required fields (like `avatar_url`) and be preserved during updates or synchronized if the user's profile changes while live.
**Action:** Always include a metadata hydration step when a node joins the mesh to pull full user details into the transient mesh state.
