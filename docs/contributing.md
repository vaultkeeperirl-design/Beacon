# Contributing to Beacon

First off, thanks for taking the time to contribute! 🎉

Beacon is a community-driven project, and we welcome contributions of all forms. Whether you're fixing bugs, adding new features, improving documentation, or just reporting issues, your help is appreciated.

## Getting Started

### 1. Fork and Clone

1.  Fork the repository on GitHub.
2.  Clone your fork locally:
    ```bash
    git clone https://github.com/YOUR_USERNAME/Beacon.git
    cd Beacon
    ```
3.  Add the upstream repository to keep your fork in sync:
    ```bash
    git remote add upstream https://github.com/vaultkeeperirl-design/Beacon.git
    ```

### 2. Set Up Development Environment

Follow the [Installation Guide](Installation.md) to install dependencies and set up your environment.

Key steps:
```bash
# Install dependencies
pnpm install
pnpm bootstrap

# Run the app locally
pnpm dev
```

## Development Workflow

### Branching Strategy

-   **`main`**: The stable branch. Do not push directly to `main`.
-   **Feature Branches**: Create a new branch for each feature or bug fix.
    ```bash
    git checkout -b feature/my-new-feature
    # or
    git checkout -b fix/bug-description
    ```

### Code Style

We use `eslint` to maintain code quality. Please ensure your code passes linting before submitting a PR.

```bash
# Run linting
pnpm lint
```

### Testing

Please write tests for new features and ensure existing tests pass.

```bash
# Run all tests
pnpm test

# Run backend tests
pnpm test:backend

# Run frontend tests
pnpm test:frontend
```

## Submitting a Pull Request

1.  **Sync with Upstream**: Ensure your branch is up to date with `upstream/main`.
    ```bash
    git fetch upstream
    git merge upstream/main
    ```
2.  **Commit Changes**: Write clear, descriptive commit messages.
3.  **Push to Fork**:
    ```bash
    git push origin feature/my-new-feature
    ```
4.  **Open PR**: Go to the original repository and open a Pull Request.
    -   Describe your changes clearly.
    -   Link to any relevant issues.
    -   Attach screenshots if your changes affect the UI.

## Reporting Issues

If you find a bug or have a feature request, please open an issue on GitHub.
-   **Bugs**: Include steps to reproduce, expected vs. actual behavior, and environment details.
-   **Features**: Explain the "why" and "how" of your proposal.

## Community Guidelines

-   Be respectful and inclusive.
-   Help others learn and grow.
-   Focus on constructive feedback.

Thank you for helping us light the Beacon! <img src="../frontend/public/logo-icon.png" width="16"/>
