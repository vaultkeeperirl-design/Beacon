const { server, io, JWT_SECRET } = require('../server');
const Client = require('socket.io-client');
const request = require('supertest');
const db = require('../db');

describe('Security: Squad Split Infinite Money Vulnerability', () => {
  let clientSocket;

  // Use unique names to avoid conflicts with tests that DELETE FROM Users
  const timestamp = Date.now();
  const hostUser = `host_split_${timestamp}`;
  const tipperUser = `tipper_split_${timestamp}`;
  const friendUser = `friend_split_${timestamp}`;

  beforeAll((done) => {
    // Other tests (like revenue.test.js) run DELETE FROM Users in beforeAll.
    // So we wait for a moment to let them run, to ensure our inserts survive,
    // or better yet, since we can't control test execution order natively, we insert right before our test logic
    // Actually wait, beforeAll in parallel is tricky, let's insert again right before the logic.
    server.listen(0, () => {
      done();
    });
  });

  afterAll((done) => {
    if (clientSocket) clientSocket.disconnect();
    io.close();
    if (server.listening) {
      server.close(done);
    } else {
      done();
    }
  });

  it('should not allow negative splits to generate infinite money', (done) => {
    // Re-insert right before test to avoid getting wiped by other tests' beforeAll hooks
    const insertStmt = db.prepare('INSERT OR IGNORE INTO Users (username, password_hash, credits) VALUES (?, ?, ?)');

    let info = insertStmt.run(hostUser, 'hash', 100);
    if (info.changes === 0) db.prepare('UPDATE Users SET credits = 100 WHERE username = ?').run(hostUser);

    info = insertStmt.run(tipperUser, 'hash', 100);
    if (info.changes === 0) db.prepare('UPDATE Users SET credits = 100 WHERE username = ?').run(tipperUser);

    info = insertStmt.run(friendUser, 'hash', 100);
    if (info.changes === 0) db.prepare('UPDATE Users SET credits = 100 WHERE username = ?').run(friendUser);

    const port = server.address().port;
    clientSocket = new Client(`http://localhost:${port}`);

    clientSocket.on('connect', () => {
      const jwt = require('jsonwebtoken');
      const hostToken = jwt.sign({ username: hostUser }, JWT_SECRET);
      clientSocket.emit('register-auth', { token: hostToken });
      clientSocket.emit('join-stream', { streamId: hostUser, username: hostUser });

      // Attempt to exploit by setting negative split
      clientSocket.emit('update-squad', {
        streamId: hostUser,
        squad: [
          { name: hostUser, split: 200 },
          { name: friendUser, split: -100 }
        ]
      });

      setTimeout(async () => {
        const jwt = require('jsonwebtoken');
        const tipperId = db.prepare('SELECT id FROM Users WHERE username = ?').get(tipperUser).id;
        const token = jwt.sign({ id: tipperId, username: tipperUser }, JWT_SECRET);

        await request(server)
          .post('/api/tip')
          .set('Authorization', `Bearer ${token}`)
          .send({ streamId: hostUser, amount: 10 });

        const hostCredits = db.prepare("SELECT credits FROM Users WHERE username = ?").get(hostUser).credits;
        const friendCredits = db.prepare("SELECT credits FROM Users WHERE username = ?").get(friendUser).credits;

        try {
          expect(hostCredits).toBe(110);
          expect(friendCredits).toBe(100);
          done();
        } catch (e) {
          done(e);
        }
      }, 500);
    });
  });
});
