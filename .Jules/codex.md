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
