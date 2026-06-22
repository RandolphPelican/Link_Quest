// Minimal HTTP server for the ngrok Agent CLI quickstart (port 8080).
import http from "node:http";

const PORT = 8080;
http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      "<!doctype html><meta charset=utf-8><title>ngrok quickstart</title>" +
        "<h1>Hello from localhost:8080</h1>" +
        "<p>If you can read this through your ngrok domain, the tunnel works.</p>"
    );
  })
  .listen(PORT, () => console.log(`quickstart server listening on :${PORT}`));
