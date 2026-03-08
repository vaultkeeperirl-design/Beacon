# 2024-05-24

## Learning: Continuous Integration (CI) Workflow Added
-   **Context:** The repository lacked an automated way to verify Pull Requests, requiring manual execution of `pnpm check`.
-   **Action:** Added a GitHub Actions workflow (`.github/workflows/pr-check.yml`) that triggers on PRs against `main`, checking out code, installing dependencies, and running `pnpm check`. Updated the README.md to reflect this behavior.
