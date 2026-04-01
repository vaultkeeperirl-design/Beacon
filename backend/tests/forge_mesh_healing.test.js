const { server, io, streamMeshTopology } = require('../server');
const Client = require('socket.io-client');

// Mock Database to bypass native binding issues in the sandbox environment
jest.mock('../db', () => ({
  prepare: jest.fn().mockReturnValue({
    get: jest.fn().mockReturnValue({ credits: 100, avatar_url: null }),
    run: jest.fn(),
    all: jest.fn().mockReturnValue([])
  }),
  transaction: jest.fn((fn) => fn),
  pragma: jest.fn(),
  exec: jest.fn()
}));

describe("Mesh Healing Logic Verification", () => {
  let port;

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

  const createSocket = () => {
    return new Promise((resolve) => {
      const socket = Client(`http://localhost:${port}`);
      socket.on('connect', () => resolve(socket));
    });
  };

  test("Should heal orphaned viewer when broadcaster joins late", async () => {
    const streamId = "late_broadcaster_room";
    const viewerSocket = await createSocket();

    viewerSocket.emit('join-stream', { streamId, username: 'viewer1' });

    // Wait for mesh to register viewer
    await new Promise(r => setTimeout(r, 500));

    const mesh = streamMeshTopology.get(streamId);
    expect(mesh.get(viewerSocket.id).parent).toBeNull();

    const hostSocket = await createSocket();

    return new Promise((resolve, reject) => {
      hostSocket.on('p2p-initiate-connection', ({ childId }) => {
        try {
          expect(childId).toBe(viewerSocket.id);
          expect(mesh.get(viewerSocket.id).parent).toBe(hostSocket.id);
          hostSocket.close();
          viewerSocket.close();
          resolve();
        } catch (err) {
          hostSocket.close();
          viewerSocket.close();
          reject(err);
        }
      });

      hostSocket.emit('join-stream', { streamId, username: streamId });
    });
  }, 10000);

  test("Should heal orphans when a relay node transitions to positive uploadMbps", async () => {
     const streamId = "relay_heal_room";
     const hostSocket = await createSocket();
     const relaySocket = await createSocket();
     const child2Socket = await createSocket();
     const orphanSocket = await createSocket();

     hostSocket.emit('join-stream', { streamId, username: streamId });
     relaySocket.emit('join-stream', { streamId, username: 'relay1' });
     child2Socket.emit('join-stream', { streamId, username: 'child2' });

     // Wait for host to take 2 children (relay1 and child2)
     await new Promise(r => setTimeout(r, 500));

     orphanSocket.emit('join-stream', { streamId, username: 'orphan1' });
     await new Promise(r => setTimeout(r, 500));

     const mesh = streamMeshTopology.get(streamId);
     expect(mesh.get(orphanSocket.id).parent).toBeNull();

     return new Promise((resolve, reject) => {
        relaySocket.on('p2p-initiate-connection', ({ childId }) => {
           try {
              expect(childId).toBe(orphanSocket.id);
              expect(mesh.get(orphanSocket.id).parent).toBe(relaySocket.id);

              hostSocket.close();
              relaySocket.close();
              child2Socket.close();
              orphanSocket.close();
              resolve();
           } catch (err) {
              hostSocket.close();
              relaySocket.close();
              child2Socket.close();
              orphanSocket.close();
              reject(err);
           }
        });

        relaySocket.emit('metrics-report', { streamId, latency: 20, uploadMbps: 50 });
     });
  }, 15000);
});
