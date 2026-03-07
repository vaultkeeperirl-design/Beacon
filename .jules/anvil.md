# 2025-03-07

## Learning
I noticed that when running parallel development commands (like `pnpm dev:web` or `pnpm test:watch`) using `concurrently`, the terminal output was a massive wall of interleaved text with no clear distinction between the frontend and backend logs. This lack of visual separation creates friction when debugging or monitoring dev servers.

## Action
I updated the root `package.json` and the `launcher/package.json` scripts that utilize `concurrently` (specifically `dev:web`, `test:watch`, and the launcher's `dev`). I added the `-n` flag to provide named prefixes (e.g., "API,WEB", "REACT,ELECTRON") and the `-c` flag to apply distinct background colors (e.g., `bgBlue.bold`, `bgMagenta.bold`) to those prefixes. This makes it instantly obvious which process is logging what, significantly improving the developer experience.
