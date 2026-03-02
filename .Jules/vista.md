# Vista's Journal - Frontend Learnings

## Critical Learnings

### Chat Latency & Optimistic UI
**Observation:** The chat interface currently relies on a full round-trip to the server before displaying the user's own message. This creates a noticeable lag (even on local networks) and makes the application feel sluggish. Users are unsure if their message was sent until it echoes back.

**Solution:** Implement optimistic UI updates.
1. Immediately append the user's message to the local state with a "pending" visual indicator (e.g., opacity).
2. When the server broadcasts the message back, reconcile it with the pending message (confirming it).
3. This provides instant feedback (0ms latency) and a much snappier experience.

### Stream Settings UX
**Observation:** The `StreamSettings` component was implemented as a full-screen blocking modal overlay over the video player. This is a disruptive experience for users simply trying to adjust quality or stats while watching a stream.

**Action (2025-XX-XX):** Refactored `StreamSettings.jsx` into a smaller, unobtrusive popover menu anchored to the bottom right of the video player. Replaced the background backdrop overlay with a lightweight `useEffect` that listens for clicks outside the component's `useRef` to handle closing behavior gracefully.