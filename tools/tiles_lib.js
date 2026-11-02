// Shared helpers: read the Gebeta key, fetch and decode Gebeta vector tiles.
const fs = require('fs');
const zlib = require('zlib');
const PNPM = 'C:/Users/cappybara/Documents/post-office-customer-web-v2-dev (1)/post-office-customer-web-v2-dev/node_modules/.pnpm/';
const { VectorTile } = require(PNPM + '@mapbox+vector-tile@1.3.1/node_modules/@mapbox/vector-tile');
const Pbf = require(PNPM + 'pbf@3.3.0/node_modules/pbf');

const SOURCES = { boundaries: 'l5', roads: 'l0', landuse: 'l2', water: 'l3' };

function readKey(configPath) {
  const key = (fs.readFileSync(configPath, 'utf8').match(/apiKey:\s*'([^']+)'/) || [])[1];
  if (!key) throw new Error('No key in config.js');
  return key;
}

async function getTile(key, source, z, x, y) {
  const url = `https://tiles.gebeta.app/tiles/${SOURCES[source]}/${z}/${x}/${y}.pbf`;
  const res = await fetch(url, { headers: { Authorization: 'Bearer ' + key } });
  if (res.status === 204 || res.status === 404) return null;
  if (!res.ok) throw new Error(`${source} ${z}/${x}/${y}: HTTP ${res.status}`);
  let buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) return null;
  if (buf[0] === 0x1f && buf[1] === 0x8b) buf = zlib.gunzipSync(buf);
  return new VectorTile(new Pbf(buf));
}

const lon2x = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z);
const lat2y = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};

module.exports = { readKey, getTile, lon2x, lat2y, SOURCES };
