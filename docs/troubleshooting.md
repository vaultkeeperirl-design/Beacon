# Troubleshooting Guide

Welcome to the **Beacon** Troubleshooting Guide. This document centralizes common issues developers face when setting up and running Beacon locally, along with tested solutions.

---

## 1. Port Conflicts (`EADDRINUSE`)

Beacon requires specific ports for its development servers. If you encounter an error stating a port is already in use, you likely have a ghost process running from a previous crashed session.

*   **Port 3000**: Used by the Node.js backend Signaling Server.
*   **Port 5173**: Used by the Vite frontend development server.

### How to Fix
Find and kill the conflicting processes using your terminal:

```bash
# Find and kill process on port 3000 (Backend)
lsof -i :3000
kill <PID>

# Find and kill process on port 5173 (Frontend)
lsof -i :5173
kill <PID>
```

---

## 2. Database Issues (SQLite & better-sqlite3)

Beacon uses `better-sqlite3` for fast, synchronous database access in the backend.

### Missing Bindings or "Module Not Found" Errors
If you see errors related to missing bindings or `.node` file issues when starting the backend or running tests, the native C++ bindings for your specific architecture are likely missing.

**How to Fix:**
Rebuild the bindings directly:
```bash
pnpm rebuild better-sqlite3
```

### Database Locked Errors
Rapid hot-reloading in the backend (`pnpm dev:web`) can sometimes leave the database connection open if the process isn't closed cleanly.

**How to Fix:**
1. Stop the development server (`Ctrl+C`).
2. Ensure no stray Node.js processes are running (see "Port Conflicts" above).
3. Restart the server.

*Note: The SQLite database file is located at `backend/beacon.db`. During Electron app execution in production, the file is safely written to `process.env.BEACON_USER_DATA` to avoid read-only file system errors.*

---

## 3. WebRTC and P2P Networking Issues

Testing a decentralized P2P mesh network locally can present unique challenges.

### Connection Failures During Local Testing
If you are testing multiple peers locally (e.g., streaming in one tab and watching in another) and the WebRTC connection fails to establish:

1. **Verify Backend Connection**: Ensure the Socket.IO signaling server is connected. Open your browser's DevTools Network tab, filter by "WS" (WebSocket), and look for a persistent connection to `ws://localhost:3000`.
2. **Check Browser Console**: Look for WebRTC RTCPeerConnection errors.
3. **Use Different Browsers**: Sometimes, using multiple incognito windows in the same browser can cause local ICE candidate routing issues. Try testing with completely different browsers (e.g., Broadcaster in Chrome, Viewer in Firefox).

---

## 4. Package Manager and Dependency Issues

Because Beacon is a monorepo, dependencies can sometimes get out of sync, especially after pulling new changes.

### "Module Not Found" or Stale Build Issues
If you encounter bizarre compilation errors or missing dependencies, the best approach is to clean the environment entirely.

**How to Fix:**
Use our built-in reset utility from the root of the repository:
```bash
# This cleans all node_modules, reinstalls them, and bootstraps workspaces
pnpm reset
```
If you only want to clean artifacts without reinstalling:
```bash
pnpm clean
```

---

## 5. Electron Launcher Build Issues

When packaging the Electron application for production (`pnpm build` in the `launcher` package), you might encounter specific workspace resolution errors.

### Workspace Resolution Errors During Packaging
The Electron Launcher copies the `backend` directory into its build path. To prevent `pnpm` workspace resolution errors when packaging, the build script runs `pnpm install --prod --ignore-workspace` inside the copied backend directory.

**How to Fix:**
You generally do not need to fix this manually. If the `pnpm build` command fails during the backend installation phase, ensure that your `backend/package.json` does not contain invalid relative file paths for dependencies that only exist in the development monorepo structure.
