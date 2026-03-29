const mockDb = {
  prepare: () => ({
    run: () => ({ lastInsertRowid: 1, changes: 1 }),
    get: () => ({ credits: 100 }),
    all: () => []
  }),
  transaction: (fn) => fn,
  exec: () => {}
};

// Override the require for ./db
require.cache[require.resolve('./db')] = {
  exports: mockDb
};

const {
  addNodeToMesh,
  removeNodeFromMesh,
  healOrphans,
  streamMeshTopology,
  io
} = require('./server');

// Mock io to prevent crashes since we're calling server functions
io.to = (id) => ({
  emit: (event, data) => {
    // console.log(`[Mock IO] Emitted ${event} to ${id}:`, data);
  }
});
io.sockets = {
  adapter: {
    rooms: new Map()
  },
  sockets: {
    get: (id) => ({ id, accountName: id })
  }
};

const streamId = 'test_stream';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('--- Verification Scenario: Healing orphans when broadcaster arrives ---');

// 1. Viewer 1 joins (becomes orphan since no broadcaster or parent)
addNodeToMesh(streamId, 'viewer1', false);
let mesh = streamMeshTopology.get(streamId);
assert(mesh.has('viewer1'), 'Viewer 1 added to mesh');
assert(mesh.get('viewer1').parent === null, 'Viewer 1 is an orphan');

// 2. Broadcaster joins (triggers healing)
addNodeToMesh(streamId, 'broadcaster', true);
assert(mesh.has('broadcaster'), 'Broadcaster added to mesh');
assert(mesh.get('viewer1').parent === 'broadcaster', 'Viewer 1 healed: parent is broadcaster');

console.log('\n--- Verification Scenario: Healing orphans when new relay bandwidth reported ---');

// Setup: Viewer 2 joins, Viewer 1 at 0 bandwidth
addNodeToMesh(streamId, 'viewer2', false);
mesh.get('viewer1').metrics.uploadMbps = 0;
// Note: addNodeToMesh for viewer2 should have assigned it to broadcaster since capacity is 2
assert(mesh.get('viewer2').parent === 'broadcaster', 'Viewer 2 parent is broadcaster');

// Viewer 3 joins, broadcaster at max capacity (2)
addNodeToMesh(streamId, 'viewer3', false);
assert(mesh.get('viewer3').parent === null, 'Viewer 3 is orphan (broadcaster full, viewer1 no bandwidth)');

// Viewer 1 starts contributing bandwidth
mesh.get('viewer1').metrics.uploadMbps = 100;
healOrphans(streamId);
assert(mesh.get('viewer3').parent === 'viewer1', 'Viewer 3 healed: parent is viewer1 after bandwidth update');

console.log('\n--- Verification Scenario: Promotion to broadcaster severs old parent ---');

// Setup: Viewer 4 joins viewer 1
addNodeToMesh(streamId, 'viewer4', false);
assert(mesh.get('viewer4').parent === 'viewer1', 'Viewer 4 parent is viewer1');

// Viewer 4 becomes broadcaster (e.g. they authenticate)
addNodeToMesh(streamId, 'viewer4', true);
assert(mesh.get('viewer4').isBroadcaster === true, 'Viewer 4 is now broadcaster');
assert(mesh.get('viewer4').parent === null, 'Viewer 4 parent severed');
assert(!mesh.get('viewer1').children.has('viewer4'), 'Viewer 1 no longer has viewer 4 as child');

console.log('\nVerification complete!');
process.exit(0);
