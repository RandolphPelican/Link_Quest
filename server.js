console.log("Initializing Link Quest server...");

const path = require("path");
const fs = require("fs");

const serverEntry = path.resolve(__dirname, "dist", "server", "index.js");

console.log("Resolved server entry:", serverEntry);
console.log("Exists?", fs.existsSync(serverEntry));

require(serverEntry);
