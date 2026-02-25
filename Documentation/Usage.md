# Usage Guide

This guide explains how to run the Beacon application locally, including the backend signaling server and the frontend client.

## Running the Backend

The backend server is responsible for signaling and peer discovery. It uses Socket.IO.

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Start the development server:
    ```bash
    pnpm start
    ```
    The server will start on port 3000 (default). You should see a message indicating it's listening.

## Running the Frontend

The frontend is built with React and Vite.

1.  Open a new terminal window or tab and navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Start the development server:
    ```bash
    pnpm run dev
    ```
    This will start the Vite development server, usually on port 5173.

## Accessing the Application

Once both servers are running, open your browser and navigate to:

```
http://localhost:5173
```

You should see the Beacon homepage.

## Testing

To run tests for the backend or frontend, navigate to the respective directory and run:

```bash
pnpm test
```

This will execute the test suite (Jest for backend, Vitest for frontend).

## Troubleshooting

-   **Port Conflicts**: If port 3000 or 5173 is already in use, you may need to stop other processes or configure different ports.
-   **Dependencies**: Ensure you have run `pnpm install` in both directories as described in the [Installation Guide](Installation.md).
