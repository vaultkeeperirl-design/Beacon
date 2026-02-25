const { io: ioServer, server: httpServer } = require('../server');
const Client = require('socket.io-client');

describe('Signaling Server', () => {
  let clientSocket1, clientSocket2;
  let port;

  beforeAll((done) => {
    httpServer.listen(() => {
      port = httpServer.address().port;
      done();
    });
  });

  afterAll((done) => {
    ioServer.close();
    httpServer.close();
    done();
  });

  beforeEach((done) => {
    clientSocket1 = new Client(`http://localhost:${port}`);
    clientSocket2 = new Client(`http://localhost:${port}`);

    let connectedCount = 0;
    const onConnect = () => {
      connectedCount++;
      if (connectedCount === 2) done();
    };

    clientSocket1.on('connect', onConnect);
    clientSocket2.on('connect', onConnect);
  });

  afterEach(() => {
    if (clientSocket1.connected) clientSocket1.disconnect();
    if (clientSocket2.connected) clientSocket2.disconnect();
  });

  test('should allow users to join a room and notify others', (done) => {
    const roomId = 'room-1';
    const user1Id = 'user-1';
    const user2Id = 'user-2';

    // Client 1 joins room
    clientSocket1.emit('join-room', roomId, user1Id);

    // Client 1 listens for user-connected (triggered when Client 2 joins)
    clientSocket1.on('user-connected', (id) => {
      try {
        expect(id).toBe(user2Id);
        done();
      } catch (error) {
        done(error);
      }
    });

    // Client 2 joins room after a short delay
    setTimeout(() => {
      clientSocket2.emit('join-room', roomId, user2Id);
    }, 50);
  });

  test('should relay offer to target peer', (done) => {
    const targetSocketId = clientSocket2.id;
    const payload = {
      target: targetSocketId,
      caller: clientSocket1.id,
      sdp: 'mock-sdp-offer'
    };

    clientSocket2.on('offer', (receivedPayload) => {
      try {
        expect(receivedPayload).toEqual(payload);
        done();
      } catch (error) {
        done(error);
      }
    });

    clientSocket1.emit('offer', payload);
  });

  test('should relay answer to target peer', (done) => {
    const targetSocketId = clientSocket1.id;
    const payload = {
      target: targetSocketId,
      caller: clientSocket2.id,
      sdp: 'mock-sdp-answer'
    };

    clientSocket1.on('answer', (receivedPayload) => {
      try {
        expect(receivedPayload).toEqual(payload);
        done();
      } catch (error) {
        done(error);
      }
    });

    clientSocket2.emit('answer', payload);
  });

  test('should relay ice-candidate to target peer', (done) => {
    const targetSocketId = clientSocket2.id;
    const payload = {
      target: targetSocketId,
      candidate: 'mock-candidate'
    };

    clientSocket2.on('ice-candidate', (receivedPayload) => {
      try {
        expect(receivedPayload).toEqual(payload);
        done();
      } catch (error) {
        done(error);
      }
    });

    clientSocket1.emit('ice-candidate', payload);
  });

  test('should not crash on invalid offer payload', (done) => {
    // Send invalid payload (missing target)
    clientSocket1.emit('offer', { sdp: 'invalid' });

    // Server should remain responsive. Verify by sending a valid message.
    const targetSocketId = clientSocket2.id;
    const validPayload = {
      target: targetSocketId,
      caller: clientSocket1.id,
      sdp: 'valid-sdp'
    };

    clientSocket2.on('offer', (receivedPayload) => {
      try {
        expect(receivedPayload).toEqual(validPayload);
        done();
      } catch (error) {
        done(error);
      }
    });

    // Send valid payload after invalid one
    setTimeout(() => {
      clientSocket1.emit('offer', validPayload);
    }, 20);
  });

  test('should notify others when a user disconnects', (done) => {
    const roomId = 'room-disconnect';
    const user1Id = 'user-d1';
    const user2Id = 'user-d2';

    // Client 2 joins first
    clientSocket2.emit('join-room', roomId, user2Id);

    // Client 1 joins
    setTimeout(() => {
      clientSocket1.emit('join-room', roomId, user1Id);
    }, 20);

    // Wait for Client 2 to see Client 1 join, then disconnect Client 1
    clientSocket2.on('user-connected', (id) => {
      if (id === user1Id) {
        clientSocket1.disconnect();
      }
    });

    clientSocket2.on('user-disconnected', (id) => {
      try {
        expect(id).toBe(user1Id);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
