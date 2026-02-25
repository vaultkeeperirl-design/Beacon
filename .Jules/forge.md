## 2024-05-23 - [Test setup missing]
**Learning:** The project lacks a test runner setup despite instructions to run tests.
**Action:** I will install Vitest and configure it before adding tests.

## 2025-05-15 - [Media Stream Management in Broadcast]
**Learning:** For broadcast previews, using a ref to keep the stream active while toggling the visibility of the video element prevents re-attaching the srcObject and ensures a smoother UI transition when toggling the camera.
**Action:** Always use a persistent stream ref and toggle track 'enabled' properties instead of stopping/starting tracks for simple UI toggles.

## 2025-05-16 - [Reusable Chat Component]
**Learning:** Decoupling layout-specific classes (like 'fixed' and 'h-full') from functional components like 'Chat' allows them to be seamlessly integrated into different page contexts (fixed sidebar in Watch vs. inline flex item in Broadcast).
**Action:** Always provide a 'className' prop to shared components and avoid hardcoding layout-breaking properties in the root element.
