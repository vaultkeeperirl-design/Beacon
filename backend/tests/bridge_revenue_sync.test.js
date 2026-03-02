const Client = require("socket.io-client");
const request = require('supertest');
const { server, io, JWT_SECRET } = require("../server");
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe("Bridge Revenue Real-time Sync", () => {
  let port;
  let clientSocketHost, clientSocketGuest, tokenTipper;
  let tipperUser, hostUser, guestUser;

  beforeAll(async () => {
    // Clear Users table for isolation
    db.prepare('DELETE FROM Users').run();

    const timestamp = Date.now();
    tipperUser = `tipper_${timestamp}`;
    hostUser = `host_${timestamp}`;
    guestUser = `guest_${timestamp}`;

    // Create users for testing
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);

    const insertStmt = db.prepare('INSERT OR IGNORE INTO Users (username, password_hash, credits) VALUES (?, ?, ?)');

    const tipperInfo = insertStmt.run(tipperUser, hash, 500.0);
    insertStmt.run(hostUser, hash, 0.0);
    insertStmt.run(guestUser, hash, 0.0);

    let tipperId = tipperInfo.lastInsertRowid;
    if (tipperInfo.changes === 0) {
      db.prepare('UPDATE Users SET credits = 500.0 WHERE username = ?').run(tipperUser);
      db.prepare('UPDATE Users SET credits = 0.0 WHERE username = ?').run(hostUser);
      db.prepare('UPDATE Users SET credits = 0.0 WHERE username = ?').run(guestUser);
      tipperId = db.prepare('SELECT id FROM Users WHERE username = ?').get(tipperUser).id;
    }

    // Generate tokens
    tokenTipper = jwt.sign({ id: tipperId, username: tipperUser }, JWT_SECRET, { expiresIn: '1h' });

    return new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  afterAll((done) => {
    io.close();
    server.close(done);
  });

  afterEach(() => {
    if (clientSocketHost) clientSocketHost.close();
    if (clientSocketGuest) clientSocketGuest.close();
  });

  test("Should emit wallet-update to host and guest when a tip is received", (done) => {
    const streamId = hostUser;
    let hostReceivedUpdate = false;
    let guestReceivedUpdate = false;

    // 1. Host and Guest connect via Socket.io
    clientSocketHost = Client(`http://localhost:${port}`);
    clientSocketGuest = Client(`http://localhost:${port}`);

    clientSocketHost.on("connect", () => {
      clientSocketHost.emit("join-stream", { streamId, username: hostUser });

      // 2. Set the squad
      clientSocketHost.emit("update-squad", {
        streamId,
        squad: [
          { name: hostUser, split: 70 },
          { name: guestUser, split: 30 }
        ]
      });

      clientSocketGuest.on("connect", () => {
        clientSocketGuest.emit("join-stream", { streamId, username: guestUser });

        // Listen for wallet updates
        clientSocketHost.on("wallet-update", (data) => {
           if (data.balance === 70) hostReceivedUpdate = true;
        });

        clientSocketGuest.on("wallet-update", (data) => {
           if (data.balance === 30) guestReceivedUpdate = true;
        });

        // 3. Tipper sends tip via REST API after squad is set
        setTimeout(async () => {
          try {
            const res = await request(server)
              .post('/api/tip')
              .set('Authorization', `Bearer ${tokenTipper}`)
              .send({ streamId, amount: 100 });

            expect(res.statusCode).toBe(200);

            // 4. Wait for socket events
            setTimeout(() => {
              try {
                expect(hostReceivedUpdate).toBe(true);
                expect(guestReceivedUpdate).toBe(true);
                done();
              } catch (err) {
                done(err);
              }
            }, 500);
          } catch (err) {
            done(err);
          }
        }, 300);
      });
    });
  }, 10000);
});
