const request = require('supertest');
const db = require('../db');
const Database = require('better-sqlite3');
const testDb = new Database(':memory:');

testDb.exec(`
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
`);

jest.spyOn(db, 'prepare').mockImplementation((sql) => testDb.prepare(sql));
jest.spyOn(db, 'transaction').mockImplementation((fn) => testDb.transaction(fn));

const { server, io } = require('../server');
const bcrypt = require('bcryptjs');

describe('Auth API', () => {

  beforeAll((done) => {
    // We only need the express app wrapper for supertest. No need to actually listen.
    // However, if server was created and supertest manages it, it will bind to ephemeral port automatically.

    // We are going to mock out db.js behavior for this test to avoid wiping the dev database.
    done();
  });

  afterAll((done) => {
    // If it's listening we close it
    if (server.listening) {
       server.close(done);
    } else {
       done();
    }
  });

  beforeEach(() => {
    testDb.prepare('DELETE FROM Follows').run();
    testDb.prepare('DELETE FROM Users').run();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.credits).toBe(0);
      expect(response.body.user.follower_count).toBe(0);

      const stmt = db.prepare('SELECT * FROM Users WHERE username = ?');
      const user = stmt.get('testuser');
      expect(user).toBeDefined();
    });

    it('should return 400 if username or password is missing', async () => {
      let response = await request(server)
        .post('/api/auth/register')
        .send({ password: 'password123' });
      expect(response.status).toBe(400);

      response = await request(server)
        .post('/api/auth/register')
        .send({ username: 'testuser' });
      expect(response.status).toBe(400);
    });

    it('should return 400 if username length is invalid or not alphanumeric', async () => {
      let response = await request(server)
        .post('/api/auth/register')
        .send({ username: 'ab', password: 'password123' });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username must be 3-30 alphanumeric characters');

      response = await request(server)
        .post('/api/auth/register')
        .send({ username: 'test user', password: 'password123' });
      expect(response.status).toBe(400);

      response = await request(server)
        .post('/api/auth/register')
        .send({ username: 'test_user!', password: 'password123' });
      expect(response.status).toBe(400);
    });

    it('should return 400 if password is less than 6 characters', async () => {
      let response = await request(server)
        .post('/api/auth/register')
        .send({ username: 'testuser2', password: 'pass' });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password must be at least 6 characters long');
    });

    it('should return 409 if username already exists', async () => {
      await request(server)
        .post('/api/auth/register')
        .send({ username: 'duplicateuser', password: 'password123' });

      const response = await request(server)
        .post('/api/auth/register')
        .send({ username: 'duplicateuser', password: 'differentpassword' });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Username already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      testDb.prepare('DELETE FROM Users').run();
      // Pre-populate a user for login tests
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('password123', salt);
      db.prepare('INSERT INTO Users (username, password_hash, credits) VALUES (?, ?, ?)')
        .run('loginuser', password_hash, 10);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({ username: 'loginuser', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('loginuser');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should return 401 with invalid password', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({ username: 'loginuser', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 with non-existent username', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 400 if username or password is missing', async () => {
      let response = await request(server)
        .post('/api/auth/login')
        .send({ password: 'password123' });
      expect(response.status).toBe(400);

      response = await request(server)
        .post('/api/auth/login')
        .send({ username: 'testuser' });
      expect(response.status).toBe(400);
    });
  });
});

describe('User Profile API', () => {
  describe('PATCH /api/users/profile', () => {
    let token;
    beforeEach(async () => {
      testDb.prepare('DELETE FROM Users').run();
      // Pre-populate a user and generate a token
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('password123', salt);
      db.prepare('INSERT INTO Users (username, password_hash, credits, bio, avatar_url) VALUES (?, ?, ?, ?, ?)')
        .run('updateuser', password_hash, 10, 'Old bio', 'old_avatar.png');

      const response = await request(server)
        .post('/api/auth/login')
        .send({ username: 'updateuser', password: 'password123' });

      token = response.body.token;
    });

    it('should update bio successfully', async () => {
      const response = await request(server)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ bio: 'New bio updated' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.bio).toBe('New bio updated');
      expect(response.body.user.avatar_url).toBe('old_avatar.png'); // Unchanged
    });

    it('should update avatar_url successfully', async () => {
      const response = await request(server)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ avatar_url: 'new_avatar.png' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.bio).toBe('Old bio'); // Unchanged
      expect(response.body.user.avatar_url).toBe('new_avatar.png');
    });

    it('should update both bio and avatar_url successfully', async () => {
      const response = await request(server)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ bio: 'New bio updated', avatar_url: 'new_avatar.png' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.bio).toBe('New bio updated');
      expect(response.body.user.avatar_url).toBe('new_avatar.png');
    });

    it('should update avatar_url to null successfully', async () => {
      const response = await request(server)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ avatar_url: null });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.avatar_url).toBe(null);
    });

    it('should return 400 if bio is not a string', async () => {
      const response = await request(server)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ bio: 123 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bio must be a string');
    });

    it('should return 400 if bio exceeds 500 characters', async () => {
      const longBio = 'a'.repeat(501);
      const response = await request(server)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ bio: longBio });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bio cannot exceed 500 characters');
    });

    it('should return 400 if avatar_url is not a string or null', async () => {
      const response = await request(server)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ avatar_url: 123 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Avatar URL must be a string or null');
    });

    it('should return 401 if unauthorized', async () => {
      const response = await request(server)
        .patch('/api/users/profile')
        .send({ bio: 'New bio updated' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/users/:username', () => {
    beforeEach(async () => {
      testDb.prepare('DELETE FROM Users').run();
      // Pre-populate a user
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('password123', salt);
      db.prepare('INSERT INTO Users (username, password_hash, credits, bio) VALUES (?, ?, ?, ?)')
        .run('profileuser', password_hash, 10, 'Test bio');
    });

    it('should return user profile if username exists', async () => {
      const response = await request(server).get('/api/users/profileuser');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'profileuser');
      expect(response.body).toHaveProperty('bio', 'Test bio');
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should return 404 if username does not exist', async () => {
      const response = await request(server).get('/api/users/nonexistentuser');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('GET /api/wallet', () => {
    let token;
    beforeEach(async () => {
      testDb.prepare('DELETE FROM Users').run();
      // Pre-populate a user and generate a token
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('password123', salt);
      db.prepare('INSERT INTO Users (username, password_hash, credits) VALUES (?, ?, ?)')
        .run('walletuser', password_hash, 55.5);

      const response = await request(server)
        .post('/api/auth/login')
        .send({ username: 'walletuser', password: 'password123' });

      token = response.body.token;
    });

    it('should return wallet balance for authenticated user', async () => {
      const response = await request(server)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.balance).toBe(55.5);
    });

    it('should return 401 if token is missing', async () => {
      const response = await request(server).get('/api/wallet');
      expect(response.status).toBe(401);
    });

    it('should return 404 if authenticated user no longer exists in DB', async () => {
      db.prepare('DELETE FROM Users WHERE username = ?').run('walletuser');
      const response = await request(server)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });
  });
});
