const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".mobileconfig": "application/x-apple-aspen-config"
};

function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "127.0.0.1";
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (u.pathname === "/__lan.json") {
    const lanIp = getLanIp();
    const payload = JSON.stringify({
      ip: lanIp,
      port: PORT,
      lanBound: true,
      url: `http://${lanIp}:${PORT}/`
    });
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end(payload);
    return;
  }

  let relPath = decodeURIComponent(u.pathname);
  if (relPath === "/") relPath = "/index.html";

  const safePath = path.normalize(path.join(ROOT, relPath));
  if (!safePath.startsWith(path.normalize(ROOT))) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(safePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(safePath).toLowerCase();
    const headers = {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    };
    if (ext === ".mobileconfig") {
      headers["Content-Disposition"] = 'attachment; filename="iron-arc-shield.mobileconfig"';
    }
    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, () => {
  const lanIp = getLanIp();
  console.log("=====================================================");
  console.log(" IRON ARC (iOS App + Blocker + Lock Quote) LIVE:");
  console.log(` -> Local:   http://localhost:${PORT}/`);
  console.log(` -> Wi-Fi:   http://${lanIp}:${PORT}/`);
  console.log("=====================================================");
});
