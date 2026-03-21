const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('./db');

// Load environment variables before initializing constants
require('dotenv').config();

// Explicitly export JWT_SECRET for tests
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

const app = express();
// 🛡️ SECURITY: Disable x-powered-by header to prevent leaking technology stack info
app.disable('x-powered-by');
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Track active streams (where host is present)
// Map<streamId, { title: string, tags: string, streamer: string }>
const activeStreams = new Map();
// Track active polls per stream
const activePolls = new Map();
// Track stream squads for revenue splits
// Map<streamId, Array<{ username: string, split: number }>>
const streamSquads = new Map();
// Track authenticated broadcaster socket IDs per streamId for multi-session support and O(1) checks.
// Map<streamId, Set<socketId>>
const broadcasterSessions = new Map();

/**
 * Updates the broadcaster sessions tracking map for a given stream and socket.
 * @param {string} streamId - The ID of the stream.
 * @param {string} socketId - The ID of the socket.
 * @param {boolean} isBroadcaster - Whether the socket is an authenticated broadcaster.
 */
const updateBroadcasterSession = (streamId, socketId, isBroadcaster) => {
  if (!streamId) return;

  if (isBroadcaster) {
    if (!broadcasterSessions.has(streamId)) {
      broadcasterSessions.set(streamId, new Set());
    }
    broadcasterSessions.get(streamId).add(socketId);
  } else if (broadcasterSessions.has(streamId)) {
    const sessions = broadcasterSessions.get(streamId);
    sessions.delete(socketId);
    if (sessions.size === 0) {
      broadcasterSessions.delete(streamId);
    }
  }
};

// ⚡ Performance Optimization: Cache relayer splits to avoid O(N) mesh traversals on every tip/ad.
// Map<streamId, { relayers: Array, totalRelayBandwidth: number, timestamp: number }>
const relayerSplitsCache = new Map();

// Prepared SQL Statements for Performance
const updateCreditsStmt = db.prepare('UPDATE Users SET credits = credits + ? WHERE username = ?');
const deductCreditsStmt = db.prepare('UPDATE Users SET credits = credits - ? WHERE username = ?');
const deductCreditsWithCheckStmt = db.prepare('UPDATE Users SET credits = credits - ? WHERE username = ? AND credits >= ?');
const getCreditsStmt = db.prepare('SELECT credits FROM Users WHERE username = ?');
const getUserStmt = db.prepare('SELECT id, username, avatar_url, bio, follower_count, (SELECT COUNT(*) FROM Follows WHERE follower_id = Users.id) AS following_count FROM Users WHERE username = ?');
const getUserWithHashStmt = db.prepare('SELECT * FROM Users WHERE username = ?');
const updateProfileStmt = db.prepare('UPDATE Users SET bio = ?, avatar_url = ? WHERE username = ?');
const checkFollowStmt = db.prepare('SELECT * FROM Follows WHERE follower_id = ? AND followee_id = ?');
const insertFollowStmt = db.prepare('INSERT INTO Follows (follower_id, followee_id) VALUES (?, ?)');
const deleteFollowStmt = db.prepare('DELETE FROM Follows WHERE follower_id = ? AND followee_id = ?');
const updateFollowerCountStmt = db.prepare('UPDATE Users SET follower_count = follower_count + ? WHERE id = ?');
const getFollowersStmt = db.prepare(`
  SELECT u.id, u.username, u.avatar_url, u.bio, u.follower_count
  FROM Users u
  JOIN Follows f ON u.id = f.follower_id
  JOIN Users followee ON followee.id = f.followee_id
  WHERE followee.username = ?
`);
const getFollowingStmt = db.prepare(`
  SELECT u.id, u.username, u.avatar_url, u.bio, u.follower_count
  FROM Users u
  JOIN Follows f ON u.id = f.followee_id
  JOIN Users follower ON follower.id = f.follower_id
  WHERE follower.username = ?
`);
const registerUserStmt = db.prepare('INSERT INTO Users (username, password_hash, avatar_url, bio, credits) VALUES (?, ?, ?, ?, ?)');

/**
 * Forcefully ends an active poll for a stream and optionally notifies viewers.
 * @param {string} streamId - The ID of the stream.
 * @param {boolean} notifyViewers - Whether to emit a 'poll-ended' event to the room.
 */
const cleanupPoll = (streamId, notifyViewers = false) => {
  if (activePolls.has(streamId)) {
    const poll = activePolls.get(streamId);
    if (poll.timeoutId) {
      clearTimeout(poll.timeoutId);
    }

    if (notifyViewers) {
      const { voters: _v, timeoutId: _t, ...pollData } = poll;
      pollData.isActive = false;
      io.to(streamId).emit('poll-ended', pollData);
    }

    activePolls.delete(streamId);
  }
};

/**
 * Selects a random stream ID from active streams without creating an intermediate array.
 * ⚡ Performance Optimization: This reduces GC pressure and memory usage to O(1) by avoiding
 * Array.from(). While it maintains O(N) time complexity for the traversal, it is
 * significantly more efficient for the Node.js heap in high-concurrency environments.
 * @returns {string|null} A random stream ID, or null if no streams are active.
 */
const getRandomStreamId = () => {
  const size = activeStreams.size;
  if (size === 0) return null;
  const randomIndex = Math.floor(Math.random() * size);
  let i = 0;
  for (const id of activeStreams.keys()) {
    if (i === randomIndex) return id;
    i++;
  }
  return null;
};

/**
 * Distributes credits to a list of squad members and emits wallet updates.
 * Should be called within a database transaction for atomicity.
 * @param {Array<{username: string, split: number}>} squad - List of members and their percentage splits.
 * @param {number} totalAmount - Total amount to be distributed.
 */
const distributeCredits = (squad, totalAmount) => {
  const updates = [];
  for (const member of squad) {
    const cut = totalAmount * (member.split / 100);
    if (cut > 0) {
      updateCreditsStmt.run(cut, member.username);
      const row = getCreditsStmt.get(member.username);
      if (row) {
        updates.push({ username: member.username, balance: row.credits });
      }
    }
  }
  return updates;
};

// ⚡ Performance Optimization:
// Hoisting transactions to the module level prevents the overhead of creating
// new transaction functions on every request or socket event.
// This is critical for high-frequency events like 'metrics-report' (every 2s per user).
const distributeCreditsTx = db.transaction(distributeCredits);

// ⚡ Performance Optimization: Specialized transaction for high-frequency single-user credit updates.
// This avoids the overhead of creating 'squad' and 'updates' arrays in metrics-report.
const updateSingleUserCreditsTx = db.transaction((username, amount) => {
  updateCreditsStmt.run(amount, username);
  return getCreditsStmt.get(username);
});

const revenueTx = db.transaction((tipper, amount, squad, relayers, relayTotal, squadTotal) => {
  if (tipper) {
    // ⚡ Performance Optimization: Merge balance check and deduction into a single atomic UPDATE.
    const info = deductCreditsWithCheckStmt.run(amount, tipper, amount);
    if (info.changes === 0) {
      throw new Error('INSUFFICIENT_FUNDS');
    }
  }

  const results = [];
  // Distribute 80% to squad
  results.push(...distributeCredits(squad, squadTotal));
  // Distribute 20% to relayers
  results.push(...distributeCredits(relayers, relayTotal));

  return results;
});

const followTx = db.transaction((followerId, followeeId) => {
  insertFollowStmt.run(followerId, followeeId);
  updateFollowerCountStmt.run(1, followeeId);
});

const unfollowTx = db.transaction((followerId, followeeId) => {
  deleteFollowStmt.run(followerId, followeeId);
  updateFollowerCountStmt.run(-1, followeeId);
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Helper to distribute credits to a stream's squad and notify online members.
// 20% of the amount is split among active relayers, and 80% is split among the squad.
const distributeCreditsToStream = (streamId, amount, tipper = null) => {
  const squad = streamSquads.get(streamId) || [{ username: streamId, split: 100 }];
  const mesh = streamMeshTopology.get(streamId);

  // ⚡ Performance Optimization: Check relayer splits cache (2s TTL)
  const now = Date.now();
  const cached = relayerSplitsCache.get(streamId);
  let relayers = [];
  let totalRelayBandwidth = 0;

  if (cached && (now - cached.timestamp < 2000)) {
    relayers = cached.relayers;
    totalRelayBandwidth = cached.totalRelayBandwidth;
  } else {
    // 🌉 Bridge: Implement Sybil-resistant and Proportional Relay Distribution
    // We deduplicate relayers by username and sum their bandwidth contribution.
    // Rewards are then distributed proportionally based on total bandwidth served.
    const relayerContributions = new Map(); // username -> total uploadMbps

    if (mesh) {
      for (const [socketId, node] of mesh.entries()) {
        // ⚡ Performance Optimization: Prioritize the accountName already stored in the node object.
        // This avoids the O(N) overhead of looking up every socket in the global Map on every distribution.
        let accountName = node.accountName;

        if (!accountName) {
          const socket = io.sockets.sockets.get(socketId);
          accountName = socket?.accountName;
          if (accountName) node.accountName = accountName; // Cache for next time
        }

        if (!node.isBroadcaster && accountName && node.metrics && node.metrics.uploadMbps > 0) {
          const bandwidth = node.metrics.uploadMbps;
          relayerContributions.set(accountName, (relayerContributions.get(accountName) || 0) + bandwidth);
          totalRelayBandwidth += bandwidth;
        }
      }
    }

    if (totalRelayBandwidth > 0) {
      for (const [username, bandwidth] of relayerContributions.entries()) {
        const weight = (bandwidth / totalRelayBandwidth) * 100;
        relayers.push({ username, split: weight });
      }
    }

    // Update cache
    relayerSplitsCache.set(streamId, { relayers, totalRelayBandwidth, timestamp: now });
  }

  const RELAY_PORTION = 0.20;
  const relayTotal = amount * RELAY_PORTION;
  const hasRelayers = totalRelayBandwidth > 0;
  const squadTotal = amount - (hasRelayers ? relayTotal : 0);

  try {
    const updates = revenueTx(tipper, amount, squad, relayers, relayTotal, squadTotal);

    // ⚡ Performance Optimization: Deduplicate wallet update emissions.
    // If a user is both a squad member and a relayer, aggregate their final balance
    // to emit only one socket message per unique user.
    const uniqueUpdates = new Map();
    for (const update of updates) {
      uniqueUpdates.set(update.username, update.balance);
    }

    // Emit updates after successful transaction to prevent state desync
    for (const [username, balance] of uniqueUpdates.entries()) {
      io.to(`user:${username}`).emit('wallet-update', { balance });
    }
  } catch (err) {
    console.error(`Failed to distribute credits for stream ${streamId}:`, err);
    throw err;
  }
};

// REST API Endpoints

// Get Active Streams
app.get('/api/streams', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;

  const streams = [];
  let skipped = 0;

  // ⚡ Performance Optimization: Iterator-based pagination
  // Using Array.from(activeStreams.entries()) creates a full intermediate array (O(N)),
  // which causes memory pressure and CPU spikes as the number of streams grows.
  // This for...of loop iterates only up to (offset + limit), achieving O(offset + limit).
  for (const [id, info] of activeStreams) {
    if (skipped < offset) {
      skipped++;
      continue;
    }
    if (streams.length >= limit) break;

    const viewersCount = io.sockets.adapter.rooms.get(id)?.size || 0;
    streams.push({
      id,
      ...info,
      viewers: viewersCount
    });
  }

  res.json(streams);
});

// Get Stream Detail
app.get('/api/streams/:streamId', (req, res) => {
  const { streamId } = req.params;
  const info = activeStreams.get(streamId);

  if (!info) {
    return res.status(404).json({ error: 'Stream not found or offline' });
  }

  const viewersCount = io.sockets.adapter.rooms.get(streamId)?.size || 0;
  res.json({
    id: streamId,
    ...info,
    viewers: viewersCount
  });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  // Input Validation
  if (typeof username !== 'string' || !/^[a-zA-Z0-9]+$/.test(username) || username.length < 3 || username.length > 30) {
    return res.status(400).json({ error: 'Username must be 3-30 alphanumeric characters' });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    // Provide a default avatar (null)
    const defaultAvatar = null;

    try {
      const info = registerUserStmt.run(username, password_hash, defaultAvatar, 'I love streaming on Beacon!', 0.0);

      const token = jwt.sign({ id: info.lastInsertRowid, username }, JWT_SECRET, { expiresIn: '24h' });
      res.status(201).json({ token, user: { id: info.lastInsertRowid, username, avatar_url: defaultAvatar, bio: 'I love streaming on Beacon!', follower_count: 0, credits: 0.0 } });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 🛡️ SECURITY: Rate limiting for login to prevent brute force
const loginRateLimit = new Map();

// Cleanup stale rate limit entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of loginRateLimit.entries()) {
    if (now > data.resetTime) {
      loginRateLimit.delete(ip);
    }
  }
}, 15 * 60 * 1000).unref();

// Login
app.post('/api/auth/login', async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  let rateData = loginRateLimit.get(ip);
  if (!rateData || now > rateData.resetTime) {
    rateData = { attempts: 0, resetTime: now + windowMs };
    loginRateLimit.set(ip, rateData);
  }

  if (rateData.attempts >= maxAttempts) {
    return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    rateData.attempts++;
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = getUserWithHashStmt.get(username);

    if (!user) {
      rateData.attempts++;
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      rateData.attempts++;
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Success: clear rate limit
    loginRateLimit.delete(ip);

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    // Don't send password hash back
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
      res.status(500).json({ error: 'Database error' });
  }
});

// Update User Profile
app.patch('/api/users/profile', authenticateToken, (req, res) => {
  const { bio, avatar_url } = req.body;
  const username = req.user.username;

  if (bio !== undefined) {
    if (typeof bio !== 'string') {
      return res.status(400).json({ error: 'Bio must be a string' });
    }
    if (bio.length > 500) {
      return res.status(400).json({ error: 'Bio cannot exceed 500 characters' });
    }
  }

  if (avatar_url !== undefined) {
    if (avatar_url !== null && typeof avatar_url !== 'string') {
      return res.status(400).json({ error: 'Avatar URL must be a string or null' });
    }
    if (typeof avatar_url === 'string' && avatar_url.length > 1000) {
      return res.status(400).json({ error: 'Avatar URL is too long' });
    }
  }

  try {
    const currentUser = getUserStmt.get(username);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newBio = bio !== undefined ? bio : currentUser.bio;
    const newAvatarUrl = avatar_url !== undefined ? avatar_url : currentUser.avatar_url;

    updateProfileStmt.run(newBio, newAvatarUrl, username);

    const updatedUser = getUserStmt.get(username);

    // Sync active stream metadata if live
    if (activeStreams.has(username)) {
      const info = activeStreams.get(username);
      info.avatar = updatedUser.avatar_url;
      io.to(username).emit('stream-info-updated', info);
    }

    res.json({ success: true, user: updatedUser, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Profile update failed:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete User Account
app.delete('/api/users/:username', authenticateToken, (req, res) => {
  const usernameToDelete = req.params.username;
  const requestingUsername = req.user.username;

  if (usernameToDelete !== requestingUsername) {
    return res.status(403).json({ error: 'Forbidden: You can only delete your own account' });
  }

  try {
    const user = getUserStmt.get(usernameToDelete);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Permanently delete the user account
    // Since PRAGMA foreign_keys = ON is not explicitly set in db.js,
    // we manually delete related Follows records to avoid orphaned data.
    db.transaction(() => {
      // 🌉 Bridge: Maintain follower_count integrity for others when this user is deleted.
      // Find all users this user was following and decrement their follower counts.
      const following = db.prepare('SELECT followee_id FROM Follows WHERE follower_id = ?').all(user.id);
      for (const f of following) {
        updateFollowerCountStmt.run(-1, f.followee_id);
      }

      db.prepare('DELETE FROM Follows WHERE follower_id = ? OR followee_id = ?').run(user.id, user.id);
      db.prepare('DELETE FROM Users WHERE id = ?').run(user.id);
    })();

    res.json({ success: true, message: 'Account permanently deleted' });
  } catch (err) {
    console.error('Account deletion failed:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get Followers List
app.get('/api/users/:username/followers', (req, res) => {
  try {
    const followers = getFollowersStmt.all(req.params.username);
    res.json(followers);
  } catch (err) {
    console.error('Get followers error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get User Profile
app.get('/api/users/:username', (req, res) => {
  try {
    const user = getUserStmt.get(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
      res.status(500).json({ error: 'Database error' });
  }
});

// Follow a User
app.post('/api/users/:username/follow', authenticateToken, (req, res) => {
  const followeeUsername = req.params.username;
  const followerUsername = req.user.username;

  if (followeeUsername === followerUsername) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  try {
    const follower = getUserStmt.get(followerUsername);
    const followee = getUserStmt.get(followeeUsername);

    if (!followee) return res.status(404).json({ error: 'User to follow not found' });

    // Check if already following
    const existingFollow = checkFollowStmt.get(follower.id, followee.id);

    if (existingFollow) {
      return res.status(409).json({ error: 'Already following this user' });
    }

    followTx(follower.id, followee.id);

    res.json({ success: true, message: `Successfully followed ${followeeUsername}` });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Unfollow a User
app.delete('/api/users/:username/follow', authenticateToken, (req, res) => {
  const followeeUsername = req.params.username;
  const followerUsername = req.user.username;

  try {
    const follower = getUserStmt.get(followerUsername);
    const followee = getUserStmt.get(followeeUsername);

    if (!followee) return res.status(404).json({ error: 'User to unfollow not found' });

    // Check if actually following
    const existingFollow = checkFollowStmt.get(follower.id, followee.id);

    if (!existingFollow) {
      return res.status(400).json({ error: 'Not following this user' });
    }

    unfollowTx(follower.id, followee.id);

    res.json({ success: true, message: `Successfully unfollowed ${followeeUsername}` });
  } catch (err) {
    console.error('Unfollow error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get Following List
app.get('/api/users/:username/following', (req, res) => {
  try {
    const following = getFollowingStmt.all(req.params.username);
    res.json(following);
  } catch (err) {
    console.error('Get following error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get Wallet Balance
app.get('/api/wallet', authenticateToken, (req, res) => {
  try {
    const row = getCreditsStmt.get(req.user.username);
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({ balance: row.credits });
  } catch (err) {
      res.status(500).json({ error: 'Database error' });
  }
});

// Tip Stream (Revenue Split Logic)
app.post('/api/tip', authenticateToken, (req, res) => {
  const { streamId, amount } = req.body;
  const tipper = req.user.username;

  if (!streamId || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid tip parameters' });
  }

  try {
    // 🌉 Bridge: Use the unified distributeCreditsToStream to apply 80/20 split
    // and proportional relay rewards to Tips as well as Ads.
    distributeCreditsToStream(streamId, amount, tipper);

    // Notify all of tipper's devices about the new balance
    const updatedTipper = getCreditsStmt.get(tipper);
    if (updatedTipper) {
      io.to(`user:${tipper}`).emit('wallet-update', { balance: updatedTipper.credits });
    }

    // Emit event to the room so chat can show the tip
    io.to(streamId).emit('chat-message', {
      id: Date.now(),
      user: 'System',
      text: `${tipper} just tipped ${amount} credits!`,
      color: 'text-beacon-400 font-bold',
      senderId: 'system',
    });

    res.json({ success: true, message: 'Tip distributed successfully' });
  } catch (err) {
    if (err.message === 'INSUFFICIENT_FUNDS') {
      return res.status(400).json({ error: 'Insufficient funds' });
    }
    console.error('Tip transaction failed:', err);
    res.status(500).json({ error: 'Database transaction failed' });
  }
});

// Rate limit tracker for Ad Breaks
// Map<streamId, timestamp>
const lastAdTrigger = new Map();

// Trigger Ad Break (Distribute Ad Revenue)
app.post('/api/ads/trigger', authenticateToken, (req, res) => {
  const { streamId } = req.body;
  const broadcaster = req.user.username;

  if (broadcaster !== streamId) {
    return res.status(403).json({ error: 'Only the broadcaster can trigger an ad break' });
  }

  // 🛡️ SECURITY: Add rate limiting to prevent infinite credit exploits
  const now = Date.now();
  const lastTrigger = lastAdTrigger.get(streamId) || 0;
  // Require at least 5 minutes (300,000 ms) between ad breaks
  if (now - lastTrigger < 300000) {
    return res.status(429).json({ error: 'Ad break rate limit exceeded. Please wait 5 minutes before triggering another ad.' });
  }
  lastAdTrigger.set(streamId, now);

  try {
    const viewersCount = io.sockets.adapter.rooms.get(streamId)?.size || 0;
    // Ad revenue formula: 0.5 CR per viewer during the break
    const adRevenue = viewersCount * 0.5;

    if (adRevenue > 0) {
      distributeCreditsToStream(streamId, adRevenue);

      io.to(streamId).emit('chat-message', {
        id: Date.now(),
        user: 'System',
        text: `Ad break started! Broadcaster earned ${adRevenue.toFixed(2)} CR from ${viewersCount} viewers.`,
        color: 'text-green-400 italic',
        senderId: 'system',
      });
    }

    res.json({ success: true, revenue: adRevenue });
  } catch (err) {
    console.error('Ad revenue distribution failed:', err);
    res.status(500).json({ error: 'Failed to distribute ad revenue' });
  }
});

// --- P2P Mesh Tracker ---
// Track the topology of peers in each stream
// Map<streamId, Map<socketId, { children: Set<socketId>, parent: socketId | null }>>
const streamMeshTopology = new Map();

// Configuration
const MAX_CHILDREN_PER_NODE = 2; // Keep it low for browser WebRTC stability

/**
 * Verifies if a node has a valid upstream path to the broadcaster.
 * Prevents mesh cycles and ensures viewers only connect to viable nodes.
 * @param {Map} mesh - The mesh topology for the stream.
 * @param {string} startNodeId - The ID of the node to check from.
 * @returns {boolean} True if a path to the broadcaster exists.
 */
function hasPathToBroadcaster(mesh, startNodeId) {
  let currentId = startNodeId;
  const visited = new Set();

  while (currentId) {
    if (visited.has(currentId)) return false; // Cycle detected
    visited.add(currentId);

    const node = mesh.get(currentId);
    if (!node) return false;
    if (node.isBroadcaster) return true;

    currentId = node.parent;
  }

  return false;
}

/**
 * Checks if there is another authenticated broadcaster for the given streamId
 * in the same room, excluding the current socket.
 * @param {string} streamId - The ID of the stream.
 * @param {string} currentSocketId - The ID of the current socket to exclude.
 * @returns {boolean} True if another authenticated broadcaster is found.
 */
const isAnotherBroadcasterActive = (streamId, currentSocketId) => {
  const sessions = broadcasterSessions.get(streamId);
  if (!sessions) return false;

  if (currentSocketId) {
    return sessions.size > 1 || (sessions.size === 1 && !sessions.has(currentSocketId));
  }
  return sessions.size > 0;
};

function addNodeToMesh(streamId, socketId, isBroadcasterRequested = false) {
  if (!streamMeshTopology.has(streamId)) {
    streamMeshTopology.set(streamId, new Map());
  }

  const mesh = streamMeshTopology.get(streamId);
  const socket = io.sockets.sockets.get(socketId);

  // 🛡️ SECURITY: Only authenticated users matching the streamId can be marked as broadcasters.
  const isBroadcaster = isBroadcasterRequested && socket && socket.isAuthenticated && socket.accountName === streamId;

  // If node already exists, don't reset its state (children/parent)
  // This can happen on reconnects or re-joins to the same stream
  if (mesh.has(socketId)) {
    const node = mesh.get(socketId);
    node.isBroadcaster = isBroadcaster;
    if (socket?.accountName) node.accountName = socket.accountName;
    // Only return if it already has a parent or it's the broadcaster.
    // If it exists but has no parent (orphan), we continue to find it one.
    if (node.parent || isBroadcaster) return;
  } else {
    mesh.set(socketId, {
      children: new Set(),
      parent: null,
      isBroadcaster,
      accountName: socket?.accountName || null,
      metrics: { latency: 0, uploadMbps: 0 }
    });
  }

  if (isBroadcaster) {
    return; // Broadcaster has no parent
  }

  // ⚡ Performance Optimization: Greedy O(N) Parent Selection
  // Previously, this used an O(N log N) sort with intermediate object allocations.
  // Now, we use a single-pass greedy approach to find the best parent, reducing
  // CPU overhead and GC pressure as the viewer count grows.
  let assignedParent = null;
  let bestScore = -1;
  let bestChildrenCount = Infinity;

  for (const [id, node] of mesh.entries()) {
    if (id !== socketId && node.children.size < MAX_CHILDREN_PER_NODE) {
      // 🌉 Bridge: Ensure potential parent has a valid path to the broadcaster.
      // This prevents cycles and ensures the tree is always connected to the root.
      if (!node.isBroadcaster && !hasPathToBroadcaster(mesh, id)) {
        console.log(`[Mesh] Skipping potential parent ${id} for ${socketId} - no path to broadcaster`);
        continue;
      }

      // Prioritize broadcaster, then use metrics
      let score = 0;
      if (node.isBroadcaster) {
        score = 10000; // Extremely high score to prefer direct connection
      } else {
        // Higher score is better: High upload speed and low latency
        const uploadScore = (node.metrics && node.metrics.uploadMbps > 0) ? node.metrics.uploadMbps * 10 : 5;
        const latencyPenalty = (node.metrics && node.metrics.latency > 0) ? node.metrics.latency : 100;
        score = (uploadScore / latencyPenalty) * 100;
      }

      const childrenCount = node.children.size;

      // Update best if this node has a higher score, or same score with fewer children
      if (score > bestScore || (score === bestScore && childrenCount < bestChildrenCount)) {
        bestScore = score;
        bestChildrenCount = childrenCount;
        assignedParent = id;
      }
    }
  }

  if (assignedParent) {
    const parentNode = mesh.get(assignedParent);
    parentNode.children.add(socketId);
    mesh.get(socketId).parent = assignedParent;

    // Notify the parent to initiate a connection with the new child
    io.to(assignedParent).emit('p2p-initiate-connection', { childId: socketId });
    console.log(`[Mesh] Assigned ${socketId} as child of ${assignedParent} in stream ${streamId}`);
  } else {
    console.log(`[Mesh] Warning: Could not find parent for ${socketId} in stream ${streamId}`);
  }
}

function removeNodeFromMesh(streamId, socketId) {
  if (!streamMeshTopology.has(streamId)) return;

  const mesh = streamMeshTopology.get(streamId);
  const node = mesh.get(socketId);
  if (!node) return;

  // If node had a parent, remove from parent's children
  if (node.parent) {
    const parentNode = mesh.get(node.parent);
    if (parentNode) {
      parentNode.children.delete(socketId);
    }
  }

  // If node had children, they are orphaned. Re-add them to the mesh.
  const orphans = Array.from(node.children);
  mesh.delete(socketId);

  // 🌉 Bridge: Clean up empty mesh maps to prevent memory leaks
  if (mesh.size === 0) {
    streamMeshTopology.delete(streamId);
  }

  for (const orphanId of orphans) {
    if (mesh.has(orphanId)) {
      mesh.get(orphanId).parent = null;
      // Re-add to find a new parent
      addNodeToMesh(streamId, orphanId, false);
    }
  }
}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // 🛡️ SECURITY: Initialize socket with unauthenticated state
  socket.isAuthenticated = false;
  socket.username = 'Guest';

  // Allow a socket to authenticate after connection (e.g., after login/register)
  socket.on('register-auth', ({ token }) => {
    if (!token) return;

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('[Auth] Socket registration failed: Invalid token');
        return;
      }

      const username = decoded.username;
      console.log(`[Auth] Socket ${socket.id} registered as ${username}`);

      // Update socket identity
      socket.username = username;
      socket.accountName = username;
      socket.isAuthenticated = true;

      // Join user-specific room for real-time wallet updates
      socket.join(`user:${username}`);

      // Retroactively update mesh topology with the new identity
      // ⚡ Performance Optimization: Using socket.currentRoom for targeted update (O(1))
      // instead of iterating over all active streams (O(N)).
      // Note: socket.currentRoom is maintained by the join/leave-stream handlers.
      const streamId = socket.currentRoom;

      // Retroactively register as broadcaster if already in their own stream room
      if (streamId === username) {
        updateBroadcasterSession(streamId, socket.id, true);
      }

      if (streamId && streamMeshTopology.has(streamId)) {
        const mesh = streamMeshTopology.get(streamId);
        if (mesh.has(socket.id)) {
          mesh.get(socket.id).accountName = username;
          // Update broadcaster status in mesh if identity matches streamId
          if (username === streamId) {
            mesh.get(socket.id).isBroadcaster = true;
          }
          console.log(`[Mesh] Updated identity for ${socket.id} in stream ${streamId}`);
        }
      }
    });
  });

  socket.on('join-stream', (data) => {
    const streamId = (typeof data === 'string' ? data : data?.streamId) || null;
    // 🛡️ SECURITY: Prioritize authenticated identity to prevent spoofing.
    const accountName = socket.accountName || (typeof data === 'object' ? data?.username : null) || null;
    let username = accountName;

    console.log(`[Join] User ${username} joining stream ${streamId}`);

    if (username) {
      // 🛡️ SECURITY: Prevent users from impersonating the host.
      // If the user is NOT the authenticated broadcaster for this stream, append -viewer if name conflicts.
      const isBroadcaster = socket.isAuthenticated && accountName === streamId;
      if (username === streamId && activeStreams.has(streamId) && !isBroadcaster) {
        username = `${username}-viewer`;
      }

      // Leave old user room if identity changed
      if (socket.accountName && socket.accountName !== accountName) {
        socket.leave(`user:${socket.accountName}`);
      }

      socket.username = username;
      socket.accountName = accountName;

      // Track broadcaster session
      if (socket.isAuthenticated && socket.accountName === streamId) {
        updateBroadcasterSession(streamId, socket.id, true);
      }

      // Persist accountName in the mesh topology for revenue sharing if node already exists
      if (streamId && streamMeshTopology.has(streamId)) {
        const mesh = streamMeshTopology.get(streamId);
        if (mesh.has(socket.id)) {
          mesh.get(socket.id).accountName = accountName;
        }
      }

      // Join user-specific room for real-time wallet updates across devices/tabs
      // We use accountName as the canonical identifier for wallet sync
      socket.join(`user:${accountName}`);
    }

    // Leave previous room if any to prevent double counting or stale state
    if (socket.currentRoom && socket.currentRoom !== streamId) {
       const prevRoom = socket.currentRoom;

       // Track broadcaster session cleanup
       if (socket.isAuthenticated && socket.accountName === prevRoom) {
         updateBroadcasterSession(prevRoom, socket.id, false);
       }

       // 🛡️ SECURITY: Only end stream if this is the LAST authenticated broadcaster session
       // activeStreams logic: If host leaves, redirect viewers
       if (socket.isAuthenticated && socket.username === prevRoom && activeStreams.has(prevRoom) && !isAnotherBroadcasterActive(prevRoom, socket.id)) {
          activeStreams.delete(prevRoom);
          streamSquads.delete(prevRoom);
          lastAdTrigger.delete(prevRoom);
          relayerSplitsCache.delete(prevRoom);
          // Check for active poll and clear its timeout
          cleanupPoll(prevRoom, true);
          const redirect = getRandomStreamId();
          socket.to(prevRoom).emit('stream-ended', { redirect });
       }

       socket.leave(prevRoom);
       // 🌉 Bridge: Ensure node is removed from previous mesh during room switch
       removeNodeFromMesh(prevRoom, socket.id);
       // Notify previous room
       const prevCount = io.sockets.adapter.rooms.get(prevRoom)?.size || 0;
       io.to(prevRoom).emit('room-users-update', prevCount);
       socket.to(prevRoom).emit('user-disconnected', { id: socket.id, username: socket.username });
       socket.currentRoom = null;
    }

    if (streamId) {
        if (socket.currentRoom !== streamId) {
            socket.join(streamId);
            socket.currentRoom = streamId;
            console.log(`Socket ${socket.id} (${socket.username || 'unknown'}) joined stream ${streamId}`);

            // Notify others for potential P2P connection
            socket.to(streamId).emit('user-connected', { id: socket.id, username: socket.username });
        }

        // 🛡️ SECURITY: Only authenticated hosts can start an active stream session
        // If the user is the host, mark stream as active
        if (socket.isAuthenticated && socket.username === streamId && !activeStreams.has(streamId)) {
          const user = getUserStmt.get(socket.username);
          activeStreams.set(streamId, {
            title: 'Welcome to my stream!',
            tags: 'Beacon, P2P, Streaming',
            streamer: socket.username,
            avatar: user ? user.avatar_url : null
          });
        }

        // Add to Mesh Tracker
        addNodeToMesh(streamId, socket.id, socket.username === streamId);

        // Broadcast updated participant count to the room (and acknowledged requester)
        const count = io.sockets.adapter.rooms.get(streamId)?.size || 0;
        io.to(streamId).emit('room-users-update', count);

        // Send current active poll to the joining user (sanitized)
        if (activePolls.has(streamId)) {
          const poll = activePolls.get(streamId);
          const { voters: _v, timeoutId: _t, ...pollData } = poll;
          socket.emit('poll-update', pollData);
        }
    }
  });

  socket.on('leave-stream', () => {
    if (socket.currentRoom) {
       const room = socket.currentRoom;

       // Track broadcaster session cleanup
       if (socket.isAuthenticated && socket.accountName === room) {
         updateBroadcasterSession(room, socket.id, false);
       }

       // 🛡️ SECURITY: Only end stream if this is the LAST authenticated broadcaster session
       // activeStreams logic: If host leaves, redirect viewers
       if (socket.isAuthenticated && socket.username === room && activeStreams.has(room) && !isAnotherBroadcasterActive(room, socket.id)) {
          activeStreams.delete(room);
          streamSquads.delete(room);
          lastAdTrigger.delete(room);
          relayerSplitsCache.delete(room);
          // Check for active poll and clear its timeout
          cleanupPoll(room, true);
          const redirect = getRandomStreamId();
          socket.to(room).emit('stream-ended', { redirect });
       }

       socket.leave(room);

       // Remove from Mesh Tracker
       removeNodeFromMesh(room, socket.id);

       const count = io.sockets.adapter.rooms.get(room)?.size || 0;
       io.to(room).emit('room-users-update', count);
       socket.to(room).emit('user-disconnected', { id: socket.id, username: socket.username });
       socket.currentRoom = null;
       console.log(`Socket ${socket.id} left stream ${room}`);
    }
  });

  socket.on('chat-message', ({ streamId, user, text, color }) => {
    // Validate streamId and ensure user is in the room
    if (!streamId || socket.currentRoom !== streamId) {
      return;
    }

    // Rate limiting: 1 message per 500ms
    const now = Date.now();
    if (socket.lastMessageTime && now - socket.lastMessageTime < 500) {
      return;
    }
    socket.lastMessageTime = now;

    // Input validation
    if (typeof text !== 'string' || text.trim().length === 0 || text.length > 500) {
      return;
    }

    // Sanitize color (basic check to allow only alphanumeric and dashes for tailwind classes)
    // If invalid or missing, let the frontend handle default or use a safe fallback here
    const safeColor = (typeof color === 'string' && /^[a-zA-Z0-9-]+$/.test(color)) ? color : null;

    // Use server-side username to prevent spoofing
    const safeUser = socket.username || 'Anonymous';

    io.to(streamId).emit('chat-message', {
      id: Date.now(),
      user: safeUser,
      text,
      color: safeColor,
      senderId: socket.id
    });
  });

  // --- Metrics Reporting ---
  socket.on('metrics-report', ({ streamId, latency, uploadMbps }) => {
    if (!streamId || socket.currentRoom !== streamId) return;

    // Rate limiting: 1 report per 1000ms to prevent infinite credit exploits
    const now = Date.now();
    if (socket.lastMetricsTime && now - socket.lastMetricsTime < 1000) {
      return;
    }
    socket.lastMetricsTime = now;

    // 🛡️ SECURITY: Only authenticated nodes earn credits
    // Credit Economy Calculation
    if (socket.isAuthenticated && socket.accountName && uploadMbps > 0) {
      // Security: Cap uploadMbps to realistic maximum (100 Mbps) to prevent infinite credit exploits
      const validUploadMbps = Math.min(Number(uploadMbps) || 0, 100);
      const earnedCredits = validUploadMbps * 0.01; // Match frontend logic

      // ⚡ Performance Optimization:
      // Use specialized single-user transaction to avoid 'squad' and 'updates' array allocations.
      // This significantly reduces GC pressure for this high-frequency (2s) event.
      try {
        const row = updateSingleUserCreditsTx(socket.accountName, earnedCredits);
        if (row) {
          io.to(`user:${socket.accountName}`).emit('wallet-update', { balance: row.credits });
        }
      } catch (err) {
        console.error('[Metrics] Failed to update credits:', err);
      }
    }

    if (streamMeshTopology.has(streamId)) {
      const mesh = streamMeshTopology.get(streamId);
      const node = mesh.get(socket.id);

      if (node && node.metrics) {
        // ⚡ Performance Optimization: Update properties directly to avoid re-allocating the metrics object.
        node.metrics.latency = latency;
        node.metrics.uploadMbps = uploadMbps;

        // Advanced Mesh Routing: Handling "Bad" Nodes
        // If upload is terribly slow or latency is very high, forcefully evict children to keep the tree healthy
        if ((uploadMbps > 0 && uploadMbps < 0.5) || latency > 1000) {
           if (node.children.size > 0) {
             console.log(`[Mesh] Node ${socket.id} in stream ${streamId} identified as poor performing (upload: ${uploadMbps}Mbps, lat: ${latency}ms). Re-parenting children...`);
             const orphans = Array.from(node.children);
             for (const orphanId of orphans) {
                // Remove from parent
                node.children.delete(orphanId);
                const orphanNode = mesh.get(orphanId);
                if (orphanNode) orphanNode.parent = null;

                // Disconnect their P2P connection
                io.to(orphanId).emit('user-disconnected', { id: socket.id });
                io.to(socket.id).emit('user-disconnected', { id: orphanId });

                // Find a new parent
                addNodeToMesh(streamId, orphanId, false);
             }
           }
        }
      }
    }
  });

  // --- Co-Streaming Squad Logic ---
  socket.on('update-squad', ({ streamId, squad }) => {
    if (!streamId || socket.currentRoom !== streamId) return;

    // 🛡️ SECURITY: Only authenticated hosts can update squad
    // Only host can update squad
    if (!socket.isAuthenticated || socket.username !== streamId) return;

    if (!Array.isArray(squad)) return;

    // Validate split percentages equal 100
    const totalSplit = squad.reduce((sum, member) => sum + (Number(member.split) || 0), 0);
    if (Math.abs(totalSplit - 100) > 0.01) {
       console.log(`[Squad] Invalid split percentage total: ${totalSplit} for stream ${streamId}`);
       return;
    }

    // Security: Prevent negative splits which could generate infinite money or drain tipper
    if (squad.some(m => Number(m.split) < 0 || Number(m.split) > 100)) {
       console.log(`[Squad] Invalid split bounds for stream ${streamId}`);
       return;
    }

    // Map frontend 'name' to 'username' for backend tracking
    const backendSquad = squad.map(m => ({ username: m.name, split: Number(m.split) }));
    streamSquads.set(streamId, backendSquad);
    console.log(`[Squad] Updated for stream ${streamId}`, backendSquad);
  });

  // --- Poll Logic ---

  socket.on('create-poll', ({ streamId, question, options, duration }) => {
    if (!streamId || socket.currentRoom !== streamId) return;

    // 🛡️ SECURITY: Only authenticated hosts can create polls
    // Only host can create polls (simple check: username matches streamId)
    if (!socket.isAuthenticated || socket.username !== streamId) return;

    // Validation
    if (!question || typeof question !== 'string' || question.trim().length === 0 || question.length > 200) return;
    if (!options || !Array.isArray(options) || options.length < 2 || options.length > 5) return;

    const sanitizedOptions = options
      .map(opt => typeof opt === 'string' ? opt.trim() : '')
      .filter(opt => opt.length > 0 && opt.length <= 100);

    if (sanitizedOptions.length < 2) return;

    // Cleanup existing poll if any
    cleanupPoll(streamId);

    // Max duration: 1 hour (3600 seconds)
    const validDuration = (typeof duration === 'number' && duration > 0) ? Math.min(duration, 3600) : null;

    const poll = {
      id: Date.now(),
      question: question.trim(),
      options: sanitizedOptions.map(opt => ({ text: opt, votes: 0 })),
      totalVotes: 0,
      isActive: true,
      voters: new Set(), // Track who voted
      duration: validDuration
    };

    if (poll.duration) {
        poll.timeoutId = setTimeout(() => {
            if (activePolls.has(streamId) && activePolls.get(streamId).id === poll.id) {
                const currentPoll = activePolls.get(streamId);
                currentPoll.isActive = false;
                const { voters: _v, timeoutId: _t, ...pollData } = currentPoll;
                io.to(streamId).emit('poll-ended', pollData);
                activePolls.delete(streamId);
            }
        }, poll.duration * 1000).unref();
    }

    activePolls.set(streamId, poll);
    const { voters: _v, timeoutId: _t, ...pollData } = poll;
    io.to(streamId).emit('poll-started', pollData);
  });

  socket.on('vote-poll', ({ streamId, pollId, optionIndex }) => {
    if (!streamId || socket.currentRoom !== streamId) return;

    const poll = activePolls.get(streamId);
    if (!poll || poll.id !== pollId || !poll.isActive) return;

    // Use username for persistent identity, fallback to socket.id for guests
    const voterId = socket.username || socket.id;

    if (poll.voters.has(voterId)) {
        return; // Already voted
    }

    if (Number.isInteger(optionIndex) && optionIndex >= 0 && optionIndex < poll.options.length) {
      poll.options[optionIndex].votes++;
      poll.totalVotes++;
      poll.voters.add(voterId);

      // Broadcast update (exclude voters set and timeoutId)
      const { voters: _v, timeoutId: _t, ...pollData } = poll;
      io.to(streamId).emit('poll-update', pollData);
    }
  });

  socket.on('end-poll', ({ streamId }) => {
    if (!streamId || socket.currentRoom !== streamId) return;
    // 🛡️ SECURITY: Only authenticated hosts can end polls
    if (!socket.isAuthenticated || socket.username !== streamId) return;

    cleanupPoll(streamId, true);
  });

  socket.on('raid-stream', ({ streamId, targetId }) => {
    if (!streamId || socket.currentRoom !== streamId) return;
    // 🛡️ SECURITY: Only authenticated hosts can initiate raids
    if (!socket.isAuthenticated || socket.username !== streamId) return; // Only host can raid
    if (!targetId || targetId === streamId) return;

    // 🌉 Bridge: Validate that the target stream is actually online
    if (!activeStreams.has(targetId)) {
      console.log(`[Raid] ${streamId} attempted to raid offline target ${targetId}`);
      return;
    }

    console.log(`[Raid] ${streamId} is raiding ${targetId}`);

    if (activeStreams.has(streamId)) {
      const viewersCount = io.sockets.adapter.rooms.get(streamId)?.size || 0;

      activeStreams.delete(streamId);
      streamSquads.delete(streamId);
      broadcasterSessions.delete(streamId);
      lastAdTrigger.delete(streamId);
      relayerSplitsCache.delete(streamId);
      cleanupPoll(streamId, true);

      // 🌉 Bridge: Notify the target stream's chat about the incoming raid
      io.to(targetId).emit('chat-message', {
        id: Date.now(),
        user: 'System',
        text: `${socket.username} is raiding with ${viewersCount} viewers! Welcome!`,
        color: 'text-beacon-400 font-bold',
        senderId: 'system'
      });

      // Notify viewers to redirect to the target stream
      socket.to(streamId).emit('stream-ended', { redirect: targetId });
    }
  });

  // --- Stream Metadata ---
  socket.on('update-stream-info', ({ streamId, title, tags }) => {
    if (!streamId || socket.currentRoom !== streamId) return;

    // 🛡️ SECURITY: Only authenticated hosts can update stream info
    // Only host can update stream info
    if (!socket.isAuthenticated || socket.username !== streamId) return;

    // Basic Validation
    const safeTitle = (typeof title === 'string') ? title.trim().substring(0, 100) : 'Beacon Stream';
    const safeTags = (typeof tags === 'string') ? tags.trim().substring(0, 100) : '';

    const existing = activeStreams.get(streamId) || {};
    const streamInfo = {
      ...existing,
      title: safeTitle,
      tags: safeTags,
      streamer: socket.username
    };

    activeStreams.set(streamId, streamInfo);

    // Broadcast update to all viewers in the room
    io.to(streamId).emit('stream-info-updated', streamInfo);
    console.log(`[StreamInfo] Updated for ${streamId}:`, streamInfo);
  });

  // ------------------

  // WebRTC Signaling
  socket.on('signal', ({ to, signal }) => {
    if (to) {
      const targetSocket = io.sockets.sockets.get(to);
      if (targetSocket && targetSocket.currentRoom === socket.currentRoom) {
        io.to(to).emit('signal', {
          from: socket.id,
          signal
        });
      }
    }
  });

  socket.on('offer', (payload) => {
    if (payload && payload.target) {
      const targetSocket = io.sockets.sockets.get(payload.target);
      if (targetSocket && targetSocket.currentRoom === socket.currentRoom) {
        io.to(payload.target).emit('offer', { ...payload, sender: socket.id });
      }
    }
  });

  socket.on('answer', (payload) => {
    if (payload && payload.target) {
      const targetSocket = io.sockets.sockets.get(payload.target);
      if (targetSocket && targetSocket.currentRoom === socket.currentRoom) {
        io.to(payload.target).emit('answer', { ...payload, sender: socket.id });
      }
    }
  });

  socket.on('ice-candidate', (payload) => {
    if (payload && payload.target) {
      const targetSocket = io.sockets.sockets.get(payload.target);
      if (targetSocket && targetSocket.currentRoom === socket.currentRoom) {
        io.to(payload.target).emit('ice-candidate', { ...payload, sender: socket.id });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const streamId = socket.currentRoom;

    if (streamId) {
      // Track broadcaster session cleanup
      if (socket.isAuthenticated && socket.accountName === streamId) {
        updateBroadcasterSession(streamId, socket.id, false);
      }

      // 🛡️ SECURITY: Only end stream if this is the LAST authenticated broadcaster session
      // activeStreams logic: If host leaves, redirect viewers
      if (socket.isAuthenticated && socket.username === streamId && activeStreams.has(streamId) && !isAnotherBroadcasterActive(streamId, socket.id)) {
          activeStreams.delete(streamId);
          streamSquads.delete(streamId);
          lastAdTrigger.delete(streamId);
          relayerSplitsCache.delete(streamId);

          cleanupPoll(streamId, true);

          const redirect = getRandomStreamId();
          socket.to(streamId).emit('stream-ended', { redirect });
      }

      // Remove from Mesh Tracker
      removeNodeFromMesh(streamId, socket.id);

      // Socket is automatically removed from rooms on disconnect
      const count = io.sockets.adapter.rooms.get(streamId)?.size || 0;
      io.to(streamId).emit('room-users-update', count);
      socket.to(streamId).emit('user-disconnected', { id: socket.id, username: socket.username });
    }
  });
});

if (process.env.SERVE_STATIC) {
  const buildPath = path.join(__dirname, 'client_build');
  app.use(express.static(buildPath));

  // The wildcard route for SPA should only catch non-API routes
  app.get(/^(?!\/api).*$/, (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Backend is running with Socket.IO');
  });
}

// Endpoint for Launcher to fetch network stats
app.get('/api/node-stats', (req, res) => {
    // Total connected sockets across all namespaces
    const meshNodes = io.engine.clientsCount;
    res.json({
        status: 'Online',
        meshNodes: meshNodes
    });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
  });
}

module.exports = {
  server,
  io,
  activeStreams,
  streamSquads,
  broadcasterSessions,
  updateBroadcasterSession,
  isAnotherBroadcasterActive,
  JWT_SECRET
};
