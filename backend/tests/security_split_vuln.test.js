const { server, io } = require('../server');
const Client = require('socket.io-client');
const request = require('supertest');
const db = require('../db');

describe('Security: Squad Split Infinite Money Vulnerability', () => {
  let clientSocket;

  beforeAll((done) => {
    // Clear DB
    db.prepare('DELETE FROM Users').run();
    // Create users
    db.prepare("INSERT INTO Users (username, password_hash, credits) VALUES ('host', 'hash', 100)").run();
    db.prepare("INSERT INTO Users (username, password_hash, credits) VALUES ('tipper', 'hash', 100)").run();
    db.prepare("INSERT INTO Users (username, password_hash, credits) VALUES ('friend', 'hash', 100)").run();

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
        const token = jwt.sign({ id: 2, username: 'tipper' }, process.env.JWT_SECRET || 'super_secret_beacon_key_123');

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
