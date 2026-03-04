## 2026-03-02 - Screenshot Generation Prerequisites
**Learning:** The `scripts/generate_readme_screenshots.py` script requires the local dev server (`pnpm dev:web`) to be actively running on `http://localhost:5173/`. If it's not running, Playwright will fail with a connection refused error.
**Action:** Always start the dev server before running the automated screenshot generation script, and explicitly document this prerequisite in the README for other contributors.

## 2026-03-03 - Automated UI Refresh
**Learning:** The UI has been updated recently and screenshots require regeneration. The generation script `scripts/generate_readme_screenshots.py` successfully captured these changes while pointing to `localhost:5173`.
**Action:** Run the generate script regularly after UI changes to ensure documentation stays fresh.

## 2026-03-04 - Refresh README Screenshots
**Learning:** Running the test automation scripts regularly captures the latest state of the UI which may have been changed, so the README screenshots stay fresh.
**Action:** Ran `python scripts/generate_readme_screenshots.py` to capture the newest screenshots for the README.
