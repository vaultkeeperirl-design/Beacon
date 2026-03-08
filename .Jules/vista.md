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

## 2026-03-04 - Skeleton Loaders vs Spinners
- **Learning**: Using a central loading spinner while fetching the stream list creates a sudden, jarring layout shift when the data finally arrives. The page goes from mostly empty to instantly full, which feels unpolished.
- **Action**: Created a `StreamCardSkeleton` component using Tailwind's `animate-pulse` and replaced the central spinner in `Browse.jsx` with a grid of these skeletons. This preserves the layout structure during loading, drastically improving perceived performance and providing a smoother transition for the user.
## 2026-03-05 - Global Following State Consistency
- **Learning**: In `Channel.jsx`, the follow button was relying on local component state instead of integrating with the global `FollowingContext`. This caused a fragmented experience where following a user on their channel page did not actually update the global state or reflect in other parts of the application like the Following page.
- **Action**: Refactored `Channel.jsx` to consume `useFollowing` context, mapping the follow/unfollow actions properly so that user state is immediately and globally consistent.
2024-03-08
Learning: Missing loading states for dependent data structures (like `offlineChannels` which is calculated after `liveStreams` are fetched) causes premature empty states and jarring layout shifts when the API resolves.
Action: Implemented a matching skeleton loading grid for the offline channels section on the Following page that displays while `isLoading` is true, ensuring a smooth, flicker-free initial render.
