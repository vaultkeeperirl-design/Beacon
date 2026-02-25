const { io: ioServer, server: httpServer } = require('../server');
const Client = require('socket.io-client');

describe('Signaling Server', () => {
  let clientSocket1, clientSocket2;
  let port;

  // Helper to wait for an event
  const waitFor = (socket, event) => {
    return new Promise((resolve) => {
      socket.once(event, resolve);
    });
  };

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

  test('should allow users to join a room and notify others', async () => {
    const roomId = 'room-1';
    const user2Id = clientSocket2.id;

    // Client 1 joins room
    clientSocket1.emit('join-stream', { streamId: roomId, username: 'User1' });
    // Wait for Client 1 to receive confirmation (room count update)
    await waitFor(clientSocket1, 'room-users-update');

    // Setup listener for Client 2 joining
    const userConnectedPromise = waitFor(clientSocket1, 'user-connected');

    // Client 2 joins room
    clientSocket2.emit('join-stream', { streamId: roomId, username: 'User2' });

    const data = await userConnectedPromise;
    expect(data.id).toBe(user2Id);
    expect(data.username).toBe('User2');
  });

  test('should relay offer to target peer', async () => {
    const targetSocketId = clientSocket2.id;
    const payload = {
      target: targetSocketId,
      caller: clientSocket1.id,
      sdp: 'mock-sdp-offer'
    };

    const offerPromise = waitFor(clientSocket2, 'offer');
    clientSocket1.emit('offer', payload);

    const receivedPayload = await offerPromise;
    const expected = { ...payload, sender: clientSocket1.id };
    expect(receivedPayload).toEqual(expected);
  });

  test('should relay answer to target peer', async () => {
    const targetSocketId = clientSocket1.id;
    const payload = {
      target: targetSocketId,
      caller: clientSocket2.id,
      sdp: 'mock-sdp-answer'
    };

    const answerPromise = waitFor(clientSocket1, 'answer');
    clientSocket2.emit('answer', payload);

    const receivedPayload = await answerPromise;
    const expected = { ...payload, sender: clientSocket2.id };
    expect(receivedPayload).toEqual(expected);
  });

  test('should relay ice-candidate to target peer', async () => {
    const targetSocketId = clientSocket2.id;
    const payload = {
      target: targetSocketId,
      candidate: 'mock-candidate'
    };

    const candidatePromise = waitFor(clientSocket2, 'ice-candidate');
    clientSocket1.emit('ice-candidate', payload);

    const receivedPayload = await candidatePromise;
    const expected = { ...payload, sender: clientSocket1.id };
    expect(receivedPayload).toEqual(expected);
  });

  test('should not crash on invalid offer payload', async () => {
    // Send invalid payload (missing target) - server should ignore
    clientSocket1.emit('offer', { sdp: 'invalid' });

    const targetSocketId = clientSocket2.id;
    const validPayload = {
      target: targetSocketId,
      caller: clientSocket1.id,
      sdp: 'valid-sdp'
    };

    const offerPromise = waitFor(clientSocket2, 'offer');
    clientSocket1.emit('offer', validPayload);

    const receivedPayload = await offerPromise;
    const expected = { ...validPayload, sender: clientSocket1.id };
    expect(receivedPayload).toEqual(expected);
  });

  test('should notify others when a user disconnects', async () => {
    const roomId = 'room-disconnect';
    const user1Id = clientSocket1.id;

    // Both join
    clientSocket2.emit('join-stream', { streamId: roomId, username: 'User2' });
    await waitFor(clientSocket2, 'room-users-update');

    const userConnectedPromise = waitFor(clientSocket2, 'user-connected');
    clientSocket1.emit('join-stream', { streamId: roomId, username: 'User1' });
    await userConnectedPromise;

    // Verify disconnect notification
    const userDisconnectedPromise = waitFor(clientSocket2, 'user-disconnected');
    clientSocket1.disconnect();

    const data = await userDisconnectedPromise;
    expect(data.id).toBe(user1Id);
    expect(data.username).toBe('User1');
  });
});
