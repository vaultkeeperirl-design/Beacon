const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const tempDir = path.join(rootDir, 'temp_lifecycle');

const sourcePath = path.join(tempDir, 'source_backend');
const userDataPath = path.join(tempDir, 'userData');
const installPath = path.join(userDataPath, 'beacon-backend');

async function setup() {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir);
  fs.mkdirSync(sourcePath);
  fs.mkdirSync(userDataPath);

  // Populate source
  fs.writeFileSync(path.join(sourcePath, 'server.js'), 'console.log("server");');
  fs.mkdirSync(path.join(sourcePath, 'client_build'));
  fs.writeFileSync(path.join(sourcePath, 'client_build', 'index.html'), '<html></html>');

  // Create .git folder to test filter
  fs.mkdirSync(path.join(sourcePath, '.git'));
  fs.writeFileSync(path.join(sourcePath, '.git', 'config'), 'git config');
}

async function performInstall() {
  console.log('Testing install...');
  if (!fs.existsSync(installPath)) {
      await fsPromises.mkdir(installPath, { recursive: true });
  }

  const filter = (src) => {
    if (src.includes('.git')) return false;
    return true;
  };

  await fsPromises.cp(sourcePath, installPath, { recursive: true, filter });
}

async function verifyInstall() {
  console.log('Verifying install...');
  if (!fs.existsSync(path.join(installPath, 'server.js'))) throw new Error('server.js missing');
  if (!fs.existsSync(path.join(installPath, 'client_build', 'index.html'))) throw new Error('index.html missing');
  if (fs.existsSync(path.join(installPath, '.git'))) throw new Error('.git should not be copied');
  console.log('Install verified.');
}

async function performUninstall() {
  console.log('Testing uninstall...');
  if (fs.existsSync(installPath)) {
    await fsPromises.rm(installPath, { recursive: true, force: true });
  }
}

async function verifyUninstall() {
  console.log('Verifying uninstall...');
  if (fs.existsSync(installPath)) throw new Error('installPath still exists');
  console.log('Uninstall verified.');
}

(async () => {
  try {
    await setup();
    await performInstall();
    await verifyInstall();
    await performUninstall();
    await verifyUninstall();
    console.log('SUCCESS: Lifecycle tests passed.');
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {
    console.error('FAILURE:', e);
    process.exit(1);
  }
})();
