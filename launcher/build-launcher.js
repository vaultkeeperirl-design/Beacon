const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const launcherDir = __dirname;
const resourcesDir = path.join(launcherDir, 'resources');
const backendDest = path.join(resourcesDir, 'backend');
const frontendDist = path.join(rootDir, 'frontend', 'dist');
const clientBuildDest = path.join(backendDest, 'client_build');

const run = (cmd, cwd, env = process.env) => {
  console.log(`[Build] Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: cwd || rootDir, env });
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
  // Use pnpm to install production dependencies within the backend directory.
  // We remove the workspace link for pnpm to avoid issues.
  if (fs.existsSync(path.join(backendDest, 'pnpm-workspace.yaml'))) {
    fs.unlinkSync(path.join(backendDest, 'pnpm-workspace.yaml'));
  }

  // Configure environment variables to cross-compile native modules for Electron
  const launcherPkg = require('./package.json');
  const electronVersion = launcherPkg.devDependencies.electron.replace(/^[^\d]+/, '');

  const buildEnv = {
    ...process.env,
    npm_config_runtime: 'electron',
    npm_config_target: electronVersion,
    npm_config_disturl: 'https://electronjs.org/headers',
    npm_config_build_from_source: 'true'
  };

  // Use pnpm to install since the root uses pnpm. Ignore workspace root.
  run('pnpm install --prod --ignore-workspace', backendDest, buildEnv);

  // Explicitly rebuild native modules like better-sqlite3 for the target Electron architecture
  run('pnpm rebuild better-sqlite3', backendDest, buildEnv);

  console.log('Build Preparation Complete.');
} catch (error) {
  console.error('Build Failed:', error);
  process.exit(1);
}
