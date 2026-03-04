# Palette's Journal - Critical Learnings

## 2024-05-23 - Video Player Accessibility
**Learning:** Icon-only buttons in video players are a common accessibility trap. Without `aria-label` or `title` attributes, they are completely invisible to screen reader users, making the core functionality of the app inaccessible.
**Action:** Always audit video player controls first. Ensure every interactive element has a descriptive `aria-label` that reflects its current state (e.g., "Pause" vs "Play").

## 2024-05-24 - Interaction Pattern for Temporary Feedback
**Learning:** When providing UI feedback for actions like 'Copy to Clipboard', use a state variable (e.g., `isCopied`) managed by a `useEffect` that triggers a `setTimeout` and includes a `clearTimeout` cleanup function to prevent memory leaks on unmount.
**Action:** Implement this pattern for all "copy" or "success" feedback triggers to ensure a consistent and robust user experience.

## 2024-06-25 - Chat Emotes Accessibility
**Learning:** Interactive elements styled as buttons (like Emotes triggers in chat) should use semantic `<button>` tags rather than `<div>` elements with `cursor-pointer` to ensure proper keyboard navigation and focus management.
**Action:** Convert faux-buttons to real `<button>` elements, ensuring they have `type="button"` and focus-visible states for keyboard accessibility, and update corresponding tests to use `getByRole`.

## 2024-05-27 - Input Field Accessibility
**Learning:** Relying solely on `placeholder` attributes for text input fields (like in chat forms) is insufficient for screen readers. Screen readers may inconsistently read or completely ignore placeholders, leaving the user without context for what the input is for.
**Action:** Always provide an explicit `aria-label` or an associated `<label>` element for all input fields to ensure they are fully accessible to screen reader users.

## 2026-03-04 - Co-Streaming Invite Input Accessibility
**Learning:** Relying solely on placeholders for input fields within co-streaming features creates accessibility gaps for screen readers.
**Action:** Ensure all functional input fields, even secondary ones like guest invites, include explicit `aria-label` attributes to clearly communicate their purpose.
