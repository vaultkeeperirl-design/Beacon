const net = require('net');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
  });
}

(async () => {
  const port = await getFreePort();
  const rootDir = path.resolve(__dirname, '..');
  const backendDir = path.join(rootDir, 'backend');
  const tempDir = path.join(rootDir, 'temp_verify_static');

  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir);

  fs.copyFileSync(path.join(backendDir, 'server.js'), path.join(tempDir, 'server.js'));

  // Symlink node_modules
  try {
    const target = path.join(backendDir, 'node_modules');
    const link = path.join(tempDir, 'node_modules');
    if (fs.existsSync(target)) {
        fs.symlinkSync(target, link, 'junction');
    } else {
        console.error('Backend node_modules not found. Run pnpm install in backend first.');
        process.exit(1);
    }
  } catch (e) {
    console.error('Failed to symlink node_modules:', e);
    process.exit(1);
  }

  const clientBuildDir = path.join(tempDir, 'client_build');
  fs.mkdirSync(clientBuildDir);
  fs.writeFileSync(path.join(clientBuildDir, 'index.html'), '<html><body>TEST VERIFIED</body></html>');

  console.log(`Starting server on port ${port}...`);

  const child = spawn('node', ['server.js'], {
    cwd: tempDir,
    env: { ...process.env, PORT: port.toString(), SERVE_STATIC: 'true' },
    stdio: 'pipe'
  });

  child.stdout.on('data', (data) => {
    console.log(`[Server]: ${data}`);
  });
  child.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data}`);
  });

  // Give server time to start
  setTimeout(() => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Response:', data);
        child.kill();
        fs.rmSync(tempDir, { recursive: true, force: true });
        if (data.includes('TEST VERIFIED')) {
          console.log('SUCCESS: Static file served correctly.');
          process.exit(0);
        } else {
          console.error('FAILURE: Unexpected response.');
          process.exit(1);
        }
      });
    });

    req.on('error', (err) => {
      console.error('Request failed:', err);
      child.kill();
      fs.rmSync(tempDir, { recursive: true, force: true });
      process.exit(1);
    });

    req.end();
  }, 2000);

})();
