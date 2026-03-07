YYYY-MM-DD
Learning: Discovered that `setTimeout` durations for active polls in `backend/server.js` were preventing the test suites from cleanly exiting if the host did not manually end them, leading to `force exited` error outputs. Node's `setTimeout` open handles will keep the main process alive until completed.
Action: Appended `.unref()` to `setTimeout` when creating poll timers, signaling to Node.js that the event loop can terminate naturally even if the timer has not fired. Tests now exit successfully without hanging.

2024-05-18
Learning: To avoid ESLint `react-hooks/rules-of-hooks` errors in test files, never call React hooks conditionally inside generic or shared testing wrapper components.
Action: Defined and rendered completely isolated dummy components for each specific hook being tested.
