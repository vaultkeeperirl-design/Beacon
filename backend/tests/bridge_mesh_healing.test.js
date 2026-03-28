const { activeStreams, streamMeshTopology, addNodeToMesh, healOrphans, io } = require('../server');

// Mock socket.io
io.to = jest.fn().mockReturnValue({
  emit: jest.fn()
});
io.sockets.sockets = new Map();

// Mock database
jest.mock('../db', () => ({
  prepare: jest.fn().mockReturnValue({
    run: jest.fn().mockReturnValue({ lastInsertRowid: 1, changes: 1 }),
    get: jest.fn().mockReturnValue({ credits: 100, id: 1, username: 'test', avatar_url: null, bio: 'bio' }),
    all: jest.fn().mockReturnValue([])
  }),
  transaction: jest.fn(fn => fn),
  exec: jest.fn(),
  pragma: jest.fn()
}));

describe("Bridge: Mesh Healing and Parent Selection", () => {
  const streamId = 'test_stream_jest';

  beforeEach(() => {
    activeStreams.clear();
    streamMeshTopology.clear();
    io.sockets.sockets.clear();
    activeStreams.set(streamId, { streamer: streamId });
  });

  test("Should not assign parent with 0 bandwidth", () => {
    const broadcasterId = 'broadcaster';
    io.sockets.sockets.set(broadcasterId, { id: broadcasterId });
    addNodeToMesh(streamId, broadcasterId, true);

    const v1Id = 'viewer1';
    io.sockets.sockets.set(v1Id, { id: v1Id });
    addNodeToMesh(streamId, v1Id, false);

    const v2Id = 'viewer2';
    io.sockets.sockets.set(v2Id, { id: v2Id });
    addNodeToMesh(streamId, v2Id, false);

    // Broadcaster (limit 2) should be full.
    // Now add a 3rd viewer. Since v1 and v2 have 0 bandwidth, they shouldn't be picked.
    const v3Id = 'viewer3';
    io.sockets.sockets.set(v3Id, { id: v3Id });
    addNodeToMesh(streamId, v3Id, false);

    const mesh = streamMeshTopology.get(streamId);
    expect(mesh.get(v3Id).parent).toBeNull();
  });

  test("Should heal orphans when bandwidth becomes available", () => {
    const broadcasterId = 'broadcaster';
    io.sockets.sockets.set(broadcasterId, { id: broadcasterId });
    addNodeToMesh(streamId, broadcasterId, true);

    // Fill broadcaster
    addNodeToMesh(streamId, 'v1', false);
    addNodeToMesh(streamId, 'v2', false);

    // Add orphan
    addNodeToMesh(streamId, 'orphan', false);
    const mesh = streamMeshTopology.get(streamId);
    expect(mesh.get('orphan').parent).toBeNull();

    // Give v1 some bandwidth
    mesh.get('v1').metrics.uploadMbps = 10;

    // Trigger heal
    healOrphans(streamId);

    expect(mesh.get('orphan').parent).toBe('v1');
  });

  test("Should sever parent relationship on promotion to broadcaster", () => {
    const rootId = 'root';
    addNodeToMesh(streamId, rootId, true);

    const relayId = 'relay';
    addNodeToMesh(streamId, relayId, false);

    const mesh = streamMeshTopology.get(streamId);
    expect(mesh.get(relayId).parent).toBe(rootId);

    // Promote relay to broadcaster (e.g. they authenticated as the owner)
    addNodeToMesh(streamId, relayId, true);

    expect(mesh.get(relayId).parent).toBeNull();
    expect(mesh.get(rootId).children.has(relayId)).toBe(false);
  });
});
