const { server, io, JWT_SECRET } = require('../server');
const Client = require('socket.io-client');
const request = require('supertest');
const db = require('../db');

describe('Security: Squad Split Infinite Money Vulnerability', () => {
  let clientSocket;

  beforeAll((done) => {
    const insertStmt = db.prepare('INSERT OR IGNORE INTO Users (username, password_hash, credits) VALUES (?, ?, ?)');

    let info = insertStmt.run('host', 'hash', 100);
    if (info.changes === 0) db.prepare('UPDATE Users SET credits = 100 WHERE username = ?').run('host');

    info = insertStmt.run('tipper', 'hash', 100);
    if (info.changes === 0) db.prepare('UPDATE Users SET credits = 100 WHERE username = ?').run('tipper');

    info = insertStmt.run('friend', 'hash', 100);
    if (info.changes === 0) db.prepare('UPDATE Users SET credits = 100 WHERE username = ?').run('friend');

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
    const port = server.address().port;
    clientSocket = new Client(`http://localhost:${port}`);

    clientSocket.on('connect', () => {
      clientSocket.emit('join-stream', { streamId: 'host', username: 'host' });

      // Attempt to exploit by setting negative split
      clientSocket.emit('update-squad', {
        streamId: 'host',
        squad: [
          { name: 'host', split: 200 },
          { name: 'friend', split: -100 }
        ]
      });

      setTimeout(async () => {
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: 2, username: 'tipper' }, JWT_SECRET);

        await request(server)
          .post('/api/tip')
          .set('Authorization', `Bearer ${token}`)
          .send({ streamId: 'host', amount: 10 });

        const hostCredits = db.prepare("SELECT credits FROM Users WHERE username = 'host'").get().credits;
        const friendCredits = db.prepare("SELECT credits FROM Users WHERE username = 'friend'").get().credits;

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
