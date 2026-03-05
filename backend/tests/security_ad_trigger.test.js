const { server, io, JWT_SECRET } = require('../server');
const request = require('supertest');
const db = require('../db');
const jwt = require('jsonwebtoken');
const Client = require('socket.io-client');

describe('Security: Ad Trigger Rate Limit', () => {
  let port;
  let clientSocket;

  beforeAll((done) => {
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    if (clientSocket) clientSocket.disconnect();
    io.close();
    server.close(done);
  });

  it('should not allow spamming ad triggers', async () => {
    const username = `spammer_${Date.now()}`;
    const insertStmt = db.prepare('INSERT OR IGNORE INTO Users (username, password_hash, credits) VALUES (?, ?, ?)');
    insertStmt.run(username, 'hash', 0);

    // Get user id
    const userId = db.prepare('SELECT id FROM Users WHERE username = ?').get(username).id;
    const token = jwt.sign({ id: userId, username }, JWT_SECRET);

    // Join room so viewer count > 0
    clientSocket = new Client(`http://localhost:${port}`);
    await new Promise(r => clientSocket.on('connect', r));
    clientSocket.emit('join-stream', { streamId: username, username });

    // Wait for join
    await new Promise(r => setTimeout(r, 200));

    // Call ad trigger 10 times quickly
    for(let i = 0; i < 10; i++) {
        await request(server)
            .post('/api/ads/trigger')
            .set('Authorization', `Bearer ${token}`)
            .send({ streamId: username });
    }

    const credits = db.prepare("SELECT credits FROM Users WHERE username = ?").get(username).credits;
    console.log(`Credits after 10 triggers: ${credits}`);

    // Expecting some rate limit
    expect(credits).toBeLessThan(5); // 10 calls * 0.5 CR = 5 CR if no limit
  });
});
