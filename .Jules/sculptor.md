# Sculptor's Journal

## 2025-02-26 - Extracting Socket Logic to Hooks
**Learning:** When extracting logic that involves event listeners and side effects (like socket.io) into a custom hook, pay close attention to the return values of helper functions. In `Chat.jsx`, the original `sendMessage` function had a void return but relied on early returns to prevent state updates (clearing input). When moving this to a hook, the `sendMessage` function needed to return a boolean to signal the UI component whether to clear the input or not, preserving the optimistic UI behavior for offline/flaky connections.
**Action:** Always verify how the return value of extracted functions is used in the original component, especially for UI state updates.

## 2025-02-28 - Extracting UI blocks into components
**Learning:** Extracting isolated UI features, such as Co-Streaming blocks, into their own separate components simplifies the code of monolithic components. State logically related to the extracted feature should go with it.
**Action:** Always identify chunks of logic and UI that can be isolated into functional components.

## 2025-03-01 - Deleting dead code blocks
**Learning:** Dead files (e.g. `useP2PSimulation.js` which was replaced by `useRealP2PStats.js`) should be safely removed from the repository. Also, any large block of rambling comments directly referencing dead code must also be removed to preserve code readability.
**Action:** Always hunt for dead components and completely clean their references.

## 2025-03-03 - Extract Keyboard Shortcuts from VideoPlayer
**Learning:** Extracting isolated behavioral logic, like keyboard event listeners for video playback, into a custom hook (`useVideoShortcuts`) significantly reduces the visual noise in complex presentation components like `VideoPlayer.jsx`.
**Action:** When a component grows large with disparate concerns (e.g., stats overlays, playback synchronization, keyboard shortcuts), look for cohesive logic chunks that can be safely decoupled into custom hooks. Ensure any callbacks passed to the hook are properly wrapped in `useCallback` if they depend on unstable values.
