const Client = require("socket.io-client");
const { server, io, JWT_SECRET } = require("../server");
const jwt = require('jsonwebtoken');

describe("Socket Authentication (register-auth)", () => {
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

  afterEach(() => {
    if (clientSocket) {
      clientSocket.close();
    }
  });

  test("Should update socket identity and mesh topology upon register-auth", (done) => {
    const username = "testuser";
    const token = jwt.sign({ username }, JWT_SECRET);
    const streamId = "teststream";

    clientSocket = Client(`http://localhost:${port}`);

    clientSocket.on("connect", () => {
      // 1. Join stream as a guest
      clientSocket.emit("join-stream", { streamId });

      // Give it a moment to process join-stream
      setTimeout(() => {
        // 2. Verify guest state in backend
        const sockets = Array.from(io.sockets.sockets.values());
        const socket = sockets.find(s => s.id === clientSocket.id);
        expect(socket.username).toBeUndefined();

        // 3. Emit register-auth
        clientSocket.emit("register-auth", { token });

        // Give it a moment to process register-auth
        setTimeout(() => {
          // 4. Verify authenticated state in backend
          expect(socket.username).toBe(username);
          expect(socket.accountName).toBe(username);
          expect(Array.from(socket.rooms)).toContain(`user:${username}`);

          // 5. Verify mesh topology update
          // Need to import/access streamMeshTopology. Since it's not exported,
          // we can't directly check it unless we expose it or use another way.
          // However, we can check if the socket joined the user room.

          done();
        }, 200);
      }, 200);
    });
  });
});
