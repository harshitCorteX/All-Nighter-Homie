// Static output for GitHub Pages or any static host; no framework required.
const fs = require('node:fs/promises');
const path = require('node:path');
const files = ['index.html', 'styles.css', 'core.js', 'app.js', 'sw.js', 'manifest.webmanifest', 'assets/icon.svg', 'assets/homie-desk.svg'];
(async () => {
  for (const name of files) {
    const target = path.join(__dirname, 'dist', name);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(path.join(__dirname, name), target);
  }
  await fs.writeFile(path.join(__dirname, 'dist', '.nojekyll'), '');
  console.log('All Nighter Homie: static app is ready in dist/');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
