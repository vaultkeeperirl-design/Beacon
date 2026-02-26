# Installation Guide

Welcome to the **Beacon** installation guide. This document covers everything you need to set up the development environment, run the application locally, and build it for production.

## Prerequisites

Before getting started, ensure you have the following installed:

*   **Node.js**: Version 18 or higher (LTS recommended). [Download Node.js](https://nodejs.org/)
*   **pnpm**: The project uses `pnpm` for fast, disk-efficient package management.
    ```bash
    npm install -g pnpm
    ```
*   **Git**: For version control. [Download Git](https://git-scm.com/)

### Optional but Recommended
*   **Python 3.10+**: While not required for the JavaScript runtime, Python is often needed by build tools (like `node-gyp`) for compiling native dependencies.

## 1. Clone the Repository

Start by cloning the Beacon repository to your local machine:

```bash
git clone https://github.com/vaultkeeperirl-design/Beacon.git
cd Beacon
```

## 2. Install Dependencies

Beacon is a monorepo containing multiple packages (`frontend`, `backend`, `launcher`). You can install dependencies for all of them at once using the bootstrap command.

```bash
# Install root dependencies
pnpm install

# Install dependencies for all workspaces (backend, frontend, launcher)
pnpm bootstrap
```

> **Note:** The `pnpm bootstrap` command is a shortcut for `npm-run-all install:*` defined in the root `package.json`.

## 3. Running the Application

There are two main ways to run Beacon during development: the full Desktop App (Launcher) or the Web Version.

### Option A: Desktop Launcher (Recommended)

This runs the Electron-based desktop application, which bundles the backend and frontend together. This is the closest experience to the production app.

```bash
pnpm dev
```

This command:
1.  Starts the React frontend development server.
2.  Waits for the frontend to be ready.
3.  Launches the Electron application window.

### Option B: Web Version (Development)

If you want to develop the frontend and backend in a browser environment without Electron:

```bash
pnpm dev:web
```

This command uses `concurrently` to run:
*   **Backend Server**: `localhost:3000` (Node.js/Express/Socket.IO)
*   **Frontend**: `localhost:5173` (Vite)

Open [http://localhost:5173](http://localhost:5173) in your browser to view the app.

## 4. Building for Production

To create a distributable executable for the Beacon Launcher:

```bash
pnpm build
```

This script performs the following steps:
1.  Builds the frontend (React).
2.  Copies the backend files to the resource directory.
3.  Packages the Electron app for your current operating system.

### Platform-Specific Builds

The `launcher` package includes scripts for targeting specific platforms. You can run these from the `launcher` directory:

```bash
cd launcher

# Build for Windows (.exe)
pnpm build:win

# Build for Linux (.AppImage)
pnpm build:linux
```

> **Windows Note:** Building for Windows requires a valid `icon.ico` file in `launcher/public/`.
> **Linux Note:** AppImage builds require `author` and `repository` fields in `package.json` (already configured).

## Troubleshooting

### Port Conflicts
If you see errors about ports being in use (e.g., `EADDRINUSE`), ensure no other processes are running on ports **3000** (Backend) or **5173** (Frontend).
You can find and kill them using:
```bash
# Find process on port 3000
lsof -i :3000
# Kill process by PID
kill <PID>
```

### Missing Dependencies
If you encounter "module not found" errors, try cleaning your `node_modules` and reinstalling:
```bash
rm -rf node_modules
rm -rf */node_modules
pnpm install
pnpm bootstrap
```

### Log Files
During web development (`pnpm dev:web`), output might be redirected to `dev_web.log` or `dev_web_2.log`. These files are tracked in the repository for convenience but should generally be ignored during commits if you modify them locally.
