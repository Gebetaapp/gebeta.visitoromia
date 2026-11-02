// Lists the sources and layers of the Gebeta standard style (prints no key).
const fs = require('fs');
const cfg = fs.readFileSync(process.argv[2], 'utf8');
const key = (cfg.match(/apiKey:\s*'([^']+)'/) || [])[1];
if (!key) throw new Error('No key in config.js');
const headers = { Authorization: 'Bearer ' + key };

(async () => {
  const style = await (await fetch('https://tiles.gebeta.app/styles/standard/style.json', { headers })).json();
  console.log('sources:', JSON.stringify(Object.fromEntries(Object.entries(style.sources).map(([k, v]) => [k, { type: v.type, url: v.url, tiles: v.tiles, minzoom: v.minzoom, maxzoom: v.maxzoom }])), null, 1));
  for (const l of style.layers) {
    const paint = Object.entries(l.paint || {}).filter(([k]) => /color|opacity|dasharray|width/.test(k)).map(([k, v]) => `${k}=${JSON.stringify(v).slice(0, 70)}`).join(' ');
    console.log(`${l.type.padEnd(10)} ${l.id.padEnd(34)} ${(l['source-layer'] || '').padEnd(18)} z${l.minzoom ?? ''}-${l.maxzoom ?? ''} ${l.filter ? JSON.stringify(l.filter).slice(0, 60) : ''} | ${paint}`);
  }
})();
