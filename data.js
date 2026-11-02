/* Data for the Gebeta and Visit Oromia demo.
   Places come from two sources:
   - Visit Oromia's own Oromia Tourist map (vo-map.js): real names, types, zones and descriptions.
     They are on the map from month 0, the day the partnership starts.
   - Sample listings: generic businesses and services that show the map growing during Year 1.
   Every visitor figure (views, directions, calls, saves) is sample data. */
(function () {
  'use strict';

  // Seeded random numbers, so the demo shows the same data on every load.
  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = rng(20261102);
  const between = (a, b) => a + rand() * (b - a);
  const jitter = (d) => (rand() * 2 - 1) * d;
  function weighted(items, weightOf) {
    const total = items.reduce((s, it) => s + weightOf(it), 0);
    let r = rand() * total;
    for (const it of items) { r -= weightOf(it); if (r <= 0) return it; }
    return items[items.length - 1];
  }
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const NOW = 7; // the dashboard shows month 7 of Year 1
  const TARGETS = { destination: 100, business: 400, service: 200, deal: 50, event: 3 };
  const TOTAL = { business: 412, service: 206, deal: 52 }; // by month 12
  const AT_NOW = { business: 251, service: 139, deal: 31 }; // by month 7
  const VO = window.VO_MAP || { sites: [], services: [] };

  // One spelling per zone, following Visit Oromia's map.
  const ZONE_NAMES = { 'East Wollega': 'East Wellega', 'West Wollega': 'West Wellega', 'Horo Guduru Wollega': 'Horo Gudru Wellega',
    'East Hararghe': 'East Hararge', 'West Hararghe': 'West Hararge' };
  const zoneName = (z) => ZONE_NAMES[z] || z || 'Oromia';

  // Towns used to spread sample listings and to label the built-in map: name, zone, lat, lon, weight.
  const TOWNS = [
    ['Bishoftu', 'East Shewa', 8.752, 38.978, 10], ['Adama', 'East Shewa', 8.540, 39.270, 9],
    ['Mojo', 'East Shewa', 8.587, 39.121, 3], ['Batu', 'East Shewa', 7.933, 38.717, 5],
    ['Woliso', 'South West Shewa', 8.537, 37.976, 4], ['Ambo', 'West Shewa', 8.983, 37.850, 5],
    ['Fiche', 'North Shewa', 9.800, 38.733, 2], ['Asella', 'Arsi', 7.950, 39.130, 4],
    ['Shashamane', 'West Arsi', 7.200, 38.590, 6], ['Dodola', 'West Arsi', 6.980, 39.180, 2],
    ['Robe', 'Bale', 7.120, 40.000, 4], ['Goba', 'Bale', 7.010, 39.980, 3], ['Ginir', 'East Bale', 7.130, 40.700, 1],
    ['Jimma', 'Jimma', 7.673, 36.835, 8], ['Agaro', 'Jimma', 7.850, 36.580, 2],
    ['Metu', 'Ilu Aba Bora', 8.300, 35.583, 2], ['Bedele', 'Buno Bedele', 8.450, 36.350, 2],
    ['Nekemte', 'East Wollega', 9.083, 36.550, 4], ['Gimbi', 'West Wollega', 9.170, 35.830, 1],
    ['Shambu', 'Horo Guduru Wollega', 9.570, 37.100, 1], ['Shakiso', 'Guji', 5.750, 38.920, 2],
    ['Negele', 'Guji', 5.330, 39.580, 2], ['Bule Hora', 'West Guji', 5.630, 38.250, 2],
    ['Yabelo', 'Borena', 4.880, 38.080, 2], ['Moyale', 'Borena', 3.580, 39.060, 1],
    ['Chiro', 'West Hararghe', 9.080, 40.870, 2], ['Haramaya', 'East Hararghe', 9.400, 42.020, 2],
  ].map(([name, zone, lat, lon, w]) => ({ name, zone: zoneName(zone), lat, lon, w }));

  // Photos with free licences from Wikimedia Commons, credited wherever they are shown.
  // The single-file build embeds the photos in DEMO_PHOTO_DATA; otherwise they load from photos/.
  const EMBEDDED = window.DEMO_PHOTO_DATA || {};
  const PHOTO = (file, credit) => ({ src: EMBEDDED[file] || 'photos/' + file, credit: credit + ' · Wikimedia Commons' });
  const PHOTOS = {
    wenchi: PHOTO('wenchi2.jpg', 'DeDuijn, CC BY-SA 4.0'), wenchi2: PHOTO('wenchi.jpg', 'Tricholome, CC BY-SA 4.0'),
    sofomar: PHOTO('sofomar.jpg', 'Rod Waddington, CC BY-SA 2.0'), sofomar2: PHOTO('sofomar2.jpg', 'Rod Waddington, CC BY-SA 2.0'),
    bale: PHOTO('bale.jpg', 'Richard Mortel, CC BY 2.0'), abbajifar: PHOTO('abbajifar.jpg', 'Rod Waddington, CC BY-SA 2.0'),
    langano: PHOTO('langano2.jpg', 'Sakari A. Maaranen, CC BY 3.0'), langano2: PHOTO('langano.jpg', 'Nina R, CC BY 2.0'),
    bishoftu: PHOTO('bishoftu.jpg', 'Nina R, CC BY 2.0'), bishoftu2: PHOTO('bishoftu2.jpg', 'DonCamillo, CC BY-SA 4.0'),
    ziway: PHOTO('ziway.jpg', 'Mjr74, CC BY 4.0'), menagesha: PHOTO('menagesha.jpg', 'Nina R, CC BY 2.0'),
    bluenile: PHOTO('bluenile.jpg', 'Timothy A. Gonsalves, CC BY-SA 4.0'), sodere: PHOTO('sodere.jpg', 'Mjr74, CC BY 4.0'),
    coffee: PHOTO('coffee.jpg', 'ProtoplasmaKid, CC BY-SA 4.0'), injera: PHOTO('injera.jpg', 'Jbinthecity, CC0'),
  };
  const photos = (...keys) => keys.map((k) => PHOTOS[k]);

  // Destinations with extra detail. `match` links one to its pin on Visit Oromia's map;
  // the others are places the map does not have yet, added during the year.
  const FEATURED = [
    { id: 'wanchi', match: 'Lake Wonchi', top: true, labelLeft: true, primary: true, site: 'wanchi',
      // Visit Oromia's own 360° tour (Panotour) on visitoromia.org. The only tour we could confirm.
      tour360: { by: 'Visit Oromia', url: 'https://visitoromia.org/WanchiVR/WanchiVR.html', scenes: ['Eco lodge', 'Information centre', "Farmer's house"] },
      photos: photos('wenchi', 'wenchi2'), facilities: ['Horse rides', 'Boat trips', 'Local guides', 'Hot springs', 'Eco lodge', 'Parking'],
      blurb: 'A crater lake with an island monastery, hot springs and horse trails down from the rim.',
      access: 'Road to the crater rim, then a trail or horse ride down to the lake.' },
    { id: 'bishoftu', name: 'Bishoftu crater lakes', label: 'Bishoftu lakes', type: 'Crater lakes', zone: 'East Shewa', town: 'Bishoftu',
      lat: 8.745, lon: 38.968, month: 1, pop: 1.0, top: true, photos: photos('bishoftu', 'bishoftu2'),
      facilities: ['Resorts', 'Lakeside restaurants', 'Boat trips', 'Parking'],
      blurb: 'Crater lakes, resorts and lakeside food an hour from Addis Ababa.' },
    { id: 'hora', match: 'Irecha festival Site', blurb: 'The lake in Bishoftu where Irreecha is celebrated each year.' },
    { id: 'langano', name: 'Lake Langano', type: 'Lake and resorts', zone: 'East Shewa', town: 'Batu', lat: 7.597, lon: 38.761,
      month: NOW, pop: 0.8, primary: true, demoAdd: true, photos: photos('langano', 'langano2'),
      facilities: ['Swimming', 'Resorts', 'Boat trips', 'Horse riding', 'Birdwatching'],
      blurb: 'A swimmable Rift Valley lake with resorts and birdlife.',
      access: 'Turn-off from the Addis Ababa to Hawassa road. Resorts and boats on the shore.' },
    { id: 'ziway', name: 'Lake Ziway', type: 'Lake', zone: 'East Shewa', town: 'Batu', lat: 7.960, lon: 38.760, month: 4, pop: 0.4,
      photos: photos('ziway'), blurb: 'Lake islands, pelicans and the fish market at Batu.' },
    { id: 'sodere', name: 'Sodere hot springs', type: 'Hot springs', zone: 'East Shewa', town: 'Adama', lat: 8.400, lon: 39.390,
      month: 2, pop: 0.65, photos: photos('sodere'), blurb: 'Hot springs and pools on the Awash River near Adama.' },
    { id: 'melka', match: 'Melka Kunture Prehistoric Site', tour: true },
    { id: 'bale', name: 'Bale Mountains National Park', label: 'Bale Mountains', type: 'National park', zone: 'Bale', town: 'Robe',
      lat: 7.100, lon: 39.790, month: 1, pop: 0.85, primary: true, labelLeft: true, photos: photos('bale'),
      facilities: ['Trekking', 'Wildlife', 'Camping', 'Guides'],
      blurb: 'A UNESCO World Heritage Site. Trekking, Ethiopian wolves and the Sanetti Plateau.' },
    { id: 'sofumar', match: 'Sof Omar Caves', top: true, photos: photos('sofomar', 'sofomar2'),
      facilities: ['Cave guides', 'Parking'], blurb: 'A 15 km cave system carved by the Weyib River.' },
    { id: 'dodola', name: 'Dodola horse trekking', type: 'Horse trekking', zone: 'West Arsi', town: 'Dodola', lat: 6.980, lon: 39.180,
      month: 3, pop: 0.3, blurb: 'Mountain horse treks with local guides and huts.' },
    { id: 'abbajifar', match: 'Aba Jifar Palace', top: true, photos: photos('abbajifar'),
      blurb: 'The palace of the kings of Jimma, on a hill above the city.' },
    { id: 'yayo', match: 'Yayo Forest', blurb: 'A UNESCO biosphere reserve and home of wild Arabica coffee.' },
    { id: 'wollega', match: 'Wollega Museum', blurb: 'Oromo history, crafts and culture in Nekemte.' },
    { id: 'menagesha', match: 'Suba Menagesha Park Natural forest', name: 'Suba Menagesha Park', type: 'Natural forest', primary: true, photos: photos('menagesha'),
      blurb: 'One of the oldest protected forests in Ethiopia, on the edge of Addis Ababa.' },
    { id: 'bluenile', match: 'Blue Nile Gorge', photos: photos('bluenile') },
  ];

  // Businesses that appear on Lake Langano's west shore once it is added in step 2.
  // Offsets are in degrees from the lake's pin; the shore runs at about 38.69 to 38.70 E.
  const ADD_NEARBY = [
    { name: 'Lakeside resort', type: 'Resort', offset: [0.023, -0.073], deal: 'Second night at half price', dealMonth: NOW, pop: 0.55 },
    { name: 'Boat trips', type: 'Boat trips', offset: [0.008, -0.075], pop: 0.35 },
    { name: 'Horse riding', type: 'Horse riding', offset: [-0.022, -0.089], pop: 0.3 },
    { name: 'Lakeside fish restaurant', type: 'Local restaurant', offset: [0.038, -0.071], pop: 0.3 },
    { name: "Women's craft cooperative", type: 'Crafts', offset: [0.053, -0.079], pop: 0.2 },
  ];

  // Sample partner businesses with offers, placed near a named destination. Offers stay on sample
  // listings only, never on the real businesses from Visit Oromia's map.
  const CURATED = [
    { name: 'Lakeview resort', type: 'Resort', near: 'bishoftu', month: 1, deal: 'Weekday rooms with lake view', dealMonth: 2, pop: 1.1,
      site: 'lakeview', photos: photos('bishoftu2', 'injera', 'coffee'), hours: 'Open 24 hours',
      facilities: ['Lake view rooms', 'Restaurant', 'Bar', 'Pool', 'Spa', 'Boat jetty', 'Wi-Fi', 'Parking'] },
    { name: 'Family coffee farm', type: 'Coffee farm visit', near: 'abbajifar', month: 2, deal: '15% off a coffee farm tour', dealMonth: 3, pop: 0.9 },
    { name: 'Cultural restaurant', type: 'Cultural restaurant', near: 'bishoftu', month: 1, deal: 'Free coffee ceremony with lunch', dealMonth: 2, pop: 1 },
    { name: 'Lakeside fish restaurant', type: 'Local restaurant', near: 'hora', month: 3, deal: 'Irreecha week set menu', dealMonth: 9, pop: 0.8 },
    { name: 'Horse trekking guides', type: 'Guides', near: 'dodola', month: 2, deal: 'Group price for horse treks', dealMonth: 4, pop: 0.5 },
    { name: 'Island boat trips', type: 'Boat trips', near: 'ziway', month: 4, deal: 'Boat trip for two', dealMonth: 5, pop: 0.5 },
    { name: 'Hot springs day pass', type: 'Day pass', near: 'sodere', month: 2, deal: 'Day pass with lunch', dealMonth: 3, pop: 0.8 },
    { name: 'Basket and craft shop', type: 'Crafts', near: 'abbajifar', month: 3, deal: '10% off baskets and crafts', dealMonth: 6, pop: 0.4 },
    { name: 'Cave guides', type: 'Guides', near: 'sofumar', month: 4, deal: 'Group rate for cave walks', dealMonth: 6, pop: 0.45 },
    { name: 'Mountain lodge', type: 'Lodge', near: 'bale', month: 2, deal: 'Third night free', dealMonth: 8, pop: 0.6 },
    { name: 'Buna house', type: 'Coffee ceremony house', near: 'bishoftu', month: 1, pop: 0.9 },
  ];

  const BIZ_TYPES = [
    ['Guest house', 8], ['Eco lodge', 4], ['Campsite', 1],
    ['Local restaurant', 12], ['Cultural restaurant', 4], ['Café', 6],
    ['Coffee ceremony house', 7], ['Coffee farm visit', 2],
    ['Craft shop', 4], ['Crafts cooperative', 2],
    ['Licensed guide', 4], ['Tour operator', 3], ['Horse riding', 1], ['Boat trips', 1],
  ];
  const BIZ_PREFIX = ['Town centre', 'Garden', 'Family', 'Market', 'Station road', 'Hillside', 'Main road', 'Old town', 'Riverside', 'Green'];
  const GENERIC_DEALS = ['10% off for Gebeta Maps users', 'Free coffee with any meal', 'Weekday discount', 'Family package', 'Guide included on weekends', 'Group discount'];
  const SVC_TYPES = [['ATM', 30], ['Mobile money agent', 20], ['Pharmacy', 15], ['Health centre', 9], ['Fuel station', 6]];
  const COFFEE = /coffee|café|buna/i, FOOD = /restaurant/i;

  // Month each item went live: exactly `atNow` by month 7, the rest between months 8 and 12.
  function monthsFor(count, atNow) {
    const out = [];
    atNow = Math.max(0, Math.min(count, atNow));
    for (let i = 0; i < atNow; i++) out.push(1 + Math.min(NOW - 1, Math.floor(Math.pow((i + 0.5) / atNow, 0.85) * NOW)));
    const later = count - atNow;
    for (let i = 0; i < later; i++) out.push(NOW + 1 + Math.min(12 - NOW - 1, Math.floor(((i + 0.5) / later) * (12 - NOW))));
    return shuffle(out);
  }

  const places = [];
  let seq = 0;
  const add = (p) => { p.id = p.id || 'p' + (++seq); p.zone = zoneName(p.zone); places.push(p); return p; };
  const byId = (id) => places.find((p) => p.id === id);
  const nearestTown = (lat, lon) => TOWNS.reduce((best, t) => (Math.hypot(t.lat - lat, t.lon - lon) < Math.hypot(best.lat - lat, best.lon - lon) ? t : best)).name;

  // Visit Oromia's attraction sites, enriched where a featured destination matches.
  const featuredByMatch = new Map(FEATURED.filter((f) => f.match).map((f) => [f.match, f]));
  for (const [name, type, lat, lon, zone, woreda, elevation, description, hours, phone, website, video] of VO.sites) {
    const f = featuredByMatch.get(name) || {};
    add(Object.assign({
      kind: 'destination', source: 'vo', official: true, name, type, lat, lon, zone, woreda, elevation, hours, phone, website, video,
      description, town: nearestTown(lat, lon), month: 0, pop: f.id ? 0.7 : between(0.08, 0.3),
    }, f, { featured: !!f.id, blurb: description && description.length > 50 ? description : (f.blurb || description) }));
  }
  // Featured destinations that are not on Visit Oromia's map yet.
  FEATURED.filter((f) => !f.match).forEach((f) => add(Object.assign({ kind: 'destination', source: 'added', official: true, featured: true }, f)));
  const addPlace = byId('langano');

  // Visit Oromia's hotels, resorts and service points.
  for (const [name, kind, type, lat, lon, zone] of VO.services) {
    add({ kind, source: 'vo', name, type, lat, lon, zone: zone || TOWNS.find((t) => t.name === nearestTown(lat, lon)).zone,
      town: nearestTown(lat, lon), month: 0, pop: between(0.05, 0.3) });
  }

  // Sample businesses
  ADD_NEARBY.forEach((b) => add({ kind: 'business', source: 'sample', name: b.name, type: b.type, zone: addPlace.zone, town: addPlace.town,
    near: 'langano', lat: addPlace.lat + b.offset[0], lon: addPlace.lon + b.offset[1], offset: b.offset, month: NOW, demoAdd: true,
    deal: b.deal, dealMonth: b.dealMonth, pop: b.pop }));
  const nearSpots = places.filter((p) => p.featured && !p.demoAdd);
  CURATED.forEach((b) => {
    const f = byId(b.near);
    add(Object.assign({ kind: 'business', source: 'sample', zone: f.zone, town: f.town, lat: f.lat + jitter(0.02), lon: f.lon + jitter(0.02) }, b));
  });
  const vos = (kind) => places.filter((p) => p.kind === kind && p.source === 'vo').length;
  const fixedBiz = places.filter((p) => p.kind === 'business');
  const fixedBizNow = fixedBiz.filter((p) => p.month <= NOW).length;
  const usedNames = new Set();
  monthsFor(TOTAL.business - fixedBiz.length, AT_NOW.business - fixedBizNow).forEach((month) => {
    const [type] = weighted(BIZ_TYPES, (x) => x[1]);
    let lat, lon, zone, town, near = null, pop = between(0.05, 0.3);
    if (rand() < 0.4) {
      const f = weighted(nearSpots, (x) => x.pop || 0.3);
      lat = f.lat + jitter(0.035); lon = f.lon + jitter(0.035); zone = f.zone; town = f.town; near = f.id; pop *= 1.5;
    } else {
      const t = weighted(TOWNS, (x) => x.w);
      lat = t.lat + jitter(0.04); lon = t.lon + jitter(0.04); zone = t.zone; town = t.name;
    }
    let name = '';
    for (let tries = 0; tries < 12; tries++) {
      name = BIZ_PREFIX[Math.floor(rand() * BIZ_PREFIX.length)] + ' ' + type.toLowerCase();
      if (!usedNames.has(name + town)) break;
    }
    usedNames.add(name + town);
    add({ kind: 'business', source: 'sample', name, type, zone, town, near, lat, lon, month, pop });
  });
  places.forEach((p) => {
    if (p.kind === 'business' && p.source === 'sample' && !p.photos) {
      if (COFFEE.test(p.type)) p.photos = photos('coffee');
      else if (FOOD.test(p.type)) p.photos = photos('injera');
    }
  });

  // Offers: the curated ones plus generic offers on sample businesses until the deal counts are met.
  const withDeals = places.filter((p) => p.deal);
  const dealsNow = withDeals.filter((p) => p.dealMonth <= NOW).length;
  const candidates = shuffle(places.filter((p) => p.kind === 'business' && p.source === 'sample' && !p.deal && !p.demoAdd));
  monthsFor(TOTAL.deal - withDeals.length, AT_NOW.deal - dealsNow).forEach((m) => {
    const p = candidates.find((c) => !c.deal && c.month <= m);
    if (!p) return;
    p.deal = GENERIC_DEALS[Math.floor(rand() * GENERIC_DEALS.length)];
    p.dealMonth = m;
  });

  // Sample support services on top of Visit Oromia's own.
  const svcNow = places.filter((p) => p.kind === 'service' && p.month <= NOW).length;
  monthsFor(TOTAL.service - vos('service'), AT_NOW.service - svcNow).forEach((month) => {
    const [type] = weighted(SVC_TYPES, (x) => x[1]);
    const t = weighted(TOWNS, (x) => x.w);
    add({ kind: 'service', source: 'sample', name: type, type, zone: t.zone, town: t.name,
      lat: t.lat + jitter(0.03), lon: t.lon + jitter(0.03), month, pop: between(0.04, 0.16) });
  });

  // Sample visitor activity for months 1 to 7.
  const BASE = { destination: 5000, business: 900, service: 260 };
  places.forEach((p) => {
    const dirShare = p.kind === 'destination' ? between(0.22, 0.32) : p.kind === 'business' ? between(0.17, 0.26) : between(0.28, 0.4);
    const callShare = p.kind === 'business' ? between(0.05, 0.12) : p.kind === 'service' ? between(0.02, 0.06) : 0;
    const s = { views: [0], directions: [0], calls: [0], saves: [0] };
    for (let m = 1; m <= NOW; m++) {
      const age = m - Math.max(1, p.month);
      const ramp = age < 0 ? 0 : age === 0 ? (p.month === 0 ? 1 : 0.45) : age === 1 ? 0.85 : 1;
      const v = Math.round(BASE[p.kind] * p.pop * ramp * (1 + 0.08 * (m - 1)) * between(0.9, 1.1));
      s.views.push(v);
      s.directions.push(Math.round(v * dirShare));
      s.calls.push(Math.round(v * callShare));
      s.saves.push(p.dealMonth && m >= p.dealMonth ? Math.round(v * between(0.08, 0.14)) : 0);
    }
    p.stats = s;
  });

  const ROUTES = [
    { name: 'Jimma coffee trail', by: 'A local guide', stops: 4, zone: 'Jimma', month: 3, base: 120 },
    { name: 'Bishoftu crater lakes loop', by: 'Visit Oromia', stops: 5, zone: 'East Shewa', month: 2, base: 210 },
    { name: 'Rift Valley lakes weekend', by: 'A travel creator', stops: 4, zone: 'East Shewa', month: 3, base: 150 },
    { name: 'Bale highlands in three days', by: 'A licensed guide', stops: 6, zone: 'Bale', month: 4, base: 70 },
    { name: 'Lake Wonchi day trip from Addis Ababa', by: 'Visit Oromia', stops: 3, zone: 'South West Shewa', month: 5, base: 160 },
    { name: 'Sof Omar and the Weyib valley', by: 'A licensed guide', stops: 3, zone: 'Bale', month: 5, base: 40 },
  ];
  ROUTES.forEach((r) => {
    r.starts = [0];
    for (let m = 1; m <= NOW; m++) {
      const age = m - r.month;
      r.starts.push(age < 0 ? 0 : Math.round(r.base * (age === 0 ? 0.5 : 1) * (1 + 0.1 * (m - 1)) * between(0.85, 1.15)));
    }
  });

  const EVENTS = [
    { name: 'Great Irreechaa Run', month: 4 },
    { name: 'Oromia Tourism Week', month: 9 },
    { name: 'Oromia Tourism Awards', month: 11 },
  ];

  const zones = Array.from(new Set(places.map((p) => p.zone))).filter((z) => z !== 'Oromia').sort();

  window.DEMO = {
    NOW, TARGETS, places, routes: ROUTES, events: EVENTS, zones, photos: PHOTOS, sites: window.DEMO_SITES || {},
    towns: TOWNS.concat([{ name: 'Addis Ababa', lat: 8.98, lon: 38.76, w: 0, reference: true }]),
    bounds: [[34.4, 3.4], [43.0, 10.4]],
    addId: addPlace.id,
    addStart: { lat: addPlace.lat, lon: addPlace.lon },
    fromVO: { sites: vos('destination'), businesses: vos('business'), services: vos('service') },
  };
})();
