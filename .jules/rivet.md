# 2026-03-27

## Learning:
If a user account is deleted from the backend but their JWT remains valid, certain authenticated endpoints (like follow/unfollow) can crash the server if they attempt to lookup the `follower` object and do not check for `null` before accessing `follower.id`. Furthermore, SQLite temporary files (`beacon.db-shm` and `beacon.db-wal`) shouldn't be tracked in version control.

## Action:
- Added null checks in `backend/server.js` for the `follower` object in both the POST and DELETE `/api/users/:username/follow` endpoints, returning a `404 User not found` instead.
- Added regression tests in `backend/tests/follows.test.js` to ensure this gracefully handles deleted users with active tokens.
- Added `backend/beacon.db-shm` and `backend/beacon.db-wal` to `.gitignore` to prevent version tracking of SQLite artifacts.
