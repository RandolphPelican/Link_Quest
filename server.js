// Unified build entry point
console.log("Initializing Link Quest server...");
const path = require('path');
require(path.join(__dirname, 'dist/server/index.js'));

