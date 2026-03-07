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
## 2026-03-04 - Centralize API and Socket URL configuration
**Learning:** The `API_URL` and `SOCKET_URL` string concatenation and environment fallback logic was duplicated across many frontend components (hooks, contexts, pages, components). This duplication creates a high risk of inconsistencies if environment structures or logic change, and litters application logic files with configuration boilerplate.
**Action:** Extracted these URLs to a centralized `frontend/src/config/api.js` file, creating a single source of truth for API communication paths. Next time, identify environment-dependent constants early and establish a configuration pattern to prevent scattered duplications.

## 2025-03-07 - Extract Repetitive React Router NavLinks
**Learning:** Repetitive use of React Router's `NavLink` with complex `isActive` render props (especially when combined with Tailwind CSS classes) leads to verbose and hard-to-maintain code blocks, like in `Sidebar.jsx`. Extracting these into small, specialized inner components or helper functions significantly reduces visual noise and duplication, making the UI structure much cleaner.
**Action:** Always identify identical `className` functions within `.map` loops or structurally similar sibling elements, and extract them into single-responsibility reusable components, passing varying elements (like text and icons) as props or children.
