# Sculptor's Journal

## 2025-02-26 - Extracting Socket Logic to Hooks
**Learning:** When extracting logic that involves event listeners and side effects (like socket.io) into a custom hook, pay close attention to the return values of helper functions. In `Chat.jsx`, the original `sendMessage` function had a void return but relied on early returns to prevent state updates (clearing input). When moving this to a hook, the `sendMessage` function needed to return a boolean to signal the UI component whether to clear the input or not, preserving the optimistic UI behavior for offline/flaky connections.
**Action:** Always verify how the return value of extracted functions is used in the original component, especially for UI state updates.

## 2025-02-28 - Extracting UI blocks into components
**Learning:** Extracting isolated UI features, such as Co-Streaming blocks, into their own separate components simplifies the code of monolithic components. State logically related to the extracted feature should go with it.
**Action:** Always identify chunks of logic and UI that can be isolated into functional components.
