# Learning:
Jest test suites (like `pnpm test:backend`) can hang and not exit properly if asynchronous operations, such as `setTimeout` calls within the tested code or the test itself, are not cleared or unreferenced.

# Action:
When using `setTimeout` in tests (like testing a timeout or delay logic), if it's not explicitly cleared with `clearTimeout` before the test finishes, you should append `.unref()` to the returned Timeout object (e.g., `const t = setTimeout(...); t.unref();`). This prevents the Node.js event loop from staying alive solely for that timeout, allowing Jest to exit cleanly.
