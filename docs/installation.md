# Installation Guide

Welcome to Beacon! This guide will help you set up the development environment for the Beacon project.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js**: Version 18 or higher is recommended.
- **pnpm**: The preferred package manager for this project.
  - Install via: `npm install -g pnpm`
- **Git**: For version control.
- **Python**: Version 3.10+ (Required for running screenshot generation tools).

## Clone the Repository

First, clone the Beacon repository to your local machine:

```bash
git clone https://github.com/vaultkeeperirl-design/Beacon.git
cd Beacon
```

## Backend Setup (Signaling Server)

The backend handles WebRTC signaling and chat functionality.

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```

2.  Install dependencies using `pnpm`:
    ```bash
    pnpm install
    ```

3.  (Optional) Configure Environment Variables:
    - Create a `.env` file in the `backend` directory if you need to customize the port.
    - Default port is `3000`.
    ```bash
    # .env
    PORT=3000
    ```

4.  Start the server:
    ```bash
    pnpm start
    ```
    You should see: `Server running on port 3000`.

## Frontend Setup

The frontend is a React application built with Vite.

1.  Open a new terminal window and navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies using `pnpm`:
    ```bash
    pnpm install
    ```

3.  (Optional) Configure Environment Variables:
    - Create a `.env` file in the `frontend` directory if your backend is running on a different URL.
    - Default backend URL is `http://localhost:3000`.
    ```bash
    # .env
    VITE_BACKEND_URL=http://localhost:3000
    ```

4.  Start the development server:
    ```bash
    pnpm dev
    ```
    The application will be available at `http://localhost:5173`.

## Running the Full Stack

To run the full application, you need two terminal windows running simultaneously:

1.  **Terminal 1 (Backend):**
    ```bash
    cd backend && pnpm start
    ```

2.  **Terminal 2 (Frontend):**
    ```bash
    cd frontend && pnpm dev
    ```

Open your browser and navigate to `http://localhost:5173` to start using Beacon.

## Troubleshooting

- **Port Already in Use**: If you see an error like `EADDRINUSE`, ensure that ports `3000` (backend) and `5173` (frontend) are free. You can kill the process using the port or change the port in the `.env` file (and update the frontend configuration accordingly).
- **pnpm Not Found**: Ensure `pnpm` is installed globally via `npm install -g pnpm`.
- **Connection Issues**: If the frontend cannot connect to the backend, check the browser console for errors and ensure the backend server is running and accessible at the configured URL.

## Advanced: Screenshot Generation

To generate screenshots for documentation or verification, you can use the provided Python script.

1.  Ensure you have Python installed.
2.  Install `playwright`:
    ```bash
    pip install playwright
    playwright install
    ```
3.  Run the generation script from the root directory:
    ```bash
    python generate_screenshots.py
    ```
    Screenshots will be saved to the `screenshots/` directory.
