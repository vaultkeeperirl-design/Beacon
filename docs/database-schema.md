# Database Schema

The Beacon backend uses SQLite to manage its structured data. We use the [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) library to interact with the database synchronously, providing fast and reliable access.

The database schema is defined and initialized in `backend/db.js`.

---

## Tables

### 1. `Users`
This table stores all registered users on the Beacon platform.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | A unique identifier for the user. |
| `username` | `TEXT` | `UNIQUE NOT NULL` | The user's chosen display name. |
| `password_hash` | `TEXT` | `NOT NULL` | The bcrypt-hashed password. |
| `avatar_url` | `TEXT` | | Optional URL to the user's avatar image. |
| `bio` | `TEXT` | | Optional short biography text. |
| `follower_count` | `INTEGER` | `DEFAULT 0` | A cached count of how many users follow this user. |
| `credits` | `REAL` | `DEFAULT 0.0` | The user's wallet balance, earned by streaming or relaying. |

### 2. `Follows`
This junction table defines the many-to-many relationship between users (who follows whom).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `follower_id` | `INTEGER` | `NOT NULL`, `FOREIGN KEY` | The ID of the user initiating the follow. References `Users(id)`. |
| `followee_id` | `INTEGER` | `NOT NULL`, `FOREIGN KEY` | The ID of the user being followed. References `Users(id)`. |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | The timestamp when the follow occurred. |

**Constraints & Performance:**
*   **Primary Key:** The combination of `(follower_id, followee_id)` acts as the composite primary key, ensuring a user can only follow another user once.
*   **Foreign Keys:** Both `follower_id` and `followee_id` reference the `Users` table. The schema defines `ON DELETE CASCADE` for these foreign keys, meaning if a user is deleted, all their follow relationships are automatically removed.
    *   *Note:* SQLite does not enforce foreign keys by default. The Beacon backend does not explicitly enable them via `PRAGMA foreign_keys = ON;`, so cascades are handled manually in the application code (e.g., during account deletion).
*   **Index (`idx_follows_followee`):** An explicit index is created on the `followee_id` column. This optimizes queries that fetch all followers of a specific user, reducing the time complexity from O(N) to O(log N).
