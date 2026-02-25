## 2024-05-23 - [Test setup missing]
**Learning:** The project lacks a test runner setup despite instructions to run tests.
**Action:** I will install Vitest and configure it before adding tests.

## 2025-05-15 - [Media Stream Management in Broadcast]
**Learning:** For broadcast previews, using a ref to keep the stream active while toggling the visibility of the video element prevents re-attaching the srcObject and ensures a smoother UI transition when toggling the camera.
**Action:** Always use a persistent stream ref and toggle track 'enabled' properties instead of stopping/starting tracks for simple UI toggles.

## 2025-05-23 - [Reusable Real-time Components]
**Learning:** Refactoring fixed sidebar components (like Chat) to accept a `className` prop allows them to be embedded into complex grid layouts (like the Broadcast Studio) without duplicating logic.
**Action:** Always design sidebar components with layout flexibility to support both fixed and inline modes.

## 2025-02-25 - [Proper Media Stream Cleanup]
**Learning:** When implementing screen sharing via `getDisplayMedia`, merely removing the stream from a video element is insufficient; all tracks must be explicitly stopped via `track.stop()` to terminate capture and remove browser-level indicators.
**Action:** Always store the `MediaStream` in a `useRef` and iterate over tracks to stop them during cleanup or state toggles.

## 2025-05-24 - [Fullscreen UI Management]
**Learning:** To maintain custom video controls during fullscreen, use  on the container element rather than the video element itself. Additionally, always listen for the `fullscreenchange` event on the document to keep React state in sync when the user exits fullscreen via system keys like Escape.
**Action:** Use a container ref for fullscreen and a dedicated effect for event listener cleanup.

## 2025-05-24 - [Fullscreen UI Management]
**Learning:** To maintain custom video controls during fullscreen, use `requestFullscreen()` on the container element rather than the video element itself. Additionally, always listen for the `fullscreenchange` event on the document to keep React state in sync when the user exits fullscreen via system keys like Escape.
**Action:** Use a container ref for fullscreen and a dedicated effect for event listener cleanup.
