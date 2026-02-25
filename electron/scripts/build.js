const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.resolve(rootDir, '../frontend');
const backendDir = path.resolve(rootDir, '../backend');
const distDir = path.join(rootDir, 'dist');
const distFrontend = path.join(distDir, 'frontend');
const distBackend = path.join(distDir, 'backend');
const buildDir = path.join(rootDir, 'build');

console.log('Cleaning dist...');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Ensure build dir exists
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

console.log('Building Frontend...');
// Use pnpm if available, otherwise npm
// Assuming pnpm is available as per user request
execSync('pnpm install && pnpm build', { cwd: frontendDir, stdio: 'inherit' });

console.log('Copying Frontend...');
fs.cpSync(path.join(frontendDir, 'dist'), distFrontend, { recursive: true });

console.log('Copying Backend...');
// Custom copy implementation to filter out node_modules and .git
const filter = (src, dest) => {
  if (src.includes('node_modules') || src.includes('.git') || src.includes('tests')) {
    return false;
  }
  return true;
};
fs.cpSync(backendDir, distBackend, { recursive: true, filter });

console.log('Installing Backend Deps...');
execSync('npm install --omit=dev', { cwd: distBackend, stdio: 'inherit' });

console.log('Copying Icon...');
const iconSrc = path.join(frontendDir, 'public/icon.png');
if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, path.join(buildDir, 'icon.png'));
} else {
  console.warn('Icon not found at:', iconSrc);
}

console.log('Build preparation complete.');
