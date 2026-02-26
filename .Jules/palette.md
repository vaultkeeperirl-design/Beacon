# Palette's Journal - Critical Learnings

## 2024-05-23 - Video Player Accessibility
**Learning:** Icon-only buttons in video players are a common accessibility trap. Without `aria-label` or `title` attributes, they are completely invisible to screen reader users, making the core functionality of the app inaccessible.
**Action:** Always audit video player controls first. Ensure every interactive element has a descriptive `aria-label` that reflects its current state (e.g., "Pause" vs "Play").

## 2025-05-14 - Temporary Visual Feedback Pattern
**Learning:** When providing visual feedback for transient actions (like "Copy to Clipboard"), using a local state toggle with a `setTimeout` is effective, but MUST be coupled with a `useEffect` cleanup function to avoid setting state on an unmounted component.
**Action:** Use the `useEffect` cleanup pattern for all timed UI state transitions to ensure stability during fast navigation.
