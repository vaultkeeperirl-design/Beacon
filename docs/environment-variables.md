# Environment Variables

Beacon utilizes several environment variables to configure its behavior across different environments. Currently, these variables are primarily used within the Node.js backend. The frontend (Vite) generally uses hardcoded default values but can be expanded in the future.

## Backend Variables (`backend/.env`)

The signaling server and API read these variables. Create a `.env` file in the `backend/` directory to override the defaults.

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | The port the Node.js backend server will listen on. |
| `JWT_SECRET` | Auto-generated | A secure string used to sign and verify JSON Web Tokens for authentication. If not provided, a random 64-byte hex string is generated on startup. **Warning:** If auto-generated, tokens will invalidate every time the server restarts. You must set this explicitly in production. |
| `SERVE_STATIC` | `false` | If set to any truthy value (e.g., `true`), the backend will attempt to serve pre-built frontend files from the `backend/client_build` directory instead of just acting as an API/Socket server. |
| `BEACON_USER_DATA` | (none) | Defines the absolute path where the `beacon.db` SQLite database file should be stored. This is automatically set by the Electron Launcher in production to write to the OS's safe user-data directory to prevent read-only filesystem errors. |

## Setting Variables During Development

You do not strictly need a `.env` file to run Beacon locally. The defaults are designed to work out-of-the-box for development using `pnpm dev` or `pnpm dev:web`.

If you need to change the port or set a persistent `JWT_SECRET` for testing auth across restarts:

1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```
2.  Create a `.env` file:
    ```bash
    touch .env
    ```
3.  Add your variables:
    ```env
    PORT=3000
    JWT_SECRET=my_super_secret_development_key
    ```
