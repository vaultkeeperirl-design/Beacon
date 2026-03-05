
## 2025-02-14

- Added test:coverage, test:backend:coverage, and test:frontend:coverage commands to the root package.json to improve the developer experience by providing a unified way to run test coverage across the monorepo.
- Updated backend/package.json and frontend/package.json to include test:coverage scripts utilizing jest --silent --coverage and vitest run --coverage respectively.
- Documented the new commands in README.md to ensure discoverability for other developers.
