// Builds shareable versions of the demo from this folder:
//   dist/Visit-Oromia-Demo.html        one file that opens with a double-click; includes the API key
//   dist/visit-oromia-artifact.html    a Claude artifact page: no key, MapLibre from a CDN, built-in map
//   dist/artifact-preview.html         the artifact page wrapped for checking it locally
// Usage: node build-single.js
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const read = (file) => fs.readFileSync(path.join(dir, file), 'utf8');
// A literal "</script" inside inlined code would end the script tag early.
const safeScript = (js) => js.replace(/<\/script/gi, '<\\/script');
const MAPLIBRE_CDN = 'https://cdn.jsdelivr.net/npm/maplibre-gl@5.2.0/dist/maplibre-gl.js';
const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(dir, 'assets/gebeta-logo-64.png')).toString('base64');

function photoData() {
  const files = fs.readdirSync(path.join(dir, 'photos')).filter((f) => f.endsWith('.jpg'));
  const data = Object.fromEntries(files.map((f) => [f, 'data:image/jpeg;base64,' + fs.readFileSync(path.join(dir, 'photos', f)).toString('base64')]));
  return `<script>\nwindow.DEMO_PHOTO_DATA = ${JSON.stringify(data)};\n</script>\n`;
}

// The artifact loads photos from files published next to the page; the single file embeds them.
function build({ withKey, maplibreFromCdn, embedPhotos }) {
  let html = read('index.html');
  const swap = (tag, replacement) => {
    if (!html.includes(tag)) throw new Error('index.html no longer contains: ' + tag);
    html = html.replace(tag, () => replacement); // a function, so "$" in the code is left alone
  };
  swap('<link rel="stylesheet" href="vendor/maplibre-gl.css">', `<style>\n${read('vendor/maplibre-gl.css')}\n</style>`);
  swap('<link rel="stylesheet" href="styles.css">', `<style>\n${read('styles.css')}\n</style>`);
  const config = withKey ? read('config.js') : read('config.js').replace(/apiKey:\s*'[^']*'/, "apiKey: ''");
  swap('<script src="config.js"></script>', `<script>\n${safeScript(config)}\n</script>`);
  swap('<script src="vendor/maplibre-gl.js"></script>', maplibreFromCdn
    ? `<script src="${MAPLIBRE_CDN}"></script>`
    : `<script>\n${safeScript(read('vendor/maplibre-gl.js'))}\n</script>`);
  for (const file of ['vo-map.js', 'sites.js', 'data.js', 'basemap.js', 'app.js']) {
    const before = file === 'data.js' && embedPhotos ? photoData() : '';
    swap(`<script src="${file}"></script>`, `${before}<script>\n${safeScript(read(file))}\n</script>`);
  }
  html = html.split('assets/gebeta-logo.png').join(logo);
  const left = (html.match(/(?:src|href)="(?!https?:|data:|#|\$\{)[^"]+"/g) || []);
  if (left.length) throw new Error('Still points at local files: ' + left.join(', '));
  return html;
}

// An artifact page is wrapped in its own document at publish time, so it starts at <title>.
function toArtifact(html) {
  return html
    .replace(/^[\s\S]*?<head>\s*/i, '')
    .replace(/<meta charset[^>]*>\s*/i, '')
    .replace(/<meta name="viewport"[^>]*>\s*/i, '')
    .replace(/<meta name="description"[^>]*>\s*/i, '')
    .replace(/<link rel="icon"[^>]*>\s*/i, '')
    .replace(/<\/head>\s*<body>\s*/i, '\n')
    .replace(/\s*<\/body>\s*<\/html>\s*$/i, '\n');
}

const outDir = path.join(dir, 'dist');
fs.mkdirSync(outDir, { recursive: true });
const write = (name, text) => {
  fs.writeFileSync(path.join(outDir, name), text);
  console.log(`Wrote dist/${name} (${(Buffer.byteLength(text) / 1024).toFixed(0)} KB)`);
};

const hasKey = /apiKey:\s*'[^']+'/.test(read('config.js'));
write('Visit-Oromia-Demo.html', build({ withKey: true, maplibreFromCdn: false, embedPhotos: true }));
console.log(hasKey ? '  includes the API key from config.js' : '  no API key: uses the built-in map');
const artifact = toArtifact(build({ withKey: false, maplibreFromCdn: true, embedPhotos: false }));
if (!artifact.trimStart().startsWith('<title>')) throw new Error('The artifact page must start with its <title>');
write('visit-oromia-artifact.html', artifact);
// The artifact's photos are published from dist/photos, next to the page.
fs.mkdirSync(path.join(outDir, 'photos'), { recursive: true });
for (const f of fs.readdirSync(path.join(dir, 'photos'))) fs.copyFileSync(path.join(dir, 'photos', f), path.join(outDir, 'photos', f));
write('artifact-preview.html','<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n' + artifact + '</body>\n</html>\n');
