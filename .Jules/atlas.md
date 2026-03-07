## 2025-10-25 - Implement Permanent Account Deletion Endpoint
**Learning:** SQLite in this environment does not have `PRAGMA foreign_keys = ON;` enabled by default in `db.js`. Therefore, `ON DELETE CASCADE` schemas will not automatically clean up related tables (like `Follows`), leaving orphaned data if a user is deleted using only `DELETE FROM Users`.
**Action:** When implementing deletion features (like `DELETE /api/users/:username`), always wrap the deletion logic in a `db.transaction()` and manually `DELETE` from associated tables (e.g., `Follows`) before deleting the primary `Users` row to ensure referential integrity.
## 2025-05-18 - Add following count to user profiles
**Learning:** Returning a subquery `(SELECT COUNT(*) FROM Follows WHERE follower_id = Users.id) AS following_count` within the main `getUserStmt` query allows the frontend to display both follower and following counts without making a separate API request to `/api/users/:username/following`.
**Action:** When returning a user profile or summary, consider adding simple `COUNT` subqueries to provide a more complete view of user relationships and statistics in a single roundtrip.
