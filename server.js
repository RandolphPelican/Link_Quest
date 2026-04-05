// Unified build entry point
console.log("Initializing Link Quest server...");

const path = require("path");
const fs = require("fs");

// Resolve the path to dist/server/index.js relative to this file
const serverEntry = path.resolve(__dirname, "..", "dist", "server", "index.js");

// Debug logging so we can SEE what Render is doing
console.log("Looking for server entry at:", serverEntry);
console.log("Exists?", fs.existsSync(serverEntry));

require(serverEntry);
