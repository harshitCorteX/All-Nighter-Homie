// Development server, deliberately limited to known public application files.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const files = { '/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'], '/styles.css': ['styles.css', 'text/css'], '/core.js': ['core.js', 'text/javascript'], '/app.js': ['app.js', 'text/javascript'] };
Object.assign(files, { '/sw.js': ['sw.js', 'text/javascript'], '/manifest.webmanifest': ['manifest.webmanifest', 'application/manifest+json'], '/assets/icon.svg': ['assets/icon.svg', 'image/svg+xml'], '/assets/homie-desk.svg': ['assets/homie-desk.svg', 'image/svg+xml'] });
const server = http.createServer(async (req, res) => {
  const file = files[req.url.split('?')[0]];
  if (!file) { res.writeHead(404); return res.end('Not found'); }
  try { const data = await fs.readFile(path.join(__dirname, file[0])); res.writeHead(200, { 'Content-Type': file[1] + '; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(data); }
  catch { res.writeHead(500); res.end('Unable to read application file'); }
});
server.listen(Number(process.env.PORT) || 4173, '127.0.0.1', () => console.log(`All Nighter Homie is ready at http://127.0.0.1:${server.address().port}`));
