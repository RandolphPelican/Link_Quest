const fs = require('fs');
const path = require('path');

// Try various common locations where tsc might have put the entry point
const candidates = [
  path.join(__dirname, 'server', 'dist', 'index.js'), // Flat (preferred)
  path.join(__dirname, 'server', 'dist', 'src', 'index.js'), // Nested src
  path.join(__dirname, 'server', 'dist', 'server', 'src', 'index.js'), // Deeply nested
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
  console.error("CRITICAL ERROR: Could not find server/dist/index.js (or any candidate).");
  console.log("Current directory contents:");
  
  function listDir(dir, depth = 0) {
    if (depth > 3) return;
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);
        console.log("  ".repeat(depth) + (stats.isDirectory() ? "[DIR] " : "") + file);
        if (stats.isDirectory() && !file.includes('node_modules')) {
          listDir(fullPath, depth + 1);
        }
      });
    } catch (e) {}
  }
  listDir(__dirname);
  process.exit(1);
}
