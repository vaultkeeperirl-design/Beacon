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

## 2025-05-28 - [Decentralized Revenue Distribution]
**Learning:** Implementing a decentralized revenue model requires linking real-time network topology (mesh nodes) with authenticated user identities (wallets). By capturing the `accountName` during the socket handshake and persisting it in the mesh state, ad revenue can be dynamically partitioned between content creators (squad) and bandwidth contributors (relayers) using a unified transactional credit helper.
**Action:** Always ensure that identity is propagated into the system state (like P2P mesh) if that state is later used for financial or credit-based distributions.
