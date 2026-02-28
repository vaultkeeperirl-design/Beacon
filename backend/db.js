const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'beacon.db');
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
  )
`);
console.log('Users table ready.');

module.exports = db;
