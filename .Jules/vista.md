# Vista's Journal - Frontend Learnings

## Critical Learnings

### Chat Latency & Optimistic UI
**Observation:** The chat interface currently relies on a full round-trip to the server before displaying the user's own message. This creates a noticeable lag (even on local networks) and makes the application feel sluggish. Users are unsure if their message was sent until it echoes back.

**Solution:** Implement optimistic UI updates.
1. Immediately append the user's message to the local state with a "pending" visual indicator (e.g., opacity).
2. When the server broadcasts the message back, reconcile it with the pending message (confirming it).
3. This provides instant feedback (0ms latency) and a much snappier experience.
