## 2026-03-02 - Screenshot Generation Prerequisites
**Learning:** The `scripts/generate_readme_screenshots.py` script requires the local dev server (`pnpm dev:web`) to be actively running on `http://localhost:5173/`. If it's not running, Playwright will fail with a connection refused error.
**Action:** Always start the dev server before running the automated screenshot generation script, and explicitly document this prerequisite in the README for other contributors.
