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

## 2026-03-12 - Visual Character Constraints
**Learning:** For fields with backend-enforced length constraints (like stream titles and tags), providing a real-time character counter in the UI is essential for a smooth user experience. This prevents users from being surprised by silent truncation or error messages upon submission.
**Action:** Always pair `maxLength` attributes on input fields with a visible character counter that provides real-time feedback as the user types.

## 2024-05-18 - Added CTA to Following page empty state
**Learning:** The "Following" page had plain text empty states that didn't provide a clear next step for users. Using empty states as an opportunity to guide users (e.g., to the "Browse" page to discover channels) improves user flow and retention.
**Action:** Always include a relevant Call-to-Action (CTA) and clear icons in empty states to make them helpful and engaging, reducing dead-ends in the application flow.

## 2026-03-20 - Dropdown Interaction Polish
**Learning:** Standard dropdowns (like the profile menu) feel "broken" if they don't respond to the 'Escape' key or clicks outside their container. These interactions are expected by users and are standard accessibility patterns.
**Action:** Always implement 'Escape' and 'click-outside' listeners for custom dropdown components to ensure a professional and accessible user experience.

## 2026-03-22 - Enhanced Form Accessibility and Dynamic Context
**Learning:** For forms with side-by-side icons and inputs (like social media links), wrapping icons in a `<label htmlFor="...">` significantly improves UX by allowing the icon to act as a focus trigger. Additionally, when rendering lists of removable items (like interests), buttons must include dynamic `aria-label` and `title` attributes that specify which item is being affected to provide clear context for assistive technologies.
**Action:** Always wrap decorative/functional icons adjacent to inputs in `<label>` tags with matching `id`s, and ensure list-based actions have item-specific accessibility descriptions.

## 2026-03-25 - Keyboard Navigation via Skip Link
**Learning:** In applications with persistent navigation bars and sidebars, keyboard users are forced to tab through numerous links before reaching the page's primary content. A "Skip to Main Content" link provides a significant UX boost for accessibility by allowing users to bypass repetitive navigation.
**Action:** Always include a "Skip to Main Content" link in the root layout, ensuring it targets a `<main>` element with a corresponding ID and `tabIndex="-1"` for reliable focus management.

## 2026-03-26 - Chat Mention System Accessibility
**Learning:** Interactive usernames in a chat stream must be implemented as semantic `<button>` elements rather than simple `<span>` or `<a>` tags. This ensures they are keyboard-navigable and allows for the addition of descriptive `aria-label` attributes (e.g., "Mention [username]").
**Action:** Always use `<button>` elements for usernames in chat if they trigger interactive features like mentions or profile overlays, providing clear ARIA labels to describe the specific action.

## 2026-03-27 - Accessible Polling Pattern
**Learning:** For interactive poll widgets, using dynamic `aria-label` attributes on option buttons allows screen readers to distinguish between the 'voting' phase and the 'results' phase. Additionally, applying `aria-live="polite"` to the options container ensures that as votes roll in, the updated percentages and counts are announced without interrupting the user.
**Action:** Always implement context-aware ARIA labels and live regions for components that transition from input to data visualization, ensuring the state change is clear to assistive technologies.
