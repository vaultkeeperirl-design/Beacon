## 2024-03-24 - Backend API Test Coverage
**Learning:** The Express backend API routes (/api/auth/register, /api/auth/login, /api/users/:username, /api/wallet) had 0% test coverage, despite containing critical business logic and database interactions.
**Action:** Added `auth_api.test.js` using `supertest` to cover these endpoints and mock database interactions effectively, bumping backend coverage significantly.
