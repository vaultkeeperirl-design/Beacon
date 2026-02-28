# Palette's Journal - Critical Learnings

## 2024-05-23 - Video Player Accessibility
**Learning:** Icon-only buttons in video players are a common accessibility trap. Without `aria-label` or `title` attributes, they are completely invisible to screen reader users, making the core functionality of the app inaccessible.
**Action:** Always audit video player controls first. Ensure every interactive element has a descriptive `aria-label` that reflects its current state (e.g., "Pause" vs "Play").

## 2025-02-15 - Video Player Keyboard Navigation
**Learning:** Custom video player controls often rely on `<button>` elements that only have hover states for styling. Because a video player is a prime target for keyboard navigation, the lack of `focus-visible` styles makes it extremely difficult for non-mouse users to determine which control is currently focused.
**Action:** Always add `focus-visible:ring-2` (and outline resetting) to all interactive elements within custom video controls to ensure clear visual feedback during keyboard navigation.
