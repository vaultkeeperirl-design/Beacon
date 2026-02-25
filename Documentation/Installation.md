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

---

**Note**: If you encounter network timeouts during installation, retry the command or check your internet connection.

Once installation is complete, proceed to the [Usage Guide](Usage.md) to start the application.
