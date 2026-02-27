# Usage Guide

This guide explains how to run the Beacon application locally. The project is set up as a monorepo, so you can run commands from the root directory.

## Running the Application

### Desktop Launcher (Recommended)

To run the full desktop application (Electron + React + Node.js), use the following command from the root directory:

```bash
pnpm dev
```

This command:
1.  Starts the backend signaling server.
2.  Starts the React frontend.
3.  Launches the Electron desktop window.

### Web Version (Browser Only)

To run the application in a browser environment (useful for quick UI development):

```bash
pnpm dev:web
```

This will concurrently start:
*   **Backend**: `http://localhost:3000`
*   **Frontend**: `http://localhost:5173`

Once running, open your browser and navigate to [http://localhost:5173](http://localhost:5173).

## Testing

You can run tests for the entire project or specific packages from the root directory.

### Run All Tests
```bash
pnpm test
```

### Run Backend Tests
```bash
pnpm test:backend
```

### Run Frontend Tests
```bash
pnpm test:frontend
```

## Troubleshooting

-   **Port Conflicts**: If port 3000 or 5173 is already in use, you may need to stop other processes.
-   **Dependencies**: Ensure you have run `pnpm install` and `pnpm bootstrap` as described in the [Installation Guide](Installation.md).
