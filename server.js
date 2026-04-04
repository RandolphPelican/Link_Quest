const fs = require('fs');
const path = require('path');

// Target path after simplified build
const entryPoint = path.join(__dirname, 'server', 'dist', 'server', 'src', 'index.js');

if (fs.existsSync(entryPoint)) {
  console.log(`Starting server from: ${entryPoint}`);
  require(entryPoint);
} else {
  console.error(`CRITICAL ERROR: Could not find server entry point at: ${entryPoint}`);
  console.log("Current directory contents:");
  
  function listDir(dir, depth = 0) {
    if (depth > 3) return;
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);
        console.log("  ".repeat(depth) + (stats.isDirectory() ? "[DIR] " : "") + file);
        if (stats.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
          listDir(fullPath, depth + 1);
        }
      });
    } catch (e) {}
  }
  listDir(__dirname);
  process.exit(1);
}
