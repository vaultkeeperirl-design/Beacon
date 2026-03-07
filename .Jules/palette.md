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

## 2026-03-05 - Dropdown and Selection Accessibility
**Learning:** Toggle buttons for menus or dropdowns (e.g., Profile menu, Tip menu) must include `aria-expanded` and `aria-haspopup` to properly signal state to assistive technologies. Similarly, selection buttons in a group should use `aria-pressed` to indicate the active state.
**Action:** Always include state-reflecting ARIA attributes on interactive elements that control visibility or represent a selection.

## 2026-03-06 - Form Accessibility via Label Association
**Learning:** Simply wrapping text in a `<label>` tag next to an `<input>` is not sufficient for screen readers. The label must be explicitly associated with the input using the `htmlFor` attribute on the label and a matching `id` attribute on the input. This ensures that when a screen reader focuses on the input, it accurately announces the associated label text.
**Action:** Always verify that every `<label>` has an `htmlFor` attribute that matches the `id` of its corresponding `<input>`, `<select>`, or `<textarea>`, especially on critical forms like Login and Register.

## 2026-03-10 - Sidebar Navigation and Active States
**Learning:** For application-wide navigation components like the Sidebar, using `NavLink` with a functional `className` provides a standardized way to communicate the user's current location visually. Additionally, purely visual status indicators (like "Live" pulse dots) must be made accessible using `role="img"` and `aria-label`.
**Action:** Always prefer `NavLink` for navigation menus to handle active states idiomatically, and ensure all visual status indicators have accompanying ARIA labels.

## 2026-03-07 - Dynamic List Icon Button Accessibility
**Learning:** Icon-only buttons rendered within dynamic lists (like a list of squad members or participants) must have `aria-label` attributes that uniquely identify their action in relation to the specific list item (e.g., "Remove User A"). Without this, screen readers will only announce "Button", leaving users unable to distinguish between the multiple identical buttons in the list.
**Action:** Always include dynamically interpolated `aria-label` attributes (and optionally `title` for sighted users) on icon-only buttons inside mapped arrays or lists.
