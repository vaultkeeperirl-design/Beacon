## 2024-02-28 - Initial Documentation Assessment
**Learning:** The project has solid high-level docs (Architecture, Installation) but lacks a deep-dive, user-friendly explanation of its most unique features: the P2P Mesh, bandwidth relay, and the Credit economy.
**Action:** Created `how-beacon-works.md` to explain the bandwidth relay mechanisms and how the backend calculates credits securely to give users and contributors a better mental model.

## 2024-05-15 - Local Dev Guide Addition
**Learning:** Developers need clear distinctions between web-only and full-desktop dev modes to choose the right workflow.
**Action:** Created `running-locally.md` to provide a dedicated local development guide that distinguishes between web-only and full-desktop dev modes, including troubleshooting for SQLite database locks and port conflicts.

## 2024-10-27 - Centralized Troubleshooting
**Learning:** Common local development and build errors (like `better-sqlite3` bindings missing, ghost processes blocking port 3000, and Electron workspace issues) are scattered across PRs and tribal knowledge.
**Action:** Created `/docs/troubleshooting.md` to centralize these fixes so new developers have a single reference point for unblocking themselves.

## 2025-03-03 - Testing Guide Documentation
**Learning:** Developers and contributors lack a centralized testing guide covering Vitest explicit imports, Playwright animations, Jest DB isolation setups, and specific environment rules like reparenting. The knowledge is spread across memory and multiple environments.
**Action:** Created `docs/testing-guide.md` to centralize this know-how and document clear setups, execution scripts, and troubleshooting tips.

## 2025-03-04 - Socket.IO Event Reference
**Learning:** The `backend-api.md` exclusively documented REST endpoints while real-time WebSocket communication and P2P connection logic managed by Socket.IO were undocumented, leaving a crucial gap for contributors building real-time features.
**Action:** Created `docs/socket-events.md` to detail all WebSocket events such as `metrics-report` (for economy), WebRTC signaling (offers/answers), and mesh topology updates.

## 2025-03-05 - Broadcasting Guide
**Learning:** The project had documentation covering the architecture, economy, and general setup, but lacked a step-by-step user guide explaining how to actually stream on the platform. Specifically, it wasn't clear to new streamers that Beacon handles broadcasting natively in the browser via WebRTC without needing third-party tools like OBS.
**Action:** Created `docs/broadcasting-guide.md` to document the built-in Broadcast Studio. This guide walks users through setting up their stream info, managing camera/mic/screen share, interacting with chat, and using platform-specific features like polls, co-streaming revenue splits, and ad breaks.

## 2025-03-05 - Contribution Guidelines Update
**Learning:** Developers submitting PRs might not be aware of the built-in `pnpm check` command, which sequentially runs the linter and test suite. Without this check, PRs might fail CI/CD or require more review cycles.
**Action:** Updated `docs/contributing.md` to explicitly require contributors to run `pnpm check` as a mandatory step before opening a Pull Request.
