const Client = require("socket.io-client");
const { server, io, JWT_SECRET } = require("../server");
const jwt = require('jsonwebtoken');
const db = require('../db');

describe("Metrics Data Type Integrity", () => {
  let port;
  let clientSocket;

  beforeAll((done) => {
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    server.close(done);
  });

  beforeEach(() => {
    clientSocket = new Client(`http://localhost:${port}`);
  });

  afterEach(() => {
    if (clientSocket.connected) clientSocket.disconnect();
  });

  test("should handle uploadMbps as a string without causing concatenation in revenue distribution", (done) => {
    const streamId = "test-stream-" + Date.now();
    const username1 = "user1-" + Date.now();
    const username2 = "user2-" + Date.now();
    const token1 = jwt.sign({ username: username1 }, JWT_SECRET);
    const token2 = jwt.sign({ username: username2 }, JWT_SECRET);

    // Setup: 2 users reporting metrics (one as string, one as number)
    const socket1 = new Client(`http://localhost:${port}`);
    const socket2 = new Client(`http://localhost:${port}`);

    let readyCount = 0;
    const onReady = () => {
      readyCount++;
      if (readyCount === 2) {
        // Both joined, now report metrics
        socket1.emit("metrics-report", {
          streamId,
          latency: 10,
          uploadMbps: "10" // String!
        });
        socket2.emit("metrics-report", {
          streamId,
          latency: 10,
          uploadMbps: 20 // Number
        });

        // Wait for metrics to be processed
        setTimeout(() => {
          // Trigger a tip to trigger distribution
          // We can call the internal function if exported, or use the API
          // Since we want to check the internal state/emissions, let's use the API
          const request = require('supertest');
          request(server)
            .post('/api/tip')
            .set('Authorization', `Bearer ${token1}`) // user1 tips
            .send({ streamId, amount: 100 })
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);

              // Distribution: 20% of 100 = 20 CR for relayers.
              // Total bandwidth should be 10 + 20 = 30.
              // user1 (relay) should get (10/30) * 20 = 6.66
              // user2 (relay) should get (20/30) * 20 = 13.33

              // If bug exists (concatenation), totalBandwidth = "010" + 20 = "01020" = 1020
              // user1 gets (10/1020) * 20 = 0.196
              // user2 gets (20/1020) * 20 = 0.392

              // We can't easily check the balance without another API call or listening to wallet-update
              // Let's listen to wallet-update on socket2
              socket2.on("wallet-update", (data) => {
                try {
                  // If bug exists, balance will be very low (~0.39)
                  // If fixed, balance should be ~13.33 (assuming starting balance 0)
                  // Wait, we need to ensure they are in DB to get wallet updates
                  expect(data.balance).toBeGreaterThan(10);
                  socket1.disconnect();
                  socket2.disconnect();
                  done();
                } catch (e) {
                  socket1.disconnect();
                  socket2.disconnect();
                  done(e);
                }
              });
            });
        }, 200);
      }
    };

    // Initialize users in DB
    const prepareDB = () => {
        db.prepare("INSERT OR IGNORE INTO Users (username, password_hash, credits) VALUES (?, 'hash', 0)").run(username1);
        db.prepare("INSERT OR IGNORE INTO Users (username, password_hash, credits) VALUES (?, 'hash', 0)").run(username2);
    };
    prepareDB();

    socket1.on("connect", () => {
      socket1.emit("register-auth", { token: token1 });
      socket1.emit("join-stream", { streamId, username: username1 });
      socket1.on("room-users-update", onReady);
    });

    socket2.on("connect", () => {
      socket2.emit("register-auth", { token: token2 });
      socket2.emit("join-stream", { streamId, username: username2 });
      // socket2 will also get room-users-update
    });
  }, 10000);
});
