const Database = require('better-sqlite3');
const path = require('path');

// Ensure the database file is placed in a writable directory
// When packaged with Electron, __dirname inside app.asar is read-only
let dbPath;
try {
  // If running inside electron, try to get the userData path
  // In the launcher, the backend is run via fork(), so it's a separate node process
  // The launcher sets an environment variable for the userData path if needed
  if (process.env.BEACON_USER_DATA) {
    dbPath = path.join(process.env.BEACON_USER_DATA, 'beacon.db');
  } else {
    dbPath = path.resolve(__dirname, 'beacon.db');
  }
} catch (e) {
  // Fallback to __dirname if not in electron or error
  dbPath = path.resolve(__dirname, 'beacon.db');
}

const db = new Database(dbPath, { verbose: console.log });

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    follower_count INTEGER DEFAULT 0,
    credits REAL DEFAULT 0.0
  );

  CREATE TABLE IF NOT EXISTS Follows (
    follower_id INTEGER NOT NULL,
    followee_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, followee_id),
    FOREIGN KEY (follower_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (followee_id) REFERENCES Users(id) ON DELETE CASCADE
  );

  -- ⚡ Performance Optimization: Index for 'Get Followers' query (O(log N) instead of O(N))
  CREATE INDEX IF NOT EXISTS idx_follows_followee ON Follows (followee_id);
`);
console.log('Database tables ready.');

module.exports = db;
