const { io, broadcasterSessions, updateBroadcasterSession, isAnotherBroadcasterActive, JWT_SECRET } = require('../server');
const Client = require('socket.io-client');
const http = require('http');
const jwt = require('jsonwebtoken');

// Mock database to avoid dependency on better-sqlite3 for this logic test
jest.mock('../db', () => ({
  prepare: jest.fn().mockReturnValue({
    get: jest.fn().mockReturnValue({ id: 1, username: 'host', avatar_url: null }),
    run: jest.fn()
  }),
  transaction: jest.fn(fn => fn)
}));

describe('O(1) Broadcaster Session Tracking', () => {
  let httpServer;
  let httpServerAddr;
  let client1;

  beforeAll((done) => {
    httpServer = http.createServer().listen();
    httpServerAddr = httpServer.address();
    io.attach(httpServer);
    done();
  });

  afterAll((done) => {
    io.close();
    httpServer.close();
    done();
  });

  beforeEach(() => {
    broadcasterSessions.clear();
  });

  afterEach((done) => {
    if (client1 && client1.connected) client1.disconnect();
    done();
  });

  const createClient = () => {
    return new Client(`http://localhost:${httpServerAddr.port}`, {
      reconnectionDelay: 0,
      forceNew: true,
      transports: ['websocket'],
    });
  };

  test('updateBroadcasterSession should add and remove sessions', () => {
    const streamId = 'test-stream';
    const socketId = 'test-socket';

    updateBroadcasterSession(streamId, socketId, true);
    expect(broadcasterSessions.get(streamId).has(socketId)).toBe(true);

    updateBroadcasterSession(streamId, socketId, false);
    expect(broadcasterSessions.has(streamId)).toBe(false);
  });

  test('isAnotherBroadcasterActive should return correct status', () => {
    const streamId = 'test-stream';
    const socketId1 = 'socket-1';
    const socketId2 = 'socket-2';

    updateBroadcasterSession(streamId, socketId1, true);
    expect(isAnotherBroadcasterActive(streamId, socketId1)).toBe(false);
    expect(isAnotherBroadcasterActive(streamId, 'none')).toBe(true);

    updateBroadcasterSession(streamId, socketId2, true);
    expect(isAnotherBroadcasterActive(streamId, socketId1)).toBe(true);
  });

  test('register-auth should update session if stream matches', (done) => {
    client1 = createClient();
    const username = 'host';
    const token = jwt.sign({ username }, JWT_SECRET);

    client1.on('connect', () => {
      // First join a room to set socket.currentRoom
      client1.emit('join-stream', { streamId: username, username });

      setTimeout(() => {
        client1.emit('register-auth', { token });

        setTimeout(() => {
          try {
            expect(broadcasterSessions.get(username).has(client1.id)).toBe(true);
            done();
          } catch (e) {
            done(e);
          }
        }, 100);
      }, 100);
    });
  });
});
