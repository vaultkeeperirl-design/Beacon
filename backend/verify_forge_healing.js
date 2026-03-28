const mockDb = {
  prepare: () => ({
    run: () => ({ lastInsertRowid: 1, changes: 1 }),
    get: () => ({ credits: 100, id: 1, username: 'test', avatar_url: null, bio: 'bio' }),
    all: () => []
  }),
  transaction: (fn) => fn,
  exec: () => {},
  pragma: () => {}
};

// Mock the database module before requiring server
require.cache[require.resolve('./db')] = {
  exports: mockDb
};

const serverModule = require('./server');

// Since addNodeToMesh is not exported, we have to use a trick or export it.
// I'll update server.js later to export it, but for the reproduction,
// I'll try to use what's available or just accept it's a "TODO" in the server.

// Actually, I can't easily access non-exported functions.
// I'll update server.js to export them FIRST, then run the script.
// But the plan says create script first.

/**
 * Reproduction Script for Mesh Healing and Parent Selection Logic
 */
async function verifyMeshHealing() {
  const { activeStreams, streamMeshTopology, addNodeToMesh, healOrphans, io } = require('./server');

  if (!addNodeToMesh) {
    console.log('❌ VERIFICATION FAILED: addNodeToMesh is not exported from server.js');
    process.exit(1);
  }

  const streamId = 'test_stream';
  activeStreams.set(streamId, { streamer: streamId });

  // Mock socket.io to capture emissions
  const emittedEvents = [];
  io.to = (room) => ({
    emit: (event, data) => {
      emittedEvents.push({ room, event, data });
    }
  });
  io.sockets.sockets = new Map();

  console.log('--- Phase 1: Filling Broadcaster Capacity ---');
  const broadcasterId = 'broadcaster_socket';
  io.sockets.sockets.set(broadcasterId, { id: broadcasterId, currentRoom: streamId });
  addNodeToMesh(streamId, broadcasterId, true);

  const v1Id = 'viewer1_socket';
  io.sockets.sockets.set(v1Id, { id: v1Id, currentRoom: streamId });
  addNodeToMesh(streamId, v1Id, false);

  const v2Id = 'viewer2_socket';
  io.sockets.sockets.set(v2Id, { id: v2Id, currentRoom: streamId });
  addNodeToMesh(streamId, v2Id, false);

  const mesh = streamMeshTopology.get(streamId);
  const broadcasterNode = mesh.get(broadcasterId);
  console.log(`Broadcaster children: ${Array.from(broadcasterNode.children)}`);

  console.log('\n--- Phase 2: Adding Orphan ---');
  const v3Id = 'viewer3_socket';
  io.sockets.sockets.set(v3Id, { id: v3Id, currentRoom: streamId });
  addNodeToMesh(streamId, v3Id, false);

  const v3Node = mesh.get(v3Id);
  console.log(`Viewer 3 parent: ${v3Node.parent || 'NONE (Orphan)'}`);

  if (v3Node.parent) {
    throw new Error('Viewer 3 should have been an orphan because broadcaster is full and no relays have bandwidth');
  }

  console.log('\n--- Phase 3: Relayer Reports Bandwidth (Should trigger heal) ---');
  const v1Node = mesh.get(v1Id);
  v1Node.metrics.uploadMbps = 10;

  if (typeof healOrphans === 'function') {
    healOrphans(streamId);
  } else {
    console.log('WARNING: healOrphans function not found in exports. Healing cannot be triggered.');
  }

  console.log(`Viewer 3 parent after relay bandwidth: ${v3Node.parent || 'NONE (STILL ORPHAN)'}`);

  if (!v3Node.parent) {
    console.log('\n❌ VERIFICATION FAILED: Mesh did not heal the orphan after a relay became viable.');
    process.exit(1);
  } else {
    console.log('\n✅ VERIFICATION SUCCESS: Mesh healed the orphan!');
    process.exit(0);
  }
}

verifyMeshHealing().catch(err => {
  console.error(err);
  process.exit(1);
});
