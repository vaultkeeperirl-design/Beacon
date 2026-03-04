const request = require('supertest');
const { server, io } = require('../server');
const db = require('../db');
const jwt = require('jsonwebtoken');

// Exported from server.js
const { JWT_SECRET } = require('../server');

describe('Follows API Endpoints', () => {
  let followerToken;
  let followerUsername;
  let followeeUsername;

  beforeAll((done) => {
    followerUsername = `follower_${Date.now()}`;
    followeeUsername = `followee_${Date.now()}`;

    // Insert mock users
    const insertStmt = db.prepare('INSERT INTO Users (username, password_hash, avatar_url, bio, follower_count, credits) VALUES (?, ?, ?, ?, ?, ?)');
    const followerInfo = insertStmt.run(followerUsername, 'hash', null, 'bio', 0, 0);
    insertStmt.run(followeeUsername, 'hash', null, 'bio', 0, 0);

    followerToken = jwt.sign({ id: followerInfo.lastInsertRowid, username: followerUsername }, JWT_SECRET, { expiresIn: '1h' });

    // Check if server is listening, if not, wait
    if (!server.listening) {
        server.listen(0, done);
    } else {
        done();
    }
  });

  afterAll((done) => {
    db.prepare('DELETE FROM Users WHERE username IN (?, ?)').run(followerUsername, followeeUsername);

    // Also delete any dangling follows related to these test users
    db.prepare(`
        DELETE FROM Follows
        WHERE follower_id IN (SELECT id FROM Users WHERE username IN (?, ?))
        OR followee_id IN (SELECT id FROM Users WHERE username IN (?, ?))
    `).run(followerUsername, followeeUsername, followerUsername, followeeUsername);

    io.close();
    if (server.listening) {
      server.close(done);
    } else {
      done();
    }
  });

  test('POST /api/users/:username/follow - Successfully follow a user', async () => {
    const res = await request(server)
      .post(`/api/users/${followeeUsername}/follow`)
      .set('Authorization', `Bearer ${followerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Successfully followed');

    // Verify follower count incremented
    const stmt = db.prepare('SELECT follower_count FROM Users WHERE username = ?');
    const followee = stmt.get(followeeUsername);
    expect(followee.follower_count).toBe(1);
  });

  test('POST /api/users/:username/follow - Cannot follow self', async () => {
    const res = await request(server)
      .post(`/api/users/${followerUsername}/follow`)
      .set('Authorization', `Bearer ${followerToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Cannot follow yourself');
  });

  test('POST /api/users/:username/follow - Cannot follow already followed user', async () => {
    const res = await request(server)
      .post(`/api/users/${followeeUsername}/follow`)
      .set('Authorization', `Bearer ${followerToken}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Already following this user');
  });

  test('GET /api/users/:username/following - Get following list', async () => {
    const res = await request(server)
      .get(`/api/users/${followerUsername}/following`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].username).toBe(followeeUsername);
  });

  test('DELETE /api/users/:username/follow - Successfully unfollow a user', async () => {
    const res = await request(server)
      .delete(`/api/users/${followeeUsername}/follow`)
      .set('Authorization', `Bearer ${followerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Successfully unfollowed');

    // Verify follower count decremented
    const stmt = db.prepare('SELECT follower_count FROM Users WHERE username = ?');
    const followee = stmt.get(followeeUsername);
    expect(followee.follower_count).toBe(0);
  });

  test('DELETE /api/users/:username/follow - Cannot unfollow user not followed', async () => {
    const res = await request(server)
      .delete(`/api/users/${followeeUsername}/follow`)
      .set('Authorization', `Bearer ${followerToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Not following this user');
  });
});