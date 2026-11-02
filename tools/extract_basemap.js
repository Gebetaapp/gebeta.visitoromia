// Builds basemap.js: a light GeoJSON basemap cut from Gebeta's own vector tiles, so the demo can
// show the map with no API key and no tile requests (for example inside a Claude artifact).
// Usage: node extract_basemap.js <config.js> <output basemap.js>
const fs = require('fs');
const { readKey, getTile, lon2x, lat2y } = require('./tiles_lib');
const key = readKey(process.argv[2]);
const out = process.argv[3];

const layers = { boundaries: [], water: [], rivers: [], green: [], roads: [] };
const lakeNames = new Map();

// Region features outside this box (west, south, east, north) are left out.
const KEEP = [31, 1, 47, 15.5];
// Simplification tolerance in degrees, by number of decimals kept.
const TOLERANCE = { 3: 0.004, 4: 0.0002 };

function round(coords, d) {
  if (typeof coords[0] === 'number') return [+coords[0].toFixed(d), +coords[1].toFixed(d)];
  return coords.map((c) => round(c, d));
}
function simplifyLine(pts, tol) {
  if (pts.length <= 2) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const len = Math.hypot(bx - ax, by - ay);
    let far = -1, idx = -1;
    for (let i = a + 1; i < b; i++) {
      // Distance to the segment's line; to the point itself when the segment closes a ring.
      const d = len < 1e-12
        ? Math.hypot(pts[i][0] - ax, pts[i][1] - ay)
        : Math.abs((by - ay) * pts[i][0] - (bx - ax) * pts[i][1] + bx * ay - by * ax) / len;
      if (d > far) { far = d; idx = i; }
    }
    if (far > tol) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
function simplify(g, tol) {
  const ring = (r) => { const s = simplifyLine(r, tol); return s.length >= 4 ? s : null; };
  const poly = (rings) => { const rs = rings.map(ring); return rs[0] ? rs.filter(Boolean) : null; };
  switch (g.type) {
    case 'LineString': return { type: g.type, coordinates: simplifyLine(g.coordinates, tol) };
    case 'MultiLineString': return { type: g.type, coordinates: g.coordinates.map((l) => simplifyLine(l, tol)).filter((l) => l.length > 1) };
    case 'Polygon': { const p = poly(g.coordinates); return p && { type: g.type, coordinates: p }; }
    case 'MultiPolygon': { const ps = g.coordinates.map(poly).filter(Boolean); return ps.length ? { type: g.type, coordinates: ps } : null; }
    default: return g;
  }
}
function bbox(coords, b = [Infinity, Infinity, -Infinity, -Infinity]) {
  if (typeof coords[0] === 'number') {
    b[0] = Math.min(b[0], coords[0]); b[1] = Math.min(b[1], coords[1]);
    b[2] = Math.max(b[2], coords[0]); b[3] = Math.max(b[3], coords[1]);
  } else coords.forEach((c) => bbox(c, b));
  return b;
}
function push(list, f, props, digits) {
  const g = simplify(f.geometry, TOLERANCE[digits]);
  if (!g || !g.coordinates.length) return;
  if (digits === 3) {
    const [w, s, e, n] = bbox(g.coordinates);
    if (e < KEEP[0] || w > KEEP[2] || n < KEEP[1] || s > KEEP[3]) return;
  }
  list.push({ type: 'Feature', properties: props, geometry: { type: g.type, coordinates: round(g.coordinates, digits) } });
}
function addLakeName(p, geo, digits) {
  const name = p['name:latin'];
  if (!name || /\?/.test(name) || lakeNames.has(name)) return;
  const c = geo().geometry.coordinates;
  const [lon, lat] = Array.isArray(c[0]) ? c[0] : c;
  if (lon < 34 || lon > 43 || lat < 3.4 || lat > 10.6) return; // only lakes in or next to Oromia
  lakeNames.set(name, [name, +lon.toFixed(digits), +lat.toFixed(digits)]);
}

async function harvest(z, xs, ys, pick, digits) {
  const jobs = [];
  for (const x of xs) for (const y of ys) for (const source of ['boundaries', 'roads', 'landuse', 'water']) jobs.push({ z, x, y, source });
  let i = 0;
  async function worker() {
    while (i < jobs.length) {
      const { z, x, y, source } = jobs[i++];
      const tile = await getTile(key, source, z, x, y);
      if (!tile) continue;
      for (const [name, layer] of Object.entries(tile.layers)) {
        for (let k = 0; k < layer.length; k++) {
          const feat = layer.feature(k);
          pick(source, name, feat.properties, () => feat.toGeoJSON(x, y, z), digits);
        }
      }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
}
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

function pickRegion(source, name, p, geo, d) {
  if (name === 'boundary' && (p.class === 'country' || p.class === 'state')) push(layers.boundaries, geo(), { c: p.class }, d);
  else if (name === 'water' && p.class === 'lake') push(layers.water, geo(), {}, d);
  else if (name === 'landcover' && (p.class === 'wood' || p.class === 'grass')) push(layers.green, geo(), {}, d);
  else if (name === 'transportation' && (p.class === 'motorway' || p.class === 'trunk')) push(layers.roads, geo(), { c: p.class }, d);
  else if (name === 'water_name' && p.class === 'lake') addLakeName(p, geo, d);
}
function pickDetail(source, name, p, geo, d) {
  if (name === 'boundary' && p.class === 'subregion') push(layers.boundaries, geo(), { c: 'subregion' }, d);
  else if (name === 'water' && p.class === 'lake') push(layers.water, geo(), {}, d);
  else if (name === 'waterway' && p.class === 'river') push(layers.rivers, geo(), {}, d);
  else if (name === 'landcover' && (p.class === 'wood' || p.class === 'grass')) push(layers.green, geo(), {}, d);
  else if (name === 'transportation' && (p.class === 'primary' || p.class === 'secondary')) push(layers.roads, geo(), { c: p.class }, d);
  else if (name === 'water_name' && p.class === 'lake') addLakeName(p, geo, d);
}

(async () => {
  // Whole region at zoom 6: Ethiopia and its neighbours around Oromia.
  await harvest(6, range(lon2x(30, 6), lon2x(47, 6)), range(lat2y(15, 6), lat2y(-1, 6)), pickRegion, 3);
  // Close-ups at zoom 10: Lake Langano for the add-a-place step, and Lake Wonchi.
  // Three by three tiles each: wide enough for the step view, and short of Addis Ababa's streets.
  for (const [lat, lon] of [[7.597, 38.761], [8.788, 37.889]]) {
    const cx = lon2x(lon, 10), cy = lat2y(lat, 10);
    await harvest(10, range(cx - 1, cx + 1), range(cy - 1, cy + 1), pickDetail, 4);
  }

  const fc = (features) => ({ type: 'FeatureCollection', features });
  const basemap = {
    source: 'Cut from Gebeta map tiles (zoom 6 for the region, zoom 10 around Lake Langano and Lake Wonchi).',
    boundaries: fc(layers.boundaries), water: fc(layers.water), rivers: fc(layers.rivers),
    green: fc(layers.green), roads: fc(layers.roads),
    lakes: Array.from(lakeNames.values()),
  };
  const js = '/* Basemap cut from Gebeta map tiles. Regenerate it rather than editing by hand. */\nwindow.GEBETA_BASEMAP = ' + JSON.stringify(basemap) + ';\n';
  fs.writeFileSync(out, js);
  const tier = (v, region) => v.filter((f) => region === /\.\d{3}(?!\d)/.test(JSON.stringify(f.geometry.coordinates[0]))).length;
  const counts = Object.fromEntries(Object.entries(layers).map(([k, v]) => [k, `${v.length} (${(JSON.stringify(v).length / 1024).toFixed(0)} KB)`]));
  console.log('features', counts, 'lake names', lakeNames.size, 'size', (js.length / 1024).toFixed(0) + ' KB');
  console.log('roads by class', layers.roads.reduce((m, f) => ((m[f.properties.c] = (m[f.properties.c] || 0) + 1), m), {}), 'region-tier roads', tier(layers.roads, true));
})().catch((e) => { console.error(e.message); process.exit(1); });
