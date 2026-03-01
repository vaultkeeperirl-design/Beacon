# Running the Full Stack Locally

This guide details how to run the Beacon application locally for development and testing. Beacon is a full-stack monorepo consisting of a React frontend, a Node.js signaling server, and an Electron desktop launcher.

## Prerequisites

Ensure you have completed the steps in the [Installation Guide](Installation.md). You should have Node.js 18+ and `pnpm` installed, and you must have run `pnpm install` and `pnpm bootstrap` in the root directory.

---

## Development Modes

There are two primary ways to run Beacon locally:

### Option A: Web Mode (Fastest for UI/API Dev)

This mode runs the React frontend and the Node.js backend simultaneously in your browser. It skips the Electron launcher entirely, making hot-reloads faster and debugging easier via standard browser developer tools.

**Command:**
```bash
pnpm dev:web
```

**What it does:**
1. Starts the backend Signaling Server on `http://localhost:3000`.
2. Starts the Vite development server for the frontend on `http://localhost:5173`.

**How to view:**
Open `http://localhost:5173` in your web browser.

**When to use:**
- Developing frontend UI components.
- Modifying backend API endpoints or Socket.IO logic.
- You need access to the browser's Redux/React DevTools or standard network inspectors.

---

### Option B: Desktop Launcher Mode (Recommended for Full Testing)

This mode launches the full Electron application, providing an environment closest to what end-users experience.

**Command:**
```bash
pnpm dev
```

**What it does:**
1. Starts the backend Signaling Server internally.
2. Starts the React frontend.
3. Launches the Electron desktop window, framing the frontend.

**How to view:**
The application will open a new window automatically.

**When to use:**
- Testing features that rely on desktop integrations (e.g., file system access, global shortcuts).
- Verifying the final UI rendering within the Electron window context.
- Conducting end-to-end tests before a PR.

---

## Verifying Your Setup

Once running in either mode, you can verify everything is working by checking the following:

1. **Frontend:** The UI should load without errors. Navigate to the Browse or Watch page.
2. **Backend:** Check the terminal output. You should see `Server listening on port 3000` (or similar).
3. **Database:** Beacon uses SQLite. Ensure the `backend/beacon.db` file is created (or exists) and isn't locked.
4. **WebSocket Connection:** Open the browser's network tab (or Electron's DevTools) and verify a WebSocket connection to `ws://localhost:3000` is established successfully.

## Common Development Workflows

### Testing the P2P Mesh Locally

To test the P2P Mesh functionality (Mandatory Bandwidth Sharing and Relay), you need multiple simulated "users".

1. **Start the backend:** `pnpm dev:web`
2. **Open the Broadcaster:** Open a browser window to `http://localhost:5173/broadcast` and start a stream.
3. **Open Viewers:** Open multiple incognito windows (or different browsers entirely, like Chrome and Firefox) and navigate to the stream you just started.
4. **Observe:** You can inspect the network tabs to see WebRTC connections forming between the different browser windows, bypassing the backend for video data.

## Troubleshooting

### Port Conflicts (`EADDRINUSE`)

If you encounter an error stating a port is already in use, you likely have a ghost process running.

**Fix:**
Find and kill the process using the port.

```bash
# Find process on port 3000 (Backend)
lsof -i :3000
# Kill process by PID
kill <PID>

# Find process on port 5173 (Frontend)
lsof -i :5173
# Kill process by PID
kill <PID>
```

### Database Locked Errors

Since Beacon uses SQLite, rapid hot-reloading in the backend can sometimes leave the database in a locked state if connections aren't closed cleanly.

**Fix:**
Stop the development server (`Ctrl+C`), ensure no stray node processes are running, and restart the server.

### Stale Frontend Build

If changes in `frontend/src` aren't appearing, Vite's cache might be stuck.

**Fix:**
Run the clean command from the root to wipe out `.vite` cache and `node_modules`, then reinstall.
```bash
pnpm reset
```
