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
    // clientSocket2.id is available since we waited for connect in beforeEach
    const user2Id = clientSocket2.id;

    // Client 1 joins room
    clientSocket1.emit('join-stream', { streamId: roomId, username: 'User1' });

    // Client 1 listens for user-connected (triggered when Client 2 joins)
    clientSocket1.on('user-connected', (data) => {
      try {
        expect(data.id).toBe(user2Id);
        expect(data.username).toBe('User2');
        done();
      } catch (error) {
        done(error);
      }
    });

    // Client 2 joins room after a short delay
    setTimeout(() => {
      clientSocket2.emit('join-stream', { streamId: roomId, username: 'User2' });
    }, 100);
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
        const expected = { ...payload, sender: clientSocket1.id };
        expect(receivedPayload).toEqual(expected);
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
        const expected = { ...payload, sender: clientSocket2.id };
        expect(receivedPayload).toEqual(expected);
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
        const expected = { ...payload, sender: clientSocket1.id };
        expect(receivedPayload).toEqual(expected);
        done();
      } catch (error) {
        done(error);
      }
    });

    clientSocket1.emit('ice-candidate', payload);
  });

  test('should not crash on invalid offer payload', (done) => {
    clientSocket1.emit('offer', { sdp: 'invalid' });

    const targetSocketId = clientSocket2.id;
    const validPayload = {
      target: targetSocketId,
      caller: clientSocket1.id,
      sdp: 'valid-sdp'
    };

    clientSocket2.on('offer', (receivedPayload) => {
      try {
        const expected = { ...validPayload, sender: clientSocket1.id };
        expect(receivedPayload).toEqual(expected);
        done();
      } catch (error) {
        done(error);
      }
    });

    setTimeout(() => {
      clientSocket1.emit('offer', validPayload);
    }, 20);
  });

  test('should notify others when a user disconnects', (done) => {
    const roomId = 'room-disconnect';
    const user1Id = clientSocket1.id; // Store ID before disconnect

    clientSocket2.emit('join-stream', { streamId: roomId, username: 'User2' });

    setTimeout(() => {
      clientSocket1.emit('join-stream', { streamId: roomId, username: 'User1' });
    }, 20);

    clientSocket2.on('user-connected', (data) => {
      if (data.id === user1Id) {
        clientSocket1.disconnect();
      }
    });

    clientSocket2.on('user-disconnected', (data) => {
      try {
        expect(data.id).toBe(user1Id);
        expect(data.username).toBe('User1');
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
