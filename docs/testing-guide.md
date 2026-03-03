# Testing Guide

Testing is a crucial part of maintaining the stability of Beacon's decentralized P2P streaming architecture. Because Beacon combines a React frontend, a Node.js signaling server, and an Electron launcher, testing spans multiple environments.

This guide covers how to run tests, write effective unit/integration tests for both frontend and backend, and handle end-to-end (E2E) scenarios.

---

## 1. Running Tests

The monorepo provides high-leverage scripts in the root `package.json` to streamline test execution.

### Full Test Suite
To run the entire test suite (backend and frontend sequentially):
```bash
pnpm test
```
*Note: To prevent the test runner from hanging indefinitely, the root `pnpm test` script explicitly runs `npm-run-all test:backend test:frontend` rather than using a glob pattern.*

### Specific Test Suites
*   **Backend (Jest):** `pnpm test:backend`
*   **Frontend (Vitest):** `pnpm test:frontend`

### Watch Mode
For an active development workflow, run tests in watch mode:
*   **Both concurrently:** `pnpm test:watch`
*   **Backend only:** `cd backend && pnpm test:watch`
*   **Frontend only:** `cd frontend && pnpm test:watch`

### Pre-PR Checks
Always run the check command before opening a Pull Request. This runs both the linter and the test suite:
```bash
pnpm check
```

---

## 2. Frontend Testing (React / Vitest)

The frontend uses **Vitest** for unit and component testing, and **React Testing Library** for rendering and interacting with UI elements.

### Explicit Imports
Because the global environment is strictly managed (and to pass our strict ESLint rules), Vitest testing functions must be explicitly imported in your test files:
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
```

### Mocking P2P Context
Many frontend components rely on the P2P Mesh network status. To avoid triggering actual WebRTC connections during testing, mock the `P2PContext` hooks.

*   **Network Metrics:** To test UI components that rely on connection status or stream health, mock `useP2PStats` from `../context/P2PContext`.
*   **Authentication:** When testing authenticated components (like tip buttons or wallet balances), mock `useP2PSettings` from `../context/P2PContext` to provide a dummy authentication token:
    ```javascript
    import { useP2PSettings } from '../context/P2PContext';

    // Example mock setup
    vi.mock('../context/P2PContext', () => ({
      useP2PSettings: vi.fn(),
      useP2PStats: vi.fn()
    }));

    beforeEach(() => {
      useP2PSettings.mockReturnValue({ authToken: 'dummy-token' });
    });
    ```

### Accessibility Testing
When verifying accessibility modifications (like `aria-label` additions), use precise React Testing Library queries:
```javascript
screen.getByRole('button', { name: 'Accessible Button Name' });
// or in Playwright:
page.get_by_label('Accessible Button Name');
```

---

## 3. Backend Testing (Node.js / Jest)

The backend uses **Jest** for unit tests and **Supertest** for API integration tests.

### Database Isolation (SQLite)
Backend tests often share the `backend/beacon.db` SQLite database. To prevent `UNIQUE constraint failed` errors between isolated test runs, use `INSERT OR IGNORE` followed by a fallback `UPDATE`.
```javascript
// Example robust DB setup for testing
const insertUser = db.prepare('INSERT OR IGNORE INTO Users (username, credits) VALUES (?, ?)');
const info = insertUser.run('test_user', 100);

if (info.changes === 0) {
  // User already existed, update them instead
  const updateUser = db.prepare('UPDATE Users SET credits = ? WHERE username = ?');
  updateUser.run(100, 'test_user');
}
```

### Server Teardowns
When using `supertest` with Express servers, cleanly close the server to prevent port conflicts (`EADDRINUSE`) in subsequent test files.
```javascript
afterAll((done) => {
  if (server.listening) {
    server.close(done);
  } else {
    done();
  }
});
```

### Testing Socket Events
Socket events (like `metrics-report` or `wallet-update`) often depend on backend database records. Ensure the mocked user is inserted into the `Users` table *before* emitting socket events; otherwise, DB queries will fail silently, leading to test timeouts.

### P2P Mesh Connectivity Tests
In P2P tests (like `mesh_routing.test.js`), remember that orphaned relay nodes can automatically reparent to any available node in the mesh, not just the broadcaster. Assertions must account for this flexible tree topology.

---

## 4. End-to-End Testing (Playwright)

**Playwright** is used for complete system E2E testing, including UI interactions and Electron launcher testing.

### Handling Animations
Playwright can click elements before loading animations complete, causing pointer interception errors. Always wait for animations to resolve before interaction:
```python
# Wait for loading spinner to disappear
page.locator('.animate-spin').wait_for(state='hidden')
# Or using not_to_be_visible()
expect(page.locator('.animate-spin')).not_to_be_visible()
```

### Selector Robustness
Avoid targeting elements by attributes that might change or are purely visual (like `title`). Use structural CSS selectors or explicit accessibility labels.
```python
# Good: Reliable structural selector
page.locator('.mt-auto button').click()

# Bad: Fragile attribute selector
page.locator('[title="Profile"]').click()
```

---

## 5. Known Flaky Tests & Troubleshooting

*   **`mesh_routing.test.js` Timeouts:** This backend test occasionally throws timeout errors (e.g., "Exceeded timeout of 10000 ms") during CI. If you are working on completely isolated frontend UI changes, this failure can generally be ignored.
*   **`better-sqlite3` Binding Errors:** If backend tests crash with missing bindings, run `pnpm rebuild better-sqlite3`.
