const assert = require('assert');

// Mock the database before importing server
const mockDb = {
  prepare: () => ({
    get: () => ({ id: 1, username: 'testuser', credits: 100 }),
    run: () => ({ lastInsertRowid: 1, changes: 1 }),
    all: () => []
  }),
  transaction: (fn) => fn,
  pragma: () => {}
};

require.cache[require.resolve('./db')] = {
  exports: mockDb
};

const {
  addNodeToMesh,
  healOrphans,
  streamMeshTopology,
  activeStreams
} = require('./server');

// Mock Socket.IO
const io = require('./server').io;
io.to = () => ({ emit: () => {} });

async function runTests() {
  console.log('--- Starting Mesh Healing and Promotion Verification ---');

  const streamId = 'broadcaster1';
  const viewer1 = 'viewer1';
  const viewer2 = 'viewer2';

  // 1. Add an orphan viewer (no broadcaster yet)
  console.log('Step 1: Adding orphan viewer1');
  addNodeToMesh(streamId, viewer1, false);
  let mesh = streamMeshTopology.get(streamId);
  let node1 = mesh.get(viewer1);
  assert.strictEqual(node1.parent, null, 'Viewer1 should be an orphan');

  // 2. Add broadcaster - should trigger healing
  console.log('Step 2: Adding broadcaster, should heal viewer1');
  addNodeToMesh(streamId, streamId, true);
  assert.strictEqual(node1.parent, streamId, 'Viewer1 should now be parented to broadcaster');

  // 3. Broadcaster promotion (retroactive activation)
  console.log('Step 3: Testing broadcaster promotion (re-joining as broadcaster)');

  // Create a new stream for promotion testing to avoid parent-already-assigned return
  const sPromo = 'stream_promo';
  const hostId = 'host';
  const relayId = 'relay';
  const leafId = 'leaf';

  addNodeToMesh(sPromo, hostId, true);
  addNodeToMesh(sPromo, relayId, false);
  const meshPromo = streamMeshTopology.get(sPromo);
  const nodeRelay = meshPromo.get(relayId);
  assert.strictEqual(nodeRelay.parent, hostId);

  // Set relay metrics to make it a better parent than host for testing
  nodeRelay.metrics.uploadMbps = 1000;
  addNodeToMesh(sPromo, leafId, false);
  const nodeLeaf = meshPromo.get(leafId);
  assert.strictEqual(nodeLeaf.parent, relayId, 'Leaf should be parented to relay');

  // Now "promote" relay to broadcaster
  addNodeToMesh(sPromo, relayId, true);
  assert.strictEqual(nodeRelay.isBroadcaster, true, 'Relay should now be broadcaster');
  assert.strictEqual(nodeRelay.parent, null, 'Promoted broadcaster should have no parent');
  assert.ok(!meshPromo.get(hostId).children.has(relayId), 'Original host should no longer have relay as child');

  // 4. Bandwidth-aware parent selection
  console.log('Step 4: Testing bandwidth-aware parent selection');

  // Create a new stream for isolation
  const s2 = 'stream2';
  addNodeToMesh(s2, 'host', true);
  addNodeToMesh(s2, 'relay_no_bw', false);
  mesh = streamMeshTopology.get(s2);
  mesh.get('relay_no_bw').metrics.uploadMbps = 0;

  addNodeToMesh(s2, 'viewer', false);
  assert.strictEqual(mesh.get('viewer').parent, 'host', 'Viewer should skip relay with 0 bandwidth and pick host');

  console.log('--- All Mesh Verifications Passed! ---');
}

runTests().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
