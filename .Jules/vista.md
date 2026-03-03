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

## 2026-03-03 - Smooth Image Loading
- **Learning**: Unsplash image thumbnails in the stream cards were causing jarring layout shifts or ugly empty dark boxes before loading. Using a simple isLoaded state tied to the <img> onLoad event combined with a Tailwind animate-pulse skeleton provides a huge perceived performance boost and smoother experience for the user.
- **Action**: Implemented an elegant React state and CSS opacity transition in StreamCard.jsx to gracefully fade images in once fully loaded.
