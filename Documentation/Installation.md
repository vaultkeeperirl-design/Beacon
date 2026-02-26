# Installation Guide

Welcome to **Beacon**, the decentralized P2P streaming platform. This guide will walk you through the steps to set up the project on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js**: Version 18 or higher is required. You can download it from [nodejs.org](https://nodejs.org/).
*   **pnpm**: We use pnpm for dependency management. If you don't have it, install it globally using npm:

    ```bash
    npm install -g pnpm
    ```

## Getting Started

1.  **Clone the Repository**

    Start by cloning the Beacon repository to your local machine:

    ```bash
    git clone https://github.com/vaultkeeperirl-design/Beacon.git
    cd Beacon
    ```

2.  **Backend Installation**

    Navigate to the `backend` directory and install the required dependencies:

    ```bash
    cd backend
    pnpm install
    ```

    This will install Express, Socket.IO, and other backend dependencies.

3.  **Frontend Installation**

    Open a new terminal window or tab (or navigate back to the root) and enter the `frontend` directory:

    ```bash
    cd ../frontend
    pnpm install
    ```

    This will install React, Tailwind CSS, Vite, and other frontend dependencies.

4.  **Launcher Installation (Desktop App)**

    Navigate to the `launcher` directory to set up the desktop application wrapper:

    ```bash
    cd ../launcher
    pnpm install
    ```

    This installs Electron and the build tools required to package the application.

## Running the Desktop App (Development)

To run the full desktop experience (Launcher + Backend + Frontend) in development mode:

1.  Navigate to the `launcher` directory:
    ```bash
    cd launcher
    ```
2.  Start the development environment:
    ```bash
    pnpm dev
    ```
    This will concurrently start the React frontend, the Electron main process, and launch the application window.

## Building the Executable

If you want to build the production executable yourself (instead of using the pre-built releases):

1.  Navigate to the `launcher` directory:
    ```bash
    cd launcher
    ```
2.  Run the build command for your platform:

    *   **Windows**:
        ```bash
        pnpm build:win
        ```
    *   **Linux**:
        ```bash
        pnpm build:linux
        ```
    *   **All Platforms**:
        ```bash
        pnpm build
        ```

    The build process will automatically:
    1.  Build the frontend (`frontend/dist`).
    2.  Copy the backend code.
    3.  Package everything into an executable in the `launcher/dist` folder.

## Automatic Builds (Releases)

For a ready-to-use version of the Beacon Launcher, you do not need to build it yourself.

**Executable files for Windows (.exe) and Linux (.AppImage) are automatically built and published to the GitHub Releases page.**

Visit the **Releases** section of this repository to download the latest version.

---

**Note**: If you encounter network timeouts during installation, retry the command or check your internet connection.

Once installation is complete, proceed to the [Usage Guide](Usage.md) to start the application.
