const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const launcherDir = __dirname;
const resourcesDir = path.join(launcherDir, 'resources');
const backendDest = path.join(resourcesDir, 'backend');
const frontendDist = path.join(rootDir, 'frontend', 'dist');
const clientBuildDest = path.join(backendDest, 'client_build');

const run = (cmd, cwd) => {
  console.log(`[Build] Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: cwd || rootDir });
};

try {
  console.log('Starting Launcher Build Process...');

  // 1. Clean previous backend resources
  if (fs.existsSync(backendDest)) {
    console.log('Cleaning backend resources...');
    fs.rmSync(backendDest, { recursive: true, force: true });
  }

  // 2. Build Frontend
  console.log('Building Frontend...');
  const frontendDir = path.join(rootDir, 'frontend');
  if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
      run('pnpm install', frontendDir);
  }
  run('pnpm build', frontendDir);

  // 3. Copy Backend (excluding node_modules)
  console.log('Copying Backend...');
  const backendSource = path.join(rootDir, 'backend');
  fs.mkdirSync(resourcesDir, { recursive: true });

  fs.cpSync(backendSource, backendDest, {
    recursive: true,
    filter: (src) => !src.includes('node_modules') && !src.includes('.git') && !src.includes('.DS_Store')
  });

  // 4. Copy Frontend Build to Backend
  console.log('Copying Frontend build to Backend...');
  fs.cpSync(frontendDist, clientBuildDest, { recursive: true });

  // 5. Install Backend Production Dependencies
  console.log('Installing Backend dependencies...');
  run('pnpm install --prod', backendDest);

  console.log('Build Preparation Complete.');
} catch (error) {
  console.error('Build Failed:', error);
  process.exit(1);
}
