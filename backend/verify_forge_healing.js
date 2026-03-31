const assert = require('assert');

// Mock database
const mockDb = {
  prepare: () => ({
    get: () => ({ id: 1, username: 'tester', avatar_url: 'http://avatar.com', bio: 'test bio' }),
    run: () => ({ lastInsertRowid: 1 }),
    all: () => []
  }),
  transaction: (fn) => fn
};

// Mock socket.io
const mockIo = {
  to: () => ({ emit: () => {} }),
  sockets: {
    sockets: {
      get: (id) => ({ id, accountName: id })
    },
    adapter: { rooms: new Map() }
  }
};

// Mock modules
require.cache[require.resolve('./db')] = { exports: mockDb };

// Import server logic
const server = require('./server');
const { addNodeToMesh, streamMeshTopology, healOrphans, activeStreams } = server;

async function runTests() {
  console.log('--- Running Forge Mesh Healing Tests ---');

  // Test Case 1: Orphan Healing
  console.log('Test 1: Orphan Healing');
  const streamId = 'stream1';
  streamMeshTopology.clear();

  // Add an orphan viewer (no broadcaster yet)
  addNodeToMesh(streamId, 'v1', false);
  let mesh = streamMeshTopology.get(streamId);
  assert.strictEqual(mesh.get('v1').parent, null, 'Viewer 1 should be an orphan');

  // Add broadcaster, should trigger healOrphans
  addNodeToMesh(streamId, 'host1', true);
  assert.strictEqual(mesh.get('v1').parent, 'host1', 'Viewer 1 should now be assigned to host1');
  console.log('✅ Test 1 Passed');

  // Test Case 2: Broadcaster Promotion (Retroactive)
  console.log('Test 2: Broadcaster Promotion');
  streamMeshTopology.clear();
  activeStreams.clear();

  // Initially joined as guest
  addNodeToMesh('host2', 's1', false);
  mesh = streamMeshTopology.get('host2');
  assert.strictEqual(mesh.get('s1').isBroadcaster, false);

  // Promote
  addNodeToMesh('host2', 's1', true);
  assert.strictEqual(mesh.get('s1').isBroadcaster, true, 'Socket should be promoted to broadcaster');
  assert.strictEqual(mesh.get('s1').parent, null, 'Broadcaster should not have a parent');
  console.log('✅ Test 2 Passed');

  // Test Case 3: Bandwidth-triggered Healing
  console.log('Test 3: Bandwidth-triggered Healing');
  streamMeshTopology.clear();

  // Broadcaster host1 (Capacity: 2 children)
  addNodeToMesh(streamId, 'host1', true);

  // v1 (upload: 0)
  addNodeToMesh(streamId, 'v1', false);
  // v2 (upload: 0)
  addNodeToMesh(streamId, 'v2', false);
  // v3 (upload: 0) - Should be orphan because host1 is full and v1/v2 have 0 upload
  addNodeToMesh(streamId, 'v3', false);

  mesh = streamMeshTopology.get(streamId);
  assert.strictEqual(mesh.get('v3').parent, null, 'Viewer 3 should be an orphan (capacity full and no relayers)');

  // v1 starts contributing bandwidth
  mesh.get('v1').metrics.uploadMbps = 10;
  healOrphans(streamId);
  assert.strictEqual(mesh.get('v3').parent, 'v1', 'Viewer 3 should be assigned to new relay v1');
  console.log('✅ Test 3 Passed');

  console.log('--- All Forge Mesh Tests Passed ---');
}

runTests().catch(err => {
  console.error('❌ Tests failed:', err);
  process.exit(1);
});
