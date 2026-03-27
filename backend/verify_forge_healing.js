/**
 * Verification script for P2P Mesh Healing Logic
 * This script mocks the database to bypass native binding issues in the sandbox.
 */

// 1. Mock the database before requiring server.js
const mockDb = {
  prepare: () => ({
    run: () => ({ changes: 1, lastInsertRowid: 1 }),
    get: () => ({ id: 1, username: 'test', credits: 100 }),
    all: () => []
  }),
  transaction: (fn) => fn,
  pragma: () => {}
};

// Use require.cache to intercept database loading
require.cache[require.resolve('./db')] = {
  exports: mockDb
};

// 2. Import the server components
const { io, streamMeshTopology, healOrphans, addNodeToMesh } = require('./server');

console.log("Starting Verification of Mesh Healing Logic...");

function verifyMesh(streamId, socketId, expectedParent, expectedIsBroadcaster) {
  const mesh = streamMeshTopology.get(streamId);
  const node = mesh?.get(socketId);

  if (!node) {
    console.error(`❌ FAILED: Node ${socketId} not found in mesh for ${streamId}`);
    return false;
  }

  const parentMatch = node.parent === expectedParent;
  const isBroadcasterMatch = node.isBroadcaster === expectedIsBroadcaster;

  if (parentMatch && isBroadcasterMatch) {
    console.log(`✅ VERIFIED: Node ${socketId} (isBroadcaster: ${node.isBroadcaster}, parent: ${node.parent})`);
    return true;
  } else {
    console.error(`❌ FAILED: Node ${socketId} expected (isBroadcaster: ${expectedIsBroadcaster}, parent: ${expectedParent}) but got (isBroadcaster: ${node.isBroadcaster}, parent: ${node.parent})`);
    return false;
  }
}

async function runTests() {
  const streamId = 'test-stream';

  console.log("\n--- Scenario 1: Orphan Healing ---");
  // 1. Add an orphan viewer (no parents available yet)
  console.log("Adding viewer1 (no broadcaster exists)...");
  addNodeToMesh(streamId, 'viewer1', false);
  verifyMesh(streamId, 'viewer1', null, false);

  // 2. Add a broadcaster. This should trigger healing and assign viewer1 to broadcaster.
  console.log("Adding broadcaster 'host1'...");
  addNodeToMesh(streamId, 'host1', true);

  verifyMesh(streamId, 'host1', null, true);
  verifyMesh(streamId, 'viewer1', 'host1', false);

  console.log("\n--- Scenario 2: Promotion Severance ---");
  const streamId2 = 'promo-stream';
  // 1. Join as broadcaster first
  addNodeToMesh(streamId2, 'hostA', true);
  // 2. Join as viewer, will be assigned hostA
  addNodeToMesh(streamId2, 'viewerA', false);
  verifyMesh(streamId2, 'viewerA', 'hostA', false);

  // 3. Promote viewerA to broadcaster. Its parent should be cleared.
  console.log("Promoting viewerA to broadcaster...");
  addNodeToMesh(streamId2, 'viewerA', true);
  verifyMesh(streamId2, 'viewerA', null, true);

  // 4. Verification: hostA's children set should not contain viewerA anymore
  const hostANode = streamMeshTopology.get(streamId2).get('hostA');
  if (!hostANode.children.has('viewerA')) {
    console.log("✅ VERIFIED: viewerA removed from previous parent's children set.");
  } else {
    console.error("❌ FAILED: viewerA still in hostA's children set.");
  }

  console.log("\n--- Scenario 3: Metrics Transition Healing ---");
  const streamId3 = 'metrics-stream';
  // 1. Add host
  addNodeToMesh(streamId3, 'hostB', true);
  // 2. Add relay with 0 capacity
  addNodeToMesh(streamId3, 'relayB', false);
  // Fill host capacity with 2 viewers
  addNodeToMesh(streamId3, 'viewerB1', false);
  addNodeToMesh(streamId3, 'viewerB2', false);

  // 3. Add orphan (host is full, relay has 0 upload)
  console.log("Adding viewerB3 (should be orphan because relay has 0 upload)...");
  addNodeToMesh(streamId3, 'viewerB3', false);
  verifyMesh(streamId3, 'viewerB3', null, false);

  // 4. Update relayB metrics to > 0. This should trigger healing.
  console.log("Updating relayB metrics to 50 Mbps...");
  const mesh3 = streamMeshTopology.get(streamId3);
  const relayNode = mesh3.get('relayB');
  relayNode.metrics.uploadMbps = 50;

  console.log("Calling healOrphans manually (simulating metrics-report logic)...");
  healOrphans(streamId3);

  verifyMesh(streamId3, 'viewerB3', 'relayB', false);

  console.log("\nVerification Script Completed.");
  process.exit(0);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
