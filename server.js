const fs = require('fs');
const path = require('path');

// Target paths after simplified build
const candidates = [
  path.join(__dirname, 'server', 'dist', 'server', 'src', 'index.js'),
  path.join(__dirname, 'server', 'dist', 'index.js'),
  path.join(__dirname, 'dist', 'server', 'src', 'index.js'),
  path.join(__dirname, 'dist', 'index.js'),
];

let entryPoint = null;
for (const cand of candidates) {
  if (fs.existsSync(cand)) {
    entryPoint = cand;
    break;
  }
}

if (entryPoint) {
  console.log(`Starting server from: ${entryPoint}`);
  require(entryPoint);
} else {
  console.error(`CRITICAL ERROR: Could not find server entry point.`);
  console.log("Search paths tried:");
  candidates.forEach(c => console.log(`  - ${c}`));
  
  console.log("\nFull directory listing for troubleshooting:");
  function listDir(dir, depth = 0) {
    if (depth > 2) return;
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);
        console.log("  ".repeat(depth) + (stats.isDirectory() ? "[DIR] " : "") + file);
        if (stats.isDirectory() && !['node_modules', '.git', '.cache'].includes(file)) {
          listDir(fullPath, depth + 1);
        }
      });
    } catch (e) {}
  }
  listDir(__dirname);
  process.exit(1);
}
