/* Gebeta and Visit Oromia demo: the map, the add-a-place flow, place details, site maps and the dashboard. */
(function () {
  'use strict';

  const D = window.DEMO;
  const API_KEY = ((window.GEBETA_CONFIG || {}).apiKey || '').trim();
  const BASEMAP = window.GEBETA_BASEMAP || null; // built-in copy of the Gebeta map, used without a key

  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const nf = new Intl.NumberFormat('en-US');
  const cf = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
  const num = (v) => nf.format(Math.round(v));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COLOR = { destination: '#E8850C', business: '#2A78D6', service: '#1FA97A' };
  const TRACK = { destination: '#FBE3C2', business: '#D6E6F8', service: '#D3F0E5', deal: '#FBE3C2', event: '#E3E7ED' };
  const KIND = { destination: 'Destination', business: 'Tourism business', service: 'Support service' };
  const TOUR = 1, MAP = 2, ADD = 3, DASHBOARD = 4; // match data-step and data-screen in index.html
  const STEP_IDS = ['', 'tour', 'map', 'add', 'dashboard']; // link anchor for each step

  const ICON = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    directions: '<path d="M12 3 21 12 12 21 3 12Z"/><path d="M9.5 14v-2.5a1 1 0 0 1 1-1H15"/><path d="m13 8.5 2 2-2 2"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    tour: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.5"/>',
    save: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    official: '<path d="M12 2.5 14.4 4l2.9-.1.9 2.7 2.3 1.7-.8 2.7.8 2.7-2.3 1.7-.9 2.7-2.9-.1L12 21.5 9.6 20l-2.9.1-.9-2.7-2.3-1.7.8-2.7-.8-2.7 2.3-1.7.9-2.7 2.9.1z"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16"/>',
    pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16v.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    mountain: '<path d="m3 20 6-10 4 6 3-4 5 8z"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
    camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l2-3h4l2 3"/>',
    sitemap: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    walk: '<circle cx="13" cy="4" r="2"/><path d="m9 21 2-6 3 3v3M7 12l3-4 4 1 2 4M10 8l-1 6"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    glass: '<path d="M5 4h14l-7 8z"/><path d="M12 12v8M8 20h8"/>',
    food: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 3c-2 2-2 6 0 8v10"/>',
    pool: '<path d="M3 18c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/><path d="M8 15V5a2 2 0 0 1 4 0M14 15V5a2 2 0 0 1 4 0M8 10h6"/>',
    beach: '<path d="M4 12a8 8 0 0 1 16 0z"/><path d="M12 12v8M8 20h8"/>',
    boat: '<path d="M3 15h18l-3 5H6z"/><path d="M12 15V4l6 8h-6"/>',
    bed: '<path d="M3 18V8M21 18v-5a3 3 0 0 0-3-3h-8v8"/><path d="M3 14h18"/><circle cx="6.5" cy="11" r="1.5"/>',
    spa: '<path d="M12 21c-5-3-7-7-7-11 4 0 7 2 7 6 0-4 3-6 7-6 0 4-2 8-7 11z"/>',
    meeting: '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2 20c0-3.5 2.7-6 6-6s6 2.5 6 6M14.5 14.4c.5-.3 1-.4 1.5-.4 3.3 0 6 2.5 6 6"/>',
    swing: '<path d="M4 20 8 4h8l4 16"/><path d="M10 4v9M14 4v9M9 13h6"/>',
    car: '<path d="M5 16v-5l2-5h10l2 5v5z"/><circle cx="8" cy="16" r="1.5"/><circle cx="16" cy="16" r="1.5"/><path d="M5 11h14"/>',
    ticket: '<path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z"/><path d="M14 7v10"/>',
    church: '<path d="M12 2v5M10 4h4"/><path d="M6 21V11l6-4 6 4v10z"/><path d="M10 21v-4h4v4"/>',
    spring: '<path d="M8 9c-1-1.5 1-2.5 0-4M12 9c-1-1.5 1-2.5 0-4M16 9c-1-1.5 1-2.5 0-4"/><path d="M3 14c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M3 19c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/>',
    horse: '<path d="M6 21v-6l-2-3 3-6 3 2 6-2 3 4v4l-2 2v5"/><path d="M10 14h6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  };
  const icon = (name, extra) => `<svg class="ic${extra ? ' ' + extra : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ICON.pin}</svg>`;

  const state = {
    step: 0,
    month: D.NOW,
    layers: { destination: true, business: true, service: true, deal: true },
    added: false,
    selectedId: null,
    previewMode: 'app',
    previewTab: 'overview',
    previewId: null, // the place shown last, so its scroll position is kept on re-render
    site: null,
    sitePoint: null,
    period: '30',
    zone: 'all',
    showTrendTable: false,
    draft: { lat: D.addStart.lat, lon: D.addStart.lon },
  };

  const byId = new Map(D.places.map((p) => [p.id, p]));
  const addPlace = byId.get(D.addId);
  const addOriginal = Object.assign({}, addPlace);
  const timers = [];

  /* ---------- Helpers ---------- */

  function visible(p, month) {
    if (p.month > (month == null ? state.month : month)) return false;
    if (p.demoAdd && !state.added) return false;
    return true;
  }
  function hasDeal(p, month) {
    return !!(p.deal && p.dealMonth && p.dealMonth <= (month == null ? state.month : month));
  }
  function whereOf(p) {
    if (p.near && byId.get(p.near)) return byId.get(p.near).name;
    return p.town || p.zone;
  }
  function distanceKm(a, b) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function countAt(kind, month) {
    if (kind === 'deal') return D.places.filter((p) => p.kind === 'business' && visible(p, month) && hasDeal(p, month)).length;
    if (kind === 'event') return D.events.filter((e) => e.month <= month).length;
    return D.places.filter((p) => p.kind === kind && visible(p, month)).length;
  }

  const tip = $('#tooltip');
  function showTip(x, y, value, label) {
    tip.textContent = '';
    const b = document.createElement('b'); b.textContent = value;
    const s = document.createElement('span'); s.textContent = label;
    tip.append(b, s);
    tip.classList.add('show');
    const r = tip.getBoundingClientRect();
    let left = x + 14, top = y + 14;
    if (left + r.width > window.innerWidth - 8) left = x - r.width - 14;
    if (top + r.height > window.innerHeight - 8) top = y - r.height - 14;
    tip.style.left = Math.max(8, left) + 'px';
    tip.style.top = Math.max(8, top) + 'px';
  }
  function hideTip() { tip.classList.remove('show'); }

  let toastTimer = 0;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  }

  /* ---------- Steps ---------- */

  function go(step) {
    step = Math.max(TOUR, Math.min(DASHBOARD, Number(step) || TOUR));
    const prev = state.step;
    if (step === prev) return;
    state.step = step;
    stopPlay();
    hideTip();
    closeSite();
    $$('.step').forEach((b) => {
      if (Number(b.dataset.step) === step) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
    $$('.screen').forEach((s) => s.classList.toggle('is-active', s.dataset.screen.split(' ').includes(String(step))));
    $('#prev').disabled = step === TOUR;
    $('#next').disabled = step === DASHBOARD;
    if (step === ADD || step === MAP) enterMapStage(step, prev);
    if (step === DASHBOARD) renderDashboard();
    if (step === DASHBOARD || step === TOUR) window.scrollTo(0, 0);
    const hash = '#' + STEP_IDS[step];
    if (location.hash !== hash) history.replaceState(null, '', hash);
  }
  function stepFromHash() {
    const i = STEP_IDS.indexOf(location.hash.replace('#', ''));
    return i > 0 ? i : TOUR;
  }

  /* ---------- Map ---------- */

  const FALLBACK_STYLE = { version: 8, sources: {}, layers: [{ id: 'ground', type: 'background', paint: { 'background-color': '#F4F3F2' } }] };

  // The built-in basemap, drawn with the colours of Gebeta's standard style.
  function basemapStyle(b) {
    const byZoom = (a, c) => ['interpolate', ['linear'], ['zoom'], 5, a, 12, c];
    const geo = (data) => ({ type: 'geojson', data });
    const road = (cls, casing, color, w5, w12) => [
      { id: `road-${cls}-casing`, type: 'line', source: 'roads', filter: ['==', ['get', 'c'], cls], layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': casing, 'line-width': byZoom(w5 + 1, w12 + 2) } },
      { id: `road-${cls}`, type: 'line', source: 'roads', filter: ['==', ['get', 'c'], cls], layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': color, 'line-width': byZoom(w5, w12) } },
    ];
    const boundary = (cls, color, width, dash, opacity) => ({ id: `boundary-${cls}`, type: 'line', source: 'boundaries', filter: ['==', ['get', 'c'], cls],
      paint: Object.assign({ 'line-color': color, 'line-width': width, 'line-opacity': opacity }, dash ? { 'line-dasharray': dash } : {}) });
    return {
      version: 8,
      sources: { boundaries: geo(b.boundaries), water: geo(b.water), rivers: geo(b.rivers), green: geo(b.green), roads: geo(b.roads) },
      layers: [
        { id: 'ground', type: 'background', paint: { 'background-color': '#F4F3F2' } },
        { id: 'green', type: 'fill', source: 'green', paint: { 'fill-color': '#D3F7E2' } },
        { id: 'water', type: 'fill', source: 'water', paint: { 'fill-color': ['interpolate', ['linear'], ['zoom'], 8, '#A0C8F0', 9, '#BFD9F2'] } },
        { id: 'rivers', type: 'line', source: 'rivers', paint: { 'line-color': '#A0C8F0', 'line-width': byZoom(0.6, 1.6) } },
        ...road('secondary', '#D0D5DA', '#E8EDF2', 0.6, 2),
        ...road('primary', '#C0C8D0', '#D8E4F0', 0.8, 2.6),
        ...road('trunk', '#B0C0D0', '#D0E0F0', 1, 3),
        ...road('motorway', '#90A0B0', '#C0D0E0', 1.4, 3.4),
        boundary('subregion', '#A0A0A0', 0.8, [2, 3], 0.6),
        boundary('state', '#7A7A7A', byZoom(0.8, 1.6), [4, 3], 0.6),
        boundary('country', '#4A4A4A', byZoom(1.6, 3), null, 0.75),
      ],
    };
  }
  const OFFLINE_STYLE = BASEMAP ? basemapStyle(BASEMAP) : FALLBACK_STYLE;

  let map = null;
  let styleReady = false;
  let fellBack = false;
  const pending = [];
  const markers = new Map();
  let townMarkers = [];
  let draftMarker = null;
  let popup = null;
  let hoverFrame = 0;

  function notice(msg) {
    const n = $('#map-notice');
    n.textContent = msg;
    n.hidden = !msg;
  }

  function ensureMap(cb) {
    if (map) {
      if (styleReady) cb(); else pending.push(cb);
      return;
    }
    pending.push(cb);
    map = new maplibregl.Map({
      container: 'map',
      style: API_KEY ? 'https://tiles.gebeta.app/styles/standard/style.json' : OFFLINE_STYLE,
      bounds: D.bounds,
      fitBoundsOptions: { padding: 32 },
      maxBounds: [[28, -2], [50, 16]],
      attributionControl: { compact: true, customAttribution: 'Map data © Gebeta' },
      dragRotate: false,
      pitchWithRotate: false,
      transformRequest: (url) => (API_KEY && url.startsWith('https://tiles.gebeta.app'))
        ? { url, headers: { Authorization: 'Bearer ' + API_KEY } }
        : { url },
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    if (!API_KEY) {
      if (!BASEMAP) notice('Add a Gebeta demo key in config.js to show the Gebeta base map.');
      addTownLabels();
    }
    map.on('style.load', () => {
      addOverlays();
      styleReady = true;
      while (pending.length) pending.shift()();
    });
    map.on('error', (e) => {
      const status = e && e.error && e.error.status;
      if (!styleReady && API_KEY && !fellBack) {
        fellBack = true;
        notice(BASEMAP
          ? 'The live Gebeta map could not load with this key, so a built-in copy is shown. Check config.js.'
          : 'The Gebeta map could not load with this key, so the base map is hidden. Check config.js.');
        addTownLabels();
        map.setStyle(OFFLINE_STYLE);
      } else if ((status === 401 || status === 403) && !fellBack) {
        fellBack = true;
        notice('The Gebeta map key was refused for some tiles. Check config.js.');
      }
    });
    map.on('zoom', updateZoomClass);
    map.on('click', onMapClick);
    map.on('mousemove', onMapHover);
    map.on('mouseout', () => { hideTip(); map.getCanvas().style.cursor = ''; });
    new ResizeObserver(() => map.resize()).observe($('#map-wrap'));
    updateZoomClass();
  }

  // Without live tiles there are no place names on the map, so towns and lakes get their own labels.
  function addTownLabels() {
    if (townMarkers.length) return;
    const label = (className, text, lngLat, anchor, offset) => {
      const el = document.createElement('div');
      el.className = className;
      el.textContent = text;
      return new maplibregl.Marker({ element: el, anchor, offset }).setLngLat(lngLat).addTo(map);
    };
    townMarkers = D.towns.map((t) => label('town' + (t.reference ? ' ref' : t.w < 4 ? ' minor' : ''), t.name, [t.lon, t.lat], 'top', [0, 6]));
    if (BASEMAP) BASEMAP.lakes.forEach(([name, lon, lat]) => townMarkers.push(label('lake-label', name, [lon, lat], 'center', [0, 0])));
  }

  function addOverlays() {
    if (map.getSource('places')) return;
    map.addSource('places', { type: 'geojson', data: placesGeoJSON() });
    const r = (a, b, c) => ['interpolate', ['linear'], ['zoom'], 5, a, 8, b, 12, c];
    map.addLayer({ id: 'svc', type: 'circle', source: 'places', filter: ['==', ['get', 'kind'], 'service'],
      paint: { 'circle-color': COLOR.service, 'circle-radius': r(2.6, 4, 6.5), 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.2 } });
    map.addLayer({ id: 'deal-ring', type: 'circle', source: 'places', filter: ['all', ['==', ['get', 'kind'], 'business'], ['get', 'deal']],
      paint: { 'circle-color': 'rgba(0,0,0,0)', 'circle-radius': r(5.6, 7.6, 10.5), 'circle-stroke-color': COLOR.destination, 'circle-stroke-width': 1.8 } });
    map.addLayer({ id: 'biz', type: 'circle', source: 'places', filter: ['==', ['get', 'kind'], 'business'],
      paint: { 'circle-color': COLOR.business, 'circle-radius': r(3, 4.5, 7), 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.2 } });
    map.addLayer({ id: 'dest', type: 'circle', source: 'places', filter: ['==', ['get', 'kind'], 'destination'],
      paint: { 'circle-color': COLOR.destination, 'circle-radius': r(3.6, 5.5, 8.5), 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5 } });
    map.addLayer({ id: 'sel', type: 'circle', source: 'places', filter: ['==', ['get', 'id'], state.selectedId || ''],
      paint: { 'circle-color': 'rgba(0,0,0,0)', 'circle-radius': r(9, 12, 16), 'circle-stroke-color': '#0E1A2B', 'circle-stroke-width': 2.5 } });
  }

  function placesGeoJSON() {
    const features = [];
    for (const p of D.places) {
      if (p.featured || !visible(p) || !state.layers[p.kind]) continue;
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
        properties: { id: p.id, kind: p.kind, deal: state.layers.deal && hasDeal(p) },
      });
    }
    return { type: 'FeatureCollection', features };
  }

  function pinSVG(color) {
    return `<svg viewBox="0 0 26 34" aria-hidden="true"><path d="M13 1.5C6.6 1.5 1.5 6.6 1.5 12.9 1.5 21.6 13 32.5 13 32.5s11.5-10.9 11.5-19.6C24.5 6.6 19.4 1.5 13 1.5z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="13" cy="13" r="4.4" fill="#fff"/></svg>`;
  }

  function updateMarkers() {
    for (const p of D.places) {
      if (!p.featured) continue;
      const show = visible(p) && state.layers[p.kind];
      let m = markers.get(p.id);
      if (show && !m) {
        const el = document.createElement('div');
        el.className = 'pin-wrap';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pin' + (p.primary ? ' primary' : '') + (p.top ? ' top' : '') + (p.labelLeft ? ' label-left' : '');
        btn.innerHTML = `<span class="pin-body">${pinSVG(COLOR[p.kind])}</span><span class="pin-label"></span>`;
        btn.querySelector('.pin-label').textContent = p.label || p.name;
        btn.setAttribute('aria-label', p.name + ', ' + KIND[p.kind].toLowerCase());
        btn.addEventListener('click', (e) => { e.stopPropagation(); select(p.id); });
        el.appendChild(btn);
        m = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([p.lon, p.lat]).addTo(map);
        markers.set(p.id, m);
      } else if (!show && m) {
        m.remove();
        markers.delete(p.id);
        m = null;
      }
      if (m) m.getElement().querySelector('.pin').classList.toggle('is-selected', state.selectedId === p.id);
    }
  }

  function refreshMap() {
    if (!map || !styleReady) return;
    map.getSource('places').setData(placesGeoJSON());
    map.setFilter('sel', ['==', ['get', 'id'], state.selectedId || '']);
    updateMarkers();
    updateCounts();
    updatePopup();
  }

  function updateZoomClass() {
    if (!map) return;
    $('#map-wrap').classList.toggle('z-low', map.getZoom() < 7.3);
    $('#map-wrap').classList.toggle('z-min', map.getZoom() < 6.5);
  }

  function featureAt(point) {
    if (!styleReady) return null;
    const box = [[point.x - 9, point.y - 9], [point.x + 9, point.y + 9]];
    const found = map.queryRenderedFeatures(box, { layers: ['dest', 'biz', 'svc'] });
    if (!found.length) return null;
    found.sort((a, b) => {
      const pa = map.project(a.geometry.coordinates), pb = map.project(b.geometry.coordinates);
      return Math.hypot(pa.x - point.x, pa.y - point.y) - Math.hypot(pb.x - point.x, pb.y - point.y);
    });
    return byId.get(found[0].properties.id) || null;
  }

  function onMapClick(e) {
    if (state.step === ADD && !state.added) {
      placeDraft(e.lngLat.lat, e.lngLat.lng);
      renderPreview();
      return;
    }
    const p = featureAt(e.point);
    if (p) select(p.id);
  }

  function onMapHover(e) {
    cancelAnimationFrame(hoverFrame);
    hoverFrame = requestAnimationFrame(() => {
      if (state.site) { hideTip(); return; }
      const p = featureAt(e.point);
      map.getCanvas().style.cursor = p ? 'pointer' : (state.step === ADD && !state.added ? 'crosshair' : '');
      if (p) {
        const label = p.kind === 'business' ? `${p.type} · ${whereOf(p)}` : `${p.type || KIND[p.kind]} · ${p.zone}`;
        showTip(e.originalEvent.clientX, e.originalEvent.clientY, p.name, label);
      } else hideTip();
    });
  }

  function select(id) {
    if (state.selectedId !== id) state.previewTab = 'overview';
    state.selectedId = id;
    if (map && styleReady) map.setFilter('sel', ['==', ['get', 'id'], id || '']);
    updateMarkers();
    updatePopup();
    renderPreview();
  }

  // A small card on the map for the selected place, like a map app's preview.
  function updatePopup() {
    const p = byId.get(state.selectedId);
    const show = p && map && visible(p) && state.layers[p.kind] && !(state.step === ADD && !state.added);
    if (!show) { if (popup) { popup.remove(); popup = null; } return; }
    const el = document.createElement('div');
    el.className = 'pop';
    const photo = p.photos && p.photos[0];
    el.innerHTML = `
      <div class="pop-media">${photo ? `<img src="${esc(photo.src)}" alt="">` : `<span class="pop-icon" style="background:${COLOR[p.kind]}">${icon(p.kind === 'destination' ? 'mountain' : p.kind === 'business' ? 'bed' : 'pin')}</span>`}</div>
      <div class="pop-body">
        <b>${esc(p.name)}</b>
        <span>${esc(p.type || KIND[p.kind])} · ${esc(p.kind === 'business' ? whereOf(p) : p.zone)}</span>
        ${p.site ? `<button type="button" class="pop-btn" data-site="${esc(p.site)}">${icon('sitemap')}Site map</button>` : ''}
      </div>`;
    const lngLat = [p.lon, p.lat];
    const offset = p.featured ? [0, -36] : [0, -10];
    if (!popup) popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset, maxWidth: '280px', className: 'gebeta-pop' });
    popup.setOffset(offset).setLngLat(lngLat).setDOMContent(el);
    if (!popup.isOpen()) popup.addTo(map);
  }

  function enterMapStage(step, prev) {
    const isAdd = step === ADD;
    $('#panel-add').hidden = !isAdd;
    $('#panel-year').hidden = isAdd;
    $('#map-hint').hidden = !(isAdd && !state.added);
    ensureMap(() => {
      map.resize();
      if (isAdd) {
        state.month = D.NOW;
        syncMonthUI();
        refreshMap();
        if (!state.added) {
          placeDraft(state.draft.lat, state.draft.lon);
          select(null);
        } else {
          select(addPlace.id);
        }
        const target = state.added ? [addPlace.lon, addPlace.lat] : [state.draft.lon, state.draft.lat];
        map.flyTo({ center: target, zoom: 10.2, duration: reduceMotion ? 0 : 1400, essential: true });
      } else {
        if (draftMarker) { draftMarker.remove(); draftMarker = null; }
        refreshMap();
        if (prev === ADD) map.fitBounds(D.bounds, { padding: 36, duration: reduceMotion ? 0 : 1200 });
        const sel = byId.get(state.selectedId);
        if (!sel || !visible(sel)) select('wanchi');
        else renderPreview();
      }
    });
  }

  /* ---------- Add a place ---------- */

  function formValues() {
    return {
      name: $('#f-name').value.trim(),
      kind: $('#f-kind').value,
      type: $('#f-type').value.trim() || KIND[$('#f-kind').value],
      zone: $('#f-zone').value,
      access: $('#f-access').value.trim(),
      tour: $('.tog[data-c="tour"]').getAttribute('aria-pressed') === 'true',
      photos: $('.tog[data-c="photos"]').getAttribute('aria-pressed') === 'true',
      story: $('.tog[data-c="story"]').getAttribute('aria-pressed') === 'true',
      official: $('#f-official').getAttribute('aria-checked') === 'true',
    };
  }

  function fillForm() {
    $('#f-name').value = addOriginal.name;
    $('#f-kind').value = 'destination';
    $('#f-type').value = addOriginal.type;
    $('#f-zone').value = addOriginal.zone;
    $('#f-access').value = addOriginal.access;
    $('.tog[data-c="photos"]').setAttribute('aria-pressed', 'true');
    $('.tog[data-c="tour"]').setAttribute('aria-pressed', 'false');
    $('.tog[data-c="story"]').setAttribute('aria-pressed', 'false');
    $('#f-official').setAttribute('aria-checked', 'true');
    $('#official-row').hidden = false;
  }

  function updatePinBox() {
    $('#f-coords').textContent = `${state.draft.lat.toFixed(4)}° N, ${state.draft.lon.toFixed(4)}° E`;
  }

  function placeDraft(lat, lon) {
    state.draft.lat = lat;
    state.draft.lon = lon;
    if (!draftMarker) {
      const el = document.createElement('div');
      el.className = 'pin-wrap';
      el.innerHTML = `<div class="pin draft"><span class="pin-body">${pinSVG('#0E1A2B')}</span><span class="pin-label"></span></div>`;
      draftMarker = new maplibregl.Marker({ element: el, anchor: 'bottom', draggable: true }).setLngLat([lon, lat]).addTo(map);
      draftMarker.on('drag', () => {
        const ll = draftMarker.getLngLat();
        state.draft.lat = ll.lat;
        state.draft.lon = ll.lng;
        updatePinBox();
      });
      draftMarker.on('dragend', renderPreview);
    } else {
      draftMarker.setLngLat([lon, lat]);
    }
    draftMarker.getElement().querySelector('.pin-label').textContent = $('#f-name').value.trim() || 'New place';
    updatePinBox();
  }

  function setTimeline(done) {
    $$('#timeline li').forEach((li, i) => {
      li.classList.toggle('done', i < done);
      li.classList.toggle('active', i === done && done < 3);
    });
  }

  function setDestCount(value, bump) {
    const el = $('#dest-count');
    el.textContent = value;
    if (bump) {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
  }

  function submitPlace(e) {
    e.preventDefault();
    const v = formValues();
    const nameInput = $('#f-name');
    if (!v.name) {
      nameInput.setAttribute('aria-invalid', 'true');
      $('#f-name-error').hidden = false;
      nameInput.focus();
      return;
    }
    nameInput.removeAttribute('aria-invalid');
    $('#f-name-error').hidden = true;
    $('#add-form').hidden = true;
    $('#add-status').hidden = false;
    $('#map-hint').hidden = true;
    $('#add-done').hidden = true;
    $('#dest-delta').hidden = true;
    setDestCount(countAt('destination', D.NOW), false);
    setTimeline(1);
    const wait = reduceMotion ? 350 : 1100;
    timers.push(setTimeout(() => setTimeline(2), wait));
    timers.push(setTimeout(() => { setTimeline(3); goLive(v); }, wait * 2));
  }

  function goLive(v) {
    Object.assign(addPlace, {
      name: v.name, label: v.name, kind: v.kind, type: v.type, zone: v.zone, access: v.access,
      tour: v.tour, official: v.kind === 'destination' && v.official,
      photos: v.photos ? addOriginal.photos : null,
      lat: state.draft.lat, lon: state.draft.lon,
      blurb: v.name === addOriginal.name ? addOriginal.blurb : '',
    });
    D.places.forEach((p) => {
      if (p.demoAdd && p.offset) {
        p.lat = addPlace.lat + p.offset[0];
        p.lon = addPlace.lon + p.offset[1];
        p.zone = addPlace.zone;
      }
    });
    if (markers.has(addPlace.id)) { markers.get(addPlace.id).remove(); markers.delete(addPlace.id); }
    if (draftMarker) { draftMarker.remove(); draftMarker = null; }
    state.added = true;
    state.selectedId = addPlace.id;
    state.previewTab = 'overview';
    refreshMap();
    const pin = markers.get(addPlace.id);
    if (pin) pin.getElement().querySelector('.pin').classList.add('drop');
    renderPreview();
    setDestCount(countAt('destination', D.NOW), true);
    $('#dest-delta').hidden = addPlace.kind !== 'destination';
    $('#linked-text').textContent = `${v.name} is live. Five nearby businesses are linked to it: a lakeside resort with an offer, boat trips, horse riding, a fish restaurant and a craft cooperative.`;
    $('#add-done').hidden = false;
  }

  // `quiet` resets without moving the map or the focus, for the guided demo.
  function resetAdd(quiet) {
    timers.splice(0).forEach(clearTimeout);
    Object.assign(addPlace, addOriginal);
    D.places.forEach((p) => {
      if (p.demoAdd && p.offset) {
        p.lat = addPlace.lat + p.offset[0];
        p.lon = addPlace.lon + p.offset[1];
        p.zone = addPlace.zone;
      }
    });
    if (markers.has(addPlace.id)) { markers.get(addPlace.id).remove(); markers.delete(addPlace.id); }
    state.added = false;
    state.draft = { lat: D.addStart.lat, lon: D.addStart.lon };
    fillForm();
    setTimeline(0);
    $('#add-status').hidden = true;
    $('#add-form').hidden = false;
    $('#map-hint').hidden = false;
    refreshMap();
    if (state.step === ADD) placeDraft(state.draft.lat, state.draft.lon);
    select(null);
    if (quiet) return;
    map.flyTo({ center: [state.draft.lon, state.draft.lat], zoom: 10.2, duration: reduceMotion ? 0 : 900 });
    $('#f-name').focus();
  }

  /* ---------- The year on the map ---------- */

  const LAYER_ROWS = [
    { key: 'destination', label: 'Destinations', swatch: '<span class="dot" style="background:#E8850C"></span>' },
    { key: 'business', label: 'Tourism businesses', swatch: '<span class="dot" style="background:#2A78D6"></span>' },
    { key: 'deal', label: 'Deals and offers', swatch: '<span class="dot dot-deal"></span>' },
    { key: 'service', label: 'Support services', swatch: '<span class="dot" style="background:#1FA97A"></span>' },
  ];

  function buildLayers() {
    $('#layers').innerHTML = LAYER_ROWS.map((row) => `
      <li><label class="layer" data-key="${row.key}">
        <input type="checkbox" checked data-layer="${row.key}">
        <span class="box">${icon('check')}</span>
        <span class="layer-name">${row.swatch}${esc(row.label)}</span>
        <span class="layer-count"></span>
        <span class="layer-meter" style="background:${TRACK[row.key]}"><i style="background:${row.key === 'deal' ? '#B5620A' : COLOR[row.key]}"></i></span>
      </label></li>`).join('');
    $$('#layers input').forEach((input) => input.addEventListener('change', () => {
      state.layers[input.dataset.layer] = input.checked;
      input.closest('.layer').classList.toggle('off', !input.checked);
      refreshMap();
    }));
    $('#vo-note').textContent = `Month 0 is Visit Oromia's own map, now on Gebeta: ${D.fromVO.sites} attraction sites, ${D.fromVO.businesses} hotels and resorts, and ${D.fromVO.services} service points.`;
  }

  function updateCounts() {
    LAYER_ROWS.forEach((row) => {
      const c = countAt(row.key, state.month);
      const target = D.TARGETS[row.key];
      const el = $(`.layer[data-key="${row.key}"]`);
      if (!el) return;
      el.querySelector('.layer-count').innerHTML = `<b>${num(c)}</b> / ${num(target)}`;
      el.querySelector('.layer-meter i').style.width = Math.min(100, (c / target) * 100) + '%';
    });
    $('#events').innerHTML = D.events.map((ev) => {
      const live = ev.month <= state.month;
      return `<li class="event"><span>${esc(ev.name)}</span><span class="state ${live ? 'live' : 'planned'}">${live ? 'Map live' : 'Planned'}</span></li>`;
    }).join('');
  }

  function monthNote(m) {
    if (m === 0) return "Visit Oromia's map, moved onto Gebeta";
    if (m === D.NOW) return 'Today in this demo';
    if (m === 12) return 'Delivery checked, next targets set';
    if (m % 3 === 0) return 'Quarterly review and visitor report';
    if (m < 3) return 'Targets set, dashboard live, staff trained';
    return '';
  }

  function syncMonthUI() {
    const m = state.month;
    const range = $('#month');
    range.value = m;
    range.style.setProperty('--p', (m / 12) * 100 + '%');
    const label = m === 0 ? 'Start of Year 1' : `Month ${m} of 12`;
    range.setAttribute('aria-valuetext', label);
    $('#m-label').textContent = label;
    $('#m-sub').textContent = monthNote(m);
  }

  let playTimer = 0;
  function setPlayButton(playing) {
    const b = $('#play');
    b.setAttribute('aria-pressed', String(playing));
    b.innerHTML = playing ? `${icon('pause')}Pause` : `${icon('play')}Play Year 1`;
  }
  function stopPlay() {
    if (!playTimer) return;
    clearInterval(playTimer);
    playTimer = 0;
    setPlayButton(false);
  }
  function togglePlay() {
    if (playTimer) { stopPlay(); return; }
    if (state.month >= 12) state.month = 0;
    setPlayButton(true);
    const tick = () => {
      syncMonthUI();
      refreshMap();
      if (state.month >= 12) { stopPlay(); return; }
      state.month += 1;
    };
    tick();
    playTimer = setInterval(tick, reduceMotion ? 900 : 650);
  }

  /* ---------- Place details: what visitors see ---------- */

  function heroArt(p) {
    const c = COLOR[p.kind] || COLOR.destination;
    return `<svg viewBox="0 0 288 128" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="288" height="128" fill="#EEF1F5"/>
      <g fill="#E4E9F0"><rect x="14" y="12" width="64" height="36" rx="6"/><rect x="200" y="78" width="74" height="40" rx="6"/><rect x="92" y="86" width="52" height="32" rx="6"/><rect x="214" y="10" width="58" height="44" rx="6"/></g>
      ${p.kind === 'destination' ? '<ellipse cx="190" cy="56" rx="46" ry="24" fill="#CFE0F2"/>' : ''}
      <g stroke="#fff" stroke-linecap="round" fill="none"><path d="M-10 70 C60 60 110 90 170 72 S260 40 300 52" stroke-width="9"/><path d="M118 140 C124 100 150 60 140 -10" stroke-width="7"/></g>
      <path d="M30 116 C70 98 110 104 134 82 S170 60 186 50" stroke="#E8850C" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 7" fill="none"/>
      <g transform="translate(174 14)">${pinSVG(c).replace('<svg', '<svg width="26" height="34"')}</g>
    </svg>`;
  }

  function nearbyOf(p, limit) {
    return D.places
      .filter((q) => q.id !== p.id && visible(q) && !(q.kind === 'destination' && p.kind === 'destination'))
      .map((q) => ({ q, d: distanceKm(p, q) }))
      .filter((x) => x.d < 25)
      .sort((a, b) => a.d - b.d)
      .slice(0, limit);
  }

  function nearList(p, limit) {
    const items = nearbyOf(p, limit);
    if (!items.length) return '<div class="near-empty">Nearby places appear here as partners join.</div>';
    return `<ul class="near">${items.map(({ q, d }) => `
      <li><span class="dot${hasDeal(q) ? ' dot-deal' : ''}" style="background:${COLOR[q.kind]}"></span>
        <div><b>${esc(q.name)}</b><span>${d < 1 ? (d * 1000).toFixed(0) + ' m' : d.toFixed(1) + ' km'} · ${esc(q.type)}</span></div>
        ${hasDeal(q) ? '<span class="badge badge-deal">Deal</span>' : ''}</li>`).join('')}</ul>`;
  }

  function badgesOf(p, draft) {
    const out = [];
    if (p.kind === 'destination' && p.official) out.push(`<span class="badge badge-official">${icon('official')}Official · Visit Oromia</span>`);
    else if (p.source === 'vo') out.push(`<span class="badge badge-grey">${icon('check')}On Visit Oromia's map</span>`);
    else if (p.source === 'sample') out.push('<span class="badge badge-grey">Sample listing</span>');
    if (hasDeal(p)) out.push(`<span class="badge badge-deal">${icon('tag')}Partner offer</span>`);
    if (!draft && p.month === D.NOW) out.push('<span class="badge badge-new">New</span>');
    return out.join('');
  }

  // Detail rows as in a map app's place page. Missing details show as gaps Visit Oromia can fill.
  function detailRows(p) {
    const rows = [];
    const row = (ic, value, missing) => rows.push({ ic, value, missing });
    row('pin', [p.woreda, p.zone, 'Oromia'].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', '));
    row('clock', p.hours, 'Opening hours');
    row('phone', p.phone, 'Phone number');
    row('globe', p.website, 'Website');
    if (p.elevation) row('mountain', `${num(Number(p.elevation) || 0)} m above sea level`);
    if (p.access) row('route', p.access);
    return rows;
  }
  function detailsHTML(p) {
    const rows = detailRows(p);
    const missing = rows.filter((r) => !r.value).length;
    return `<ul class="pp-details">${rows.map((r) => `<li class="${r.value ? '' : 'missing'}">${icon(r.ic)}<span>${esc(r.value || r.missing + ' · not added yet')}</span></li>`).join('')}
      ${p.video ? `<li>${icon('video')}<a href="${esc(p.video)}" target="_blank" rel="noopener">Watch the video</a></li>` : ''}</ul>
      ${missing ? `<p class="pp-gap">${missing} detail${missing > 1 ? 's' : ''} missing. Visit Oromia or the owner can add ${missing > 1 ? 'them' : 'it'} from the field app.</p>` : ''}`;
  }

  function photoGrid(p) {
    if (!p.photos || !p.photos.length) {
      return `<div class="pp-empty">${icon('camera')}<p>No photos yet. Visit Oromia teams and partners add them from the field app.</p></div>`;
    }
    return `<div class="pp-photos">${p.photos.map((ph) => `<figure><img src="${esc(ph.src)}" alt="Photo of ${esc(p.name)}" loading="lazy"><figcaption>Photo: ${esc(ph.credit)}</figcaption></figure>`).join('')}</div>
      ${p.source === 'sample' ? '<p class="pp-gap">Sample photos for a sample listing.</p>' : ''}`;
  }

  function siteTab(p) {
    const site = D.sites[p.site];
    return `<button type="button" class="pp-site-preview" data-site="${esc(p.site)}" aria-label="Open the site map of ${esc(p.name)}">
        ${siteThumbSVG(site)}<span class="chip">${icon('sitemap')}Open the 3D site map</span></button>
      <p class="pp-text">Find your way around: ${esc(site.points.slice(1, 5).map((pt) => pt.name.toLowerCase()).join(', '))} and more.</p>`;
  }

  // Visit Oromia's own 360° tours live on visitoromia.org; the page links out to them.
  function tour360HTML(p) {
    const ph = p.photos && (p.photos[1] || p.photos[0]);
    return `<a class="pp-360" href="${esc(p.tour360.url)}" target="_blank" rel="noopener">
      <span class="pp-360-media">${ph ? `<img src="${esc(ph.src)}" alt="">` : heroArt(p)}<span class="pp-360-badge">${icon('tour')}360°</span></span>
      <span class="pp-360-body"><b>360° tour by ${esc(p.tour360.by)}</b><span>${esc(p.tour360.scenes.join(' · '))}</span><em>Opens on visitoromia.org</em></span>
    </a>`;
  }

  function previewPlace() {
    if (state.step === ADD && !state.added) {
      const v = formValues();
      return {
        draft: true,
        p: Object.assign({}, addOriginal, {
          name: v.name || 'New place', kind: v.kind, type: v.type, zone: v.zone, access: v.access, tour: v.tour,
          official: v.kind === 'destination' && v.official, lat: state.draft.lat, lon: state.draft.lon,
          photos: v.photos ? addOriginal.photos : null,
          blurb: v.name === addOriginal.name ? addOriginal.blurb : '',
        }),
      };
    }
    const chosen = byId.get(state.selectedId);
    if (chosen && visible(chosen)) return { draft: false, p: chosen };
    const fallback = [byId.get('wanchi'), byId.get('bishoftu')].find((x) => x && visible(x) && state.layers[x.kind]);
    return { draft: false, p: fallback || null };
  }

  function heroHTML(p) {
    const ph = p.photos && p.photos[0];
    return `<div class="pp-hero${ph ? ' has-photo' : ''}">
      ${ph ? `<img src="${esc(ph.src)}" alt="Photo of ${esc(p.name)}">` : heroArt(p)}
      ${ph ? `<button type="button" class="chip pp-count" data-tab="photos">${icon('camera')}${p.photos.length} photo${p.photos.length > 1 ? 's' : ''}</button>` : ''}
      ${p.tour360 ? `<a class="chip pp-tour" href="${esc(p.tour360.url)}" target="_blank" rel="noopener">${icon('tour')}360° tour</a>`
        : p.tour ? `<span class="chip pp-tour">${icon('tour')}360° tour</span>` : ''}
    </div>`;
  }

  function tabsHTML(p, draft) {
    if (draft) return '';
    const tabs = [['overview', 'Overview'], ['photos', `Photos${p.photos ? ` (${p.photos.length})` : ''}`]];
    if (p.site) tabs.push(['site', 'Site map']);
    return `<div class="pp-tabs" role="tablist">${tabs.map(([id, label]) =>
      `<button type="button" role="tab" data-tab="${id}" aria-selected="${state.previewTab === id}">${esc(label)}</button>`).join('')}</div>`;
  }

  function tabBody(p, draft) {
    const tab = draft ? 'overview' : state.previewTab === 'site' && !p.site ? 'overview' : state.previewTab;
    if (tab === 'photos') return photoGrid(p);
    if (tab === 'site') return siteTab(p);
    return `
      ${p.blurb ? `<p class="pp-text">${esc(p.blurb)}</p>` : ''}
      ${detailsHTML(p)}
      ${p.facilities ? `<div class="pp-chips">${p.facilities.map((f) => `<span>${esc(f)}</span>`).join('')}</div>` : ''}
      ${p.tour360 ? tour360HTML(p) : ''}
      ${hasDeal(p) ? `<div class="pp-deal">${icon('tag')}<div><b>${esc(p.deal)}</b><span>Partner offer. Save it for your trip.</span></div></div>` : ''}
      ${p.site ? `<button type="button" class="pp-site-link" data-site="${esc(p.site)}">${icon('sitemap')}<span><b>Site map</b>Find the ${esc(D.sites[p.site].points[1].name.toLowerCase())}, ${esc(D.sites[p.site].points[2].name.toLowerCase())} and more</span></button>` : ''}
      <div class="pp-sec">Nearby</div>
      ${draft ? '<div class="near-empty">Nearby businesses link up once the place is live.</div>' : nearList(p, 4)}
      <div class="pp-by">${icon(p.source === 'vo' ? 'check' : 'official')}${p.source === 'vo' ? "From Visit Oromia's map" : p.source === 'sample' ? 'Sample listing for this demo' : 'Added by Visit Oromia this year'}</div>`;
  }

  function appView(p, draft) {
    const acts = [`<button class="pp-act primary" type="button" data-demo="In the app this starts turn-by-turn directions on Ethiopian roads.">${icon('directions')}Directions</button>`];
    if (p.kind !== 'destination') acts.push(`<button class="pp-act" type="button" data-demo="Calls from the app are counted on Visit Oromia's dashboard.">${icon('phone')}Call</button>`);
    if (p.site) acts.push(`<button class="pp-act" type="button" data-site="${esc(p.site)}">${icon('sitemap')}Site map</button>`);
    else if (p.tour360) acts.push(`<a class="pp-act" href="${esc(p.tour360.url)}" target="_blank" rel="noopener">${icon('tour')}360°</a>`);
    else if (p.tour) acts.push(`<button class="pp-act" type="button" data-demo="Opens the 360° tour once it is added.">${icon('tour')}360°</button>`);
    acts.push(`<button class="pp-act" type="button" data-demo="Visitors save places and deals to plan their trip.">${icon('save')}Save</button>`);
    if (acts.length < 4) acts.push(`<button class="pp-act" type="button" data-demo="Visitors share places with friends and family.">${icon('share')}Share</button>`);
    const meta = p.kind === 'destination' ? `${p.type} · ${p.zone}` : `${p.type} · ${whereOf(p)}`;
    return `<div class="phone"><div class="phone-screen">
      <div class="phone-bar"></div>
      <div class="app-top"><div class="app-search">${icon('search')}Search places, food, coffee</div></div>
      <div class="phone-scroll">
        ${draft ? '<div class="pp-draft">Preview · visitors can\'t see this yet</div>' : ''}
        ${heroHTML(p)}
        <div class="pp-body">
          <h3 class="pp-title">${esc(p.name)}</h3>
          <div class="pp-meta">${esc(meta)}</div>
          <div class="pp-badges">${badgesOf(p, draft)}</div>
          <div class="pp-actions">${acts.slice(0, 4).join('')}</div>
          ${tabsHTML(p, draft)}
          ${tabBody(p, draft)}
        </div>
      </div>
    </div></div>`;
  }

  function webView(p, draft) {
    const kicker = p.kind === 'destination' ? p.type : `${p.type} · ${whereOf(p)}`;
    const ph = p.photos && p.photos[0];
    return `<div class="browser">
      <div class="browser-bar"><i></i><i></i><i></i><span class="browser-url">visitoromia.org/explore</span></div>
      <div class="browser-body">
        <div class="site-head"><span class="site-logo">Visit Oromia</span><span class="site-nav"><span>Destinations</span><span>Events</span><span class="on">Map</span></span></div>
        <div class="site-map">${ph ? `<img src="${esc(ph.src)}" alt="Photo of ${esc(p.name)}">` : heroArt(p)}</div>
        <div class="site-card">
          <div class="site-kicker">${esc(kicker)}</div>
          <h4>${esc(p.name)}</h4>
          ${draft ? '<p>Preview · this page goes live after Gebeta checks the entry.</p>' : ''}
          ${p.blurb ? `<p>${esc(p.blurb)}</p>` : ''}
          <div class="site-actions">
            <button class="btn btn-orange" type="button" data-demo="Opens directions in the Gebeta Maps App, or on the web map.">${icon('directions')}Directions</button>
            ${p.site ? `<button class="btn btn-ghost" type="button" data-site="${esc(p.site)}">${icon('sitemap')}Site map</button>` : ''}
            ${p.tour360 ? `<a class="btn btn-ghost" href="${esc(p.tour360.url)}" target="_blank" rel="noopener">${icon('tour')}360° tour</a>` : ''}
          </div>
        </div>
        <div class="site-near">${detailsHTML(p)}</div>
        <div class="site-near"><div class="pp-sec">Around it</div>${draft ? '<div class="near-empty">Nearby businesses link up once the place is live.</div>' : nearList(p, 3)}</div>
        <div class="site-credit"><img src="assets/gebeta-logo.png" alt="">Map by Gebeta</div>
      </div>
    </div>`;
  }

  function renderPreview() {
    if (state.step !== ADD && state.step !== MAP) return;
    const { p, draft } = previewPlace();
    if (!p) {
      const empty = '<div class="pp-body"><p class="pp-text">No places on the map yet. Move the slider forward or press Play.</p></div>';
      $('#preview').innerHTML = state.previewMode === 'app'
        ? `<div class="phone"><div class="phone-screen"><div class="phone-bar"></div>${empty}</div></div>`
        : `<div class="browser"><div class="browser-bar"><i></i><i></i><i></i><span class="browser-url">visitoromia.org/explore</span></div>${empty}</div>`;
      return;
    }
    const scroller = $('#preview .phone-scroll, #preview .browser-body');
    const keepScroll = scroller && state.previewId === p.id ? scroller.scrollTop : 0;
    $('#preview').innerHTML = state.previewMode === 'app' ? appView(p, draft) : webView(p, draft);
    state.previewId = p.id;
    const next = $('#preview .phone-scroll, #preview .browser-body');
    if (next) next.scrollTop = keepScroll;
  }

  /* ---------- Site maps: the place in 3D, with the walking route drawn in ---------- */

  const routeLength = (pts) => pts.reduce((s, pt, i) => (i ? s + Math.hypot(pt[0] - pts[i - 1][0], pt[1] - pts[i - 1][1]) : 0), 0);
  function walkText(site, pt) {
    if (!pt.route) return 'You are here';
    const metres = routeLength(pt.route) * site.metresPerUnit;
    const minutes = Math.max(1, Math.round(metres / 75));
    const dist = metres >= 1000 ? (metres / 1000).toFixed(1) + ' km' : Math.round(metres / 10) * 10 + ' m';
    return `${minutes} min walk · ${dist}${pt.boat ? ' · then a boat' : ''}`;
  }
  const polyline = (pts) => pts.map((pt) => pt.join(',')).join(' ');

  // A small flat drawing of the plan, for the site map tab in the visitor's phone.
  function siteThumbSVG(site) {
    const [W, H] = site.size;
    const rect = (r, fill) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="4" fill="${fill}" stroke="#B9C3D0" stroke-width="2"/>`;
    const parts = [`<rect width="${W}" height="${H}" fill="#ECEEEA"/>`];
    (site.green || []).forEach((d) => parts.push(`<path d="${d}" fill="#D6ECCB"/>`));
    if (site.shore) parts.push(`<path d="${site.shore}" fill="none" stroke="#EFDDBA" stroke-width="32" stroke-linecap="round"/>`);
    parts.push(`<path d="${site.water}" fill="#9FCDF2"/>`);
    if (site.island) parts.push(`<ellipse cx="${site.island.cx}" cy="${site.island.cy}" rx="${site.island.rx}" ry="${site.island.ry}" fill="#BFE3B4"/>`);
    site.walks.forEach((w) => parts.push(`<polyline points="${polyline(w)}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`));
    if (site.pool) parts.push(rect(site.pool, '#74C3F0'));
    site.buildings.forEach((b) => parts.push(rect(b, '#fff')));
    const first = site.points.find((pt) => pt.id === site.first);
    if (first && first.route) {
      parts.push(`<polyline points="${polyline(first.route)}" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`);
      parts.push(`<polyline points="${polyline(first.route)}" fill="none" stroke="#2F7BF6" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`);
      parts.push(`<circle cx="${first.x}" cy="${first.y}" r="12" fill="#E5484D" stroke="#fff" stroke-width="4"/>`);
    }
    return `<svg class="site-svg mini" viewBox="0 0 ${W} ${H}" role="img" aria-label="Site map of ${esc(site.title)}">${parts.join('')}</svg>`;
  }

  // Points along an SVG path, sampled in the browser so the plan can reuse SVG path syntax.
  function samplePath(d, step) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
    document.body.appendChild(svg);
    const len = path.getTotalLength(), n = Math.max(12, Math.ceil(len / step)), pts = [];
    for (let i = 0; i <= n; i++) { const p = path.getPointAtLength((i / n) * len); pts.push([p.x, p.y]); }
    svg.remove();
    return pts;
  }
  function pointIn(pt, ring) {
    let c = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function distToLine(pt, line) {
    let best = Infinity;
    for (let i = 1; i < line.length; i++) {
      const [ax, ay] = line[i - 1], [bx, by] = line[i];
      const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((pt[0] - ax) * dx + (pt[1] - ay) * dy) / len2));
      best = Math.min(best, Math.hypot(pt[0] - (ax + t * dx), pt[1] - (ay + t * dy)));
    }
    return best;
  }
  function seeded(text) {
    let s = Array.from(text).reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
    return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // Turns a plan into GeoJSON around the place's real position.
  function siteGeometry(site, place) {
    const [W, H] = site.size, mpu = site.metresPerUnit;
    const kx = mpu / (111320 * Math.cos((place.lat * Math.PI) / 180)), ky = mpu / 110540;
    const ll = ([x, y]) => [place.lon + (x - W / 2) * kx, place.lat - (y - H / 2) * ky];
    const ring = (pts) => { const r = pts.map(ll); r.push(r[0]); return r; };
    const rectPts = (r) => [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]];
    const circlePts = (cx, cy, rx, ry, n) => Array.from({ length: n }, (_, i) => [cx + rx * Math.cos((i / n) * 2 * Math.PI), cy + ry * Math.sin((i / n) * 2 * Math.PI)]);
    const poly = (pts, props) => ({ type: 'Feature', properties: props || {}, geometry: { type: 'Polygon', coordinates: [ring(pts)] } });
    const line = (pts, props) => ({ type: 'Feature', properties: props || {}, geometry: { type: 'LineString', coordinates: pts.map(ll) } });
    const fc = (features) => ({ type: 'FeatureCollection', features });

    const greens = (site.green || []).map((d) => samplePath(d, 6));
    const water = samplePath(site.water, 5);
    const ground = greens.map((g) => poly(g, { k: 'green' }));
    if (site.play) ground.push(poly(rectPts(site.play), { k: 'play' }));
    if (site.parking) ground.push(poly(rectPts(site.parking), { k: 'parking' }));
    if (site.pool) ground.push(poly(rectPts(site.pool), { k: 'pool' }));
    if (site.island) ground.push(poly(circlePts(site.island.cx, site.island.cy, site.island.rx, site.island.ry, 32), { k: 'island' }));
    const lines = site.walks.map((w) => line(w, { k: 'walk' }));
    if (site.shore) lines.push(line(samplePath(site.shore, 6), { k: 'sand' }));
    if (site.rim) lines.push(line(samplePath(site.rim, 8), { k: 'rim' }));
    if (site.boat) lines.push(line(site.boat, { k: 'boat' }));
    const solids = site.buildings.map((b) => poly(rectPts(b), { k: b.deck ? 'deck' : 'building', h: b.height || 6 }));
    if (site.jetty) solids.push(poly(rectPts(site.jetty), { k: 'jetty', h: 0.8 }));

    // Trees on the green areas, clear of water, paths and buildings.
    const rand = seeded(site.title);
    const t = site.trees;
    const blocked = site.buildings.concat([site.pool, site.parking, site.play, site.jetty].filter(Boolean));
    const trees = [];
    for (let tries = 0; trees.length < t.count && tries < t.count * 40; tries++) {
      const pt = [rand() * W, rand() * H];
      if (!greens.some((g) => pointIn(pt, g)) || pointIn(pt, water)) continue;
      if (site.walks.some((w) => distToLine(pt, w) < t.clear)) continue;
      if (blocked.some((r) => pt[0] > r.x - t.clear && pt[0] < r.x + r.w + t.clear && pt[1] > r.y - t.clear && pt[1] < r.y + r.h + t.clear)) continue;
      if (site.island && ((pt[0] - site.island.cx) / site.island.rx) ** 2 + ((pt[1] - site.island.cy) / site.island.ry) ** 2 < 1.4) continue;
      const r = (t.r[0] + rand() * (t.r[1] - t.r[0])) / mpu;
      const h = t.h[0] + rand() * (t.h[1] - t.h[0]);
      trees.push(poly(circlePts(pt[0], pt[1], r, r, 8), { k: 'crown', base: t.trunk ? h * 0.25 : 0, h, shade: rand() < 0.5 ? 1 : 0 }));
      if (t.trunk) trees.push(poly(circlePts(pt[0], pt[1], r * 0.2, r * 0.2, 6), { k: 'trunk', base: 0, h: h * 0.3 }));
    }
    // A few trees on the island, around the monastery.
    if (site.island) {
      for (let i = 0; i < 14; i++) {
        const a = rand() * 2 * Math.PI, d = 0.45 + rand() * 0.4;
        const pt = [site.island.cx + Math.cos(a) * site.island.rx * d, site.island.cy + Math.sin(a) * site.island.ry * d];
        const r = (t.r[0] * 0.7) / mpu;
        trees.push(poly(circlePts(pt[0], pt[1], r, r, 8), { k: 'crown', base: 0, h: t.h[0], shade: i % 2 }));
      }
    }
    return {
      ll, ground: fc(ground), water: fc([poly(water)]), lines: fc(lines), solids: fc(solids), trees: fc(trees),
      bounds: [ll([0, H]), ll([W, 0])],
    };
  }

  // Map style for a site: Gebeta colours, white extruded buildings, 3D trees, a blue route.
  function siteStyle(site, g, lat) {
    const c = 156543.03 * Math.cos((lat * Math.PI) / 180);
    const metres = (m) => ['interpolate', ['exponential', 2], ['zoom'], 10, (m * 1024) / c, 22, (m * 4194304) / c];
    const geo = (data) => ({ type: 'geojson', data });
    const is = (k) => ['==', ['get', 'k'], k];
    return {
      version: 8,
      light: { anchor: 'viewport', color: '#ffffff', intensity: 0.32, position: [1.2, 205, 32] },
      sources: { ground: geo(g.ground), water: geo(g.water), lines: geo(g.lines), solids: geo(g.solids), trees: geo(g.trees),
        route: geo({ type: 'FeatureCollection', features: [] }) },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#ECEEEA' } },
        { id: 'green', type: 'fill', source: 'ground', filter: is('green'), paint: { 'fill-color': '#D6ECCB' } },
        { id: 'rim', type: 'line', source: 'lines', filter: is('rim'), layout: { 'line-cap': 'round' }, paint: { 'line-color': '#DCCDAA', 'line-width': metres(40) } },
        { id: 'sand', type: 'line', source: 'lines', filter: is('sand'), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#EFDDBA', 'line-width': metres(site.sandWidth || 0) } },
        { id: 'water', type: 'fill', source: 'water', paint: { 'fill-color': '#9FCDF2' } },
        { id: 'water-edge', type: 'line', source: 'water', paint: { 'line-color': '#86BFEA', 'line-width': 1.5 } },
        { id: 'island', type: 'fill', source: 'ground', filter: is('island'), paint: { 'fill-color': '#BFE3B4' } },
        { id: 'parking', type: 'fill', source: 'ground', filter: is('parking'), paint: { 'fill-color': '#DADFE5' } },
        { id: 'play', type: 'fill', source: 'ground', filter: is('play'), paint: { 'fill-color': '#E4F0D3' } },
        { id: 'pool', type: 'fill', source: 'ground', filter: is('pool'), paint: { 'fill-color': '#74C3F0' } },
        { id: 'pool-edge', type: 'line', source: 'ground', filter: is('pool'), paint: { 'line-color': '#FFFFFF', 'line-width': metres(1.2) } },
        { id: 'walk-casing', type: 'line', source: 'lines', filter: is('walk'), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#D3D9E0', 'line-width': metres(site.walkWidth * 1.5) } },
        { id: 'walk', type: 'line', source: 'lines', filter: is('walk'), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#FFFFFF', 'line-width': metres(site.walkWidth) } },
        { id: 'boat', type: 'line', source: 'lines', filter: is('boat'), paint: { 'line-color': '#5E93CC', 'line-width': 2, 'line-dasharray': [2, 2] } },
        { id: 'route-casing', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#FFFFFF', 'line-width': 12 } },
        { id: 'route', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#2F7BF6', 'line-width': 7 } },
        { id: 'jetty', type: 'fill-extrusion', source: 'solids', filter: is('jetty'), paint: { 'fill-extrusion-color': '#C79F75', 'fill-extrusion-height': ['get', 'h'] } },
        { id: 'buildings', type: 'fill-extrusion', source: 'solids', filter: ['in', ['get', 'k'], ['literal', ['building', 'deck']]],
          paint: { 'fill-extrusion-color': ['match', ['get', 'k'], 'deck', '#EAD8C0', '#FFFFFF'], 'fill-extrusion-height': ['get', 'h'], 'fill-extrusion-vertical-gradient': true } },
        { id: 'trunks', type: 'fill-extrusion', source: 'trees', filter: is('trunk'), paint: { 'fill-extrusion-color': '#9A7B57', 'fill-extrusion-height': ['get', 'h'] } },
        { id: 'crowns', type: 'fill-extrusion', source: 'trees', filter: is('crown'),
          paint: { 'fill-extrusion-color': ['match', ['get', 'shade'], 1, '#6DBE63', '#86CF76'], 'fill-extrusion-base': ['get', 'base'], 'fill-extrusion-height': ['get', 'h'] } },
      ],
    };
  }

  let siteMap = null;
  let siteGeo = null;
  let siteFrame = 0;
  let siteRun = 0; // bumps on every new route, so an old animation stops itself
  let sitePin = null;
  const lineFeature = (coords) => ({ type: 'FeatureCollection', features: coords.length > 1 ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }] : [] });

  function openSite(key, pointId) {
    const site = D.sites[key];
    const place = D.places.find((p) => p.site === key);
    if (!site || !place) return;
    hideTip();
    closeSite();
    state.site = key;
    state.sitePoint = pointId || site.first;
    const el = $('#site-overlay');
    el.innerHTML = `
      <div class="so-head">
        <button type="button" class="btn btn-sm btn-ghost site-close">${icon('back')}Back to the map</button>
        <div class="so-title"><b>${esc(site.title)}</b><span>${esc(site.note)}</span></div>
      </div>
      <div class="so-body">
        <div class="so-plan">
          <div class="site-map3d" id="site-map" role="region" aria-label="3D site map of ${esc(site.title)}"></div>
          <div class="sm-card" id="sm-card" hidden></div>
          <button type="button" class="btn btn-sm btn-ghost sm-replay" id="sm-replay">${icon('route')}Replay the route</button>
        </div>
        <aside class="so-side" id="so-side"></aside>
      </div>`;
    el.hidden = false;
    renderSiteSide();
    siteGeo = siteGeometry(site, place);
    siteMap = new maplibregl.Map({
      container: 'site-map', style: siteStyle(site, siteGeo, place.lat), bounds: siteGeo.bounds,
      fitBoundsOptions: { padding: 30 }, attributionControl: false, maxPitch: 75,
    });
    siteMap.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    siteMap.on('load', () => {
      addSiteMarkers(site);
      const cam = siteMap.cameraForBounds(siteGeo.bounds, { padding: 20, bearing: site.view.bearing });
      siteMap.jumpTo({ center: cam.center, zoom: cam.zoom - 0.25, bearing: site.view.bearing, pitch: 58 });
      setTimeout(() => playRoute(state.sitePoint), reduceMotion ? 0 : 500);
    });
    $('.site-close', el).focus();
  }

  function closeSite() {
    siteRun++;
    cancelAnimationFrame(siteFrame);
    if (siteMap) { siteMap.remove(); siteMap = null; }
    sitePin = null;
    if (!state.site) return;
    state.site = null;
    const el = $('#site-overlay');
    el.hidden = true;
    el.innerHTML = '';
  }

  function addSiteMarkers(site) {
    site.points.forEach((pt) => {
      const el = document.createElement('button');
      el.type = 'button';
      const isStart = pt.id === site.start;
      el.className = isStart ? 'sm-start' : 'sm-poi';
      el.dataset.point = pt.id;
      el.innerHTML = isStart
        ? '<span class="sm-dot"></span><span class="sm-name">You are here</span>'
        : `<span class="sm-ic">${icon(pt.icon)}</span><span class="sm-name">${esc(pt.name)}</span>`;
      el.setAttribute('aria-label', isStart ? `You are here: ${pt.name}` : `Route to ${pt.name}`);
      new maplibregl.Marker({ element: el, anchor: isStart ? 'center' : 'left', offset: isStart ? [0, 0] : [-13, 0] })
        .setLngLat(siteGeo.ll([pt.x, pt.y])).addTo(siteMap);
    });
  }

  function renderSiteSide() {
    const site = D.sites[state.site];
    const sel = site.points.find((pt) => pt.id === state.sitePoint) || site.points[0];
    const start = site.points.find((pt) => pt.id === site.start);
    $('#so-side').innerHTML = `
      <div class="so-from">${icon('walk')}<span>From <b>${esc(start.name)}</b></span></div>
      <div class="so-selected">
        <b>${esc(sel.name)}</b>
        <span>${esc(walkText(site, sel))}</span>
        <p>${esc(sel.info)}</p>
      </div>
      <ul class="so-list">${site.points.filter((pt) => pt.id !== site.start).map((pt) => `
        <li><button type="button" data-point="${pt.id}" aria-pressed="${pt.id === sel.id}">
          <span class="so-ic">${icon(pt.icon)}</span><span><b>${esc(pt.name)}</b><small>${esc(walkText(site, pt))}</small></span>
        </button></li>`).join('')}</ul>`;
  }

  // Draws the walking route with the camera following it, then drops a pin and shows the arrival card.
  function playRoute(id) {
    if (!siteMap) return;
    const site = D.sites[state.site];
    const pt = site.points.find((p) => p.id === id);
    if (!pt) return;
    state.sitePoint = id;
    renderSiteSide();
    const run = ++siteRun;
    cancelAnimationFrame(siteFrame);
    siteMap.stop();
    $('#sm-card').hidden = true;
    if (sitePin) { sitePin.remove(); sitePin = null; }
    $$('.sm-poi', $('#site-map')).forEach((m) => m.classList.toggle('is-target', m.dataset.point === id));
    if (!pt.route) {
      siteMap.getSource('route').setData(lineFeature([]));
      siteMap.easeTo({ center: siteGeo.ll([pt.x, pt.y]), zoom: site.view.followZoom - 0.6, pitch: 58, duration: reduceMotion ? 0 : 900 });
      return;
    }
    const units = pt.boat && site.boat ? pt.route.concat(site.boat.slice(1)) : pt.route;
    const coords = units.map(siteGeo.ll);
    const cum = [0];
    for (let i = 1; i < units.length; i++) cum.push(cum[i - 1] + Math.hypot(units[i][0] - units[i - 1][0], units[i][1] - units[i - 1][1]) * site.metresPerUnit);
    const total = cum[cum.length - 1];
    const at = (dist) => {
      let i = 1;
      while (i < cum.length - 1 && cum[i] < dist) i++;
      const f = Math.max(0, Math.min(1, (dist - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)));
      const a = coords[i - 1], b = coords[i];
      return { i, p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f] };
    };
    const bearingOf = (a, b) => (Math.atan2((b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180), b[1] - a[1]) * 180) / Math.PI;
    const arrive = () => {
      if (run !== siteRun) return;
      siteMap.getSource('route').setData(lineFeature(coords));
      const pinEl = document.createElement('div');
      pinEl.className = 'sm-pin';
      pinEl.innerHTML = '<svg viewBox="0 0 30 40" aria-hidden="true"><path d="M15 1.5C7.5 1.5 1.5 7.4 1.5 14.7 1.5 24.8 15 38.5 15 38.5s13.5-13.7 13.5-23.8C28.5 7.4 22.5 1.5 15 1.5z" fill="#E5484D" stroke="#fff" stroke-width="2.5"/><circle cx="15" cy="14.5" r="5" fill="#fff"/></svg>';
      sitePin = new maplibregl.Marker({ element: pinEl, anchor: 'bottom' }).setLngLat(coords[coords.length - 1]).addTo(siteMap);
      const card = $('#sm-card');
      card.innerHTML = `<span class="sm-card-ic">${icon(pt.icon)}</span><div><b>${esc(pt.name)}</b><span>Arrived · ${esc(walkText(site, pt))}</span></div>`;
      card.hidden = false;
      const bounds = coords.reduce((bb, c) => bb.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
      const cam = siteMap.cameraForBounds(bounds, { padding: { top: 110, bottom: 60, left: 70, right: 70 }, bearing: siteMap.getBearing() });
      siteMap.easeTo({ center: cam.center, zoom: Math.min(cam.zoom, site.view.followZoom), pitch: 55, bearing: siteMap.getBearing(), duration: reduceMotion ? 0 : 1300 });
    };
    if (reduceMotion) { arrive(); return; }
    const startBearing = bearingOf(coords[0], at(Math.min(total, total * 0.2)).p);
    siteMap.getSource('route').setData(lineFeature([]));
    siteMap.easeTo({ center: coords[0], zoom: site.view.followZoom, pitch: 62, bearing: startBearing, duration: 1000 });
    siteMap.once('moveend', () => {
      if (run !== siteRun) return;
      const duration = Math.max(2400, Math.min(6500, total / site.view.speed));
      const t0 = performance.now();
      let bearing = siteMap.getBearing();
      const frame = (now) => {
        if (run !== siteRun || !siteMap) return;
        const t = Math.min(1, (now - t0) / duration);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const head = at(e * total);
        siteMap.getSource('route').setData(lineFeature(coords.slice(0, head.i).concat([head.p])));
        const ahead = at(Math.min(total, e * total + total * 0.15)).p;
        const target = bearingOf(head.p, ahead);
        bearing += ((((target - bearing + 540) % 360) - 180) * 0.06);
        siteMap.jumpTo({ center: head.p, bearing, pitch: 62, zoom: site.view.followZoom });
        if (t < 1) siteFrame = requestAnimationFrame(frame);
        else arrive();
      };
      siteFrame = requestAnimationFrame(frame);
    });
  }

  /* ---------- Dashboard ---------- */

  const PERIODS = {
    '30': { months: [7], prev: [6], prevLabel: 'vs the 30 days before' },
    '90': { months: [5, 6, 7], prev: [2, 3, 4], prevLabel: 'vs the 90 days before' },
    ytd: { months: [1, 2, 3, 4, 5, 6, 7], prev: null, prevLabel: 'Months 1 to 7' },
  };
  const MONTHS = [1, 2, 3, 4, 5, 6, 7];
  const inPeriod = (arr, months) => months.reduce((s, m) => s + (arr[m] || 0), 0);
  const total = (list, metric, months) => list.reduce((s, p) => s + inPeriod(p.stats[metric], months), 0);
  const dashScope = () => D.places.filter((p) => p.month <= D.NOW && (state.zone === 'all' || p.zone === state.zone));

  function renderDashboard() {
    renderTargets();
    const scope = dashScope();
    const per = PERIODS[state.period];
    renderStats(scope, per);
    renderTopDest(scope, per.months);
    renderTopCalls(scope, per.months);
    renderTrend(scope, per.months);
    renderZones(per.months);
    renderRoutes(per.months);
    renderDeals(scope, per.months);
  }

  function renderTargets() {
    const pace = D.NOW / 12;
    const rows = [
      { key: 'destination', label: 'Destinations' },
      { key: 'business', label: 'Tourism businesses' },
      { key: 'service', label: 'Support services' },
      { key: 'deal', label: 'Deals and offers live' },
      { key: 'event', label: 'Event maps' },
    ];
    const count = (key) => {
      if (key === 'event') return D.events.filter((e) => e.month <= D.NOW).length;
      if (key === 'deal') return D.places.filter((p) => p.kind === 'business' && p.month <= D.NOW && hasDeal(p, D.NOW)).length;
      return D.places.filter((p) => p.kind === key && p.month <= D.NOW).length;
    };
    $('#targets').innerHTML = rows.map((r) => {
      const c = count(r.key), t = D.TARGETS[r.key], ratio = c / t;
      let status;
      if (r.key === 'event') status = `<div class="target-status">${t - c} more planned this year</div>`;
      else if (ratio >= 1) status = `<div class="target-status good">${icon('check')}Target reached</div>`;
      else if (ratio >= pace) status = `<div class="target-status good">${icon('check')}Ahead of pace</div>`;
      else status = `<div class="target-status warn">${icon('alert')}Behind pace</div>`;
      return `<div class="target">
        <div class="target-label">${esc(r.label)}</div>
        <div class="target-value">${num(c)} <small>of ${num(t)}</small></div>
        <div class="meter" role="img" aria-label="${num(c)} of ${num(t)}, ${Math.round(ratio * 100)}%"><i style="width:${Math.min(100, ratio * 100)}%"></i>${r.key === 'event' ? '' : `<u style="left:${pace * 100}%"></u>`}</div>
        ${status}
      </div>`;
    }).join('');
  }

  function delta(cur, prev) {
    if (!prev) return null;
    return (cur - prev) / prev;
  }
  function deltaHTML(d, note) {
    if (d == null) return `<span class="delta-note">${esc(note)}</span>`;
    const up = d >= 0;
    return `<span><span class="delta ${up ? 'up' : 'down'}">${icon(up ? 'up' : 'down')}${up ? '+' : '−'}${Math.abs(d * 100).toFixed(0)}%</span><span class="delta-note">${esc(note)}</span></span>`;
  }
  function sparkline(values, onNavy) {
    const w = 104, h = 34, pad = 4;
    const max = Math.max(...values, 1);
    const x = (i) => pad + (i * (w - pad * 2)) / (values.length - 1);
    const y = (v) => h - pad - (v / max) * (h - pad * 2);
    const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    const last = values.length - 1;
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true">
      <path d="${d}" fill="none" stroke="${onNavy ? '#4A6488' : '#A3AEBD'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${x(last)}" cy="${y(values[last])}" r="4" fill="#E8850C" stroke="${onNavy ? '#0E1A2B' : '#fff'}" stroke-width="2"/>
    </svg>`;
  }

  function renderStats(scope, per) {
    const metric = (key, filter) => {
      const list = filter ? scope.filter(filter) : scope;
      return {
        cur: total(list, key, per.months),
        prev: per.prev ? total(list, key, per.prev) : null,
        series: MONTHS.map((m) => total(list, key, [m])),
      };
    };
    const dirs = metric('directions');
    const views = metric('views');
    const calls = metric('calls', (p) => p.kind !== 'destination');
    const saves = metric('saves', (p) => p.kind === 'business');
    const tile = (label, m, note) => `<div class="card stat">
      <div><div class="stat-label">${esc(label)}</div><div class="stat-value">${num(m.cur)}</div></div>
      <div class="stat-foot">${deltaHTML(delta(m.cur, m.prev), note)}${sparkline(m.series)}</div>
    </div>`;
    $('#stats').innerHTML = `
      <div class="card stat hero-stat">
        <svg class="roads" viewBox="0 0 260 200" fill="none" aria-hidden="true"><path d="M0 60 C80 40, 160 90, 260 50" stroke="#1F3452" stroke-width="8" stroke-linecap="round"/><path d="M40 200 C60 120, 140 100, 160 0" stroke="#1F3452" stroke-width="8" stroke-linecap="round"/></svg>
        <div><div class="stat-label">Directions to Oromia places</div><div class="stat-value">${num(dirs.cur)}</div></div>
        <div class="stat-foot">${deltaHTML(delta(dirs.cur, dirs.prev), per.prevLabel)}${sparkline(dirs.series, true)}</div>
      </div>
      ${tile('Place views', views, per.prevLabel)}
      ${tile('Calls to businesses', calls, per.prevLabel)}
      ${tile('Deals saved', saves, per.prevLabel)}`;
  }

  function barList(rows, opts) {
    if (!rows.length) return '<div class="empty">No places in this zone yet.</div>';
    const max = Math.max(...rows.map((r) => r.value), 1);
    return `<ol class="barlist" data-unit="${esc(opts.unit)}">
      ${opts.head ? `<li class="bar-head" aria-hidden="true"><span>${esc(opts.head[0])}</span><span>${esc(opts.head[1])}</span><span>${esc(opts.head[2] || '')}</span></li>` : ''}
      ${rows.map((r) => `
        <li class="bar-row${opts.zone ? ' zone-row' : ''}" tabindex="0" data-tip-value="${esc(num(r.value) + ' ' + opts.unit)}" data-tip-label="${esc(r.tip || r.name)}">
          <div><span class="bar-name"><span>${esc(r.name)}</span>${r.badge || ''}</span>${r.sub ? `<span class="bar-sub">${esc(r.sub)}</span>` : ''}</div>
          <div class="bar-cell"><span class="bar" style="width:calc((100% - 52px) * ${(r.value / max).toFixed(4)});background:${r.color}"></span><span class="bar-val">${num(r.value)}</span></div>
          ${opts.zone ? '' : `<div class="bar-extra">${r.extra == null ? '' : num(r.extra)}</div>`}
        </li>`).join('')}
    </ol>`;
  }

  function renderTopDest(scope, months) {
    const rows = scope.filter((p) => p.kind === 'destination')
      .map((p) => ({ p, v: inPeriod(p.stats.views, months) }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v)
      .slice(0, 8)
      .map(({ p, v }) => ({
        name: p.name, sub: p.zone, value: v, extra: inPeriod(p.stats.directions, months), color: COLOR.destination,
        badge: p.month === D.NOW ? '<span class="badge badge-new">New</span>' : '',
        tip: `${p.name} · ${num(inPeriod(p.stats.directions, months))} directions`,
      }));
    $('#top-dest').innerHTML = barList(rows, { unit: 'views', head: ['Destination', 'Views', 'Directions'] });
  }

  // Business rankings use sample listings only, so no real business is shown with invented figures.
  function renderTopCalls(scope, months) {
    const rows = scope.filter((p) => p.kind === 'business' && p.source === 'sample')
      .map((p) => ({ p, v: inPeriod(p.stats.calls, months) }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v)
      .slice(0, 8)
      .map(({ p, v }) => ({
        name: p.name, sub: `${p.type} · ${whereOf(p)}`, value: v, extra: inPeriod(p.stats.directions, months), color: COLOR.business,
        badge: hasDeal(p, D.NOW) ? '<span class="badge badge-deal">Deal</span>' : '',
        tip: `${p.name}, ${whereOf(p)} · ${num(inPeriod(p.stats.directions, months))} directions`,
      }));
    $('#top-calls').innerHTML = barList(rows, { unit: 'calls', head: ['Business', 'Calls', 'Directions'] });
  }

  function niceMax(v) {
    if (v <= 0) return 1;
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  }

  function renderTrend(scope, months) {
    const el = $('#trend');
    const values = MONTHS.map((m) => total(scope, 'views', [m]));
    if (state.showTrendTable) {
      el.innerHTML = `<div class="table-wrap"><table class="table"><thead><tr><th>Month</th><th class="num">Place views</th></tr></thead><tbody>
        ${values.map((v, i) => `<tr><td>Month ${i + 1}${months.includes(i + 1) ? ' <span>· in period</span>' : ''}</td><td class="num">${num(v)}</td></tr>`).join('')}
      </tbody></table></div>`;
      return;
    }
    const W = Math.max(280, el.clientWidth || 420), H = 210;
    const pad = { l: 44, r: 14, t: 14, b: 30 };
    const max = niceMax(Math.max(...values));
    const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / (values.length - 1);
    const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
    const step = (W - pad.l - pad.r) / (values.length - 1);
    const i0 = months[0] - 1, i1 = months[months.length - 1] - 1;
    const bandX0 = Math.max(pad.l, x(i0) - step / 2), bandX1 = Math.min(W - pad.r, x(i1) + step / 2);
    const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    const area = `${line} L${x(values.length - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
    const ticks = [0, max / 2, max];
    el.innerHTML = `<div class="chart"><svg viewBox="0 0 ${W} ${H}" height="${H}" role="img" aria-label="Place views by month, from ${num(values[0])} in month 1 to ${num(values[values.length - 1])} in month 7">
      <rect x="${bandX0}" y="${pad.t}" width="${bandX1 - bandX0}" height="${H - pad.t - pad.b}" fill="#FDF1E3"/>
      ${ticks.map((t) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}" stroke="${t === 0 ? '#C9D2DE' : '#E3E7ED'}" stroke-width="1"/>
        <text x="${pad.l - 8}" y="${y(t) + 4}" text-anchor="end" font-size="11" fill="#5B6778" font-variant-numeric="tabular-nums">${t === 0 ? '0' : cf.format(t)}</text>`).join('')}
      ${values.map((v, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#5B6778">M${i + 1}</text>`).join('')}
      <path d="${area}" fill="#1F3452" opacity=".08"/>
      <path d="${line}" fill="none" stroke="#1F3452" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${x(values.length - 1)}" cy="${y(values[values.length - 1])}" r="4.5" fill="#1F3452" stroke="#fff" stroke-width="2"/>
      <text x="${x(values.length - 1) - 8}" y="${y(values[values.length - 1]) - 10}" text-anchor="end" font-size="12" font-weight="800" fill="#0E1A2B">${num(values[values.length - 1])}</text>
      <line class="cross" x1="0" x2="0" y1="${pad.t}" y2="${H - pad.b}" stroke="#0E1A2B" stroke-width="1" opacity="0"/>
      <circle class="focus" r="5" fill="#1F3452" stroke="#fff" stroke-width="2" opacity="0"/>
      <rect class="hit" x="${pad.l}" y="${pad.t}" width="${W - pad.l - pad.r}" height="${H - pad.t - pad.b}" fill="transparent" tabindex="0" aria-label="Explore values by month"/>
    </svg></div>`;
    const svg = el.querySelector('svg');
    const hit = el.querySelector('.hit'), cross = el.querySelector('.cross'), focus = el.querySelector('.focus');
    const show = (i, cx, cy) => {
      cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('opacity', '.35');
      focus.setAttribute('cx', x(i)); focus.setAttribute('cy', y(values[i])); focus.setAttribute('opacity', '1');
      showTip(cx, cy, `${num(values[i])} views`, `Month ${i + 1}${months.includes(i + 1) ? ' · in the selected period' : ''}`);
    };
    const hide = () => { cross.setAttribute('opacity', '0'); focus.setAttribute('opacity', '0'); hideTip(); };
    let kbIndex = values.length - 1;
    hit.addEventListener('pointermove', (e) => {
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * W;
      const i = Math.max(0, Math.min(values.length - 1, Math.round((px - pad.l) / step)));
      show(i, e.clientX, e.clientY);
    });
    hit.addEventListener('pointerleave', hide);
    hit.addEventListener('blur', hide);
    hit.addEventListener('focus', () => { const r = svg.getBoundingClientRect(); show(kbIndex, r.left + (x(kbIndex) / W) * r.width, r.top + 20); });
    hit.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      e.stopPropagation();
      kbIndex = Math.max(0, Math.min(values.length - 1, kbIndex + (e.key === 'ArrowRight' ? 1 : -1)));
      const r = svg.getBoundingClientRect();
      show(kbIndex, r.left + (x(kbIndex) / W) * r.width, r.top + 20);
    });
  }

  function renderZones(months) {
    const totals = new Map();
    D.places.filter((p) => p.month <= D.NOW && p.zone !== 'Oromia').forEach((p) => totals.set(p.zone, (totals.get(p.zone) || 0) + inPeriod(p.stats.views, months)));
    let rows = Array.from(totals, ([zone, v]) => ({ zone, v })).sort((a, b) => b.v - a.v);
    const keep = rows.slice(0, 8);
    if (state.zone !== 'all' && !keep.some((r) => r.zone === state.zone)) {
      const sel = rows.find((r) => r.zone === state.zone);
      if (sel) keep[keep.length - 1] = sel;
    }
    const rest = rows.filter((r) => !keep.includes(r));
    const list = keep.map((r) => ({
      name: r.zone, value: r.v, tip: r.zone,
      color: state.zone === 'all' || state.zone === r.zone ? '#1F3452' : '#C9D2DE',
    }));
    if (rest.length) list.push({ name: `${rest.length} other zones`, value: rest.reduce((s, r) => s + r.v, 0), color: state.zone === 'all' ? '#1F3452' : '#C9D2DE', tip: rest.map((r) => r.zone).join(', ') });
    $('#zones-sub').textContent = state.zone === 'all' ? 'Place views' : 'Place views · selected zone in navy';
    $('#zones').innerHTML = barList(list, { unit: 'views', zone: true });
  }

  function renderRoutes(months) {
    const list = D.routes.filter((r) => state.zone === 'all' || r.zone === state.zone)
      .map((r) => ({ r, v: inPeriod(r.starts, months) }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v);
    $('#routes').innerHTML = list.length
      ? `<ul class="routes">${list.map(({ r, v }) => `<li><span class="tile">${icon('route')}</span><div><b>${esc(r.name)}</b><span>${r.stops} stops · by ${esc(r.by.charAt(0).toLowerCase() + r.by.slice(1))}</span></div><span class="num">${num(v)}</span></li>`).join('')}</ul>`
      : '<div class="empty">No routes in this zone yet. Guides and creators can add them.</div>';
  }

  function renderDeals(scope, months) {
    const deals = scope.filter((p) => p.kind === 'business' && p.deal);
    const live = deals.filter((p) => hasDeal(p, D.NOW));
    const scheduled = deals.filter((p) => !hasDeal(p, D.NOW));
    $('#deals-sub').textContent = state.zone === 'all'
      ? `${live.length} live of the ${D.TARGETS.deal} in the Year 1 target · ${scheduled.length} scheduled`
      : `${live.length} live in ${state.zone} · ${scheduled.length} scheduled`;
    const rows = live.map((p) => ({ p, saves: inPeriod(p.stats.saves, months) })).sort((a, b) => b.saves - a.saves).slice(0, 7)
      .concat(scheduled.slice(0, 2).map((p) => ({ p, saves: null })));
    if (!rows.length) { $('#deals').innerHTML = '<div class="empty">No offers in this zone yet.</div>'; return; }
    $('#deals').innerHTML = `<div class="table-wrap"><table class="table">
      <thead><tr><th>Offer</th><th>Business</th><th>Zone</th><th>Status</th><th class="num">Saves</th></tr></thead>
      <tbody>${rows.map(({ p, saves }) => `<tr>
        <td><b>${esc(p.deal)}</b></td>
        <td>${esc(p.name)}<br><span>${esc(whereOf(p))}</span></td>
        <td>${esc(p.zone)}</td>
        <td>${saves == null ? '<span class="state planned">Starts month ' + p.dealMonth + '</span>' : '<span class="state live">Live</span>'}</td>
        <td class="num">${saves == null ? '–' : num(saves)}</td>
      </tr>`).join('')}</tbody></table></div>
      <p class="table-foot">Showing ${rows.length} of ${deals.length} offers in this view. Offers are sample data.</p>`;
  }

  /* ---------- Play demo: a guided walk through the demo ---------- */

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const mapReady = () => new Promise((r) => ensureMap(r));
  const CHAPTERS = { map: 'The map', place: 'Place pages', tour360: '360° tours', site: '3D site maps', add: 'Adding a place', dashboard: 'Dashboard', end: 'Done' };

  const FEATURES = [
    { chapter: 'map', title: "Visit Oromia's map on Gebeta", art: 'map',
      text: `${D.fromVO.sites} attraction sites, ${D.fromVO.businesses} hotels and resorts and ${D.fromVO.services} service points from Visit Oromia's own map.` },
    { chapter: 'place', title: 'Place pages with photos', photo: 'wenchi',
      text: 'Photos, details and what is nearby, as in a map app. Missing details show, so they can be filled in.' },
    { chapter: 'tour360', title: '360° tours', photo: 'wenchi2',
      text: "Visit Oromia's own 360° tour of Wanchi opens from the place page." },
    { chapter: 'site', title: '3D site maps', site: 'lakeview',
      text: 'Inside a resort or a destination: the walking route to the bar, the beach or the boat jetty.' },
    { chapter: 'add', title: 'Adding a place', photo: 'langano',
      text: 'A field team adds Lake Langano. Gebeta checks it, then visitors can find it.' },
    { chapter: 'dashboard', title: "Visit Oromia's dashboard", art: 'chart',
      text: 'Views, directions, calls and offers by place and zone, against the Year 1 targets.' },
  ];

  function renderFeatures() {
    const chart = `<svg viewBox="0 0 288 128" aria-hidden="true"><rect width="288" height="128" fill="#0E1A2B"/>
      <path d="M24 100 L70 84 L116 88 L162 62 L208 54 L254 30" fill="none" stroke="#E8850C" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      ${[24, 70, 116, 162, 208, 254].map((x, i) => `<rect x="${x - 9}" y="${108 - (i + 2) * 9}" width="18" height="${(i + 2) * 9}" rx="3" fill="#1F3452"/>`).join('')}</svg>`;
    $('#feature-grid').innerHTML = FEATURES.map((f) => {
      const ph = f.photo && D.photos[f.photo];
      const media = f.site ? siteThumbSVG(D.sites[f.site]) : ph ? `<img src="${esc(ph.src)}" alt="">` : f.art === 'chart' ? chart : heroArt({ kind: 'destination' });
      return `<article class="feature">
        <div class="fc-media">${media}</div>
        <div class="fc-body"><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p>
          <button type="button" class="link" data-chapter="${f.chapter}">${icon('play')}Show me</button></div>
      </article>`;
    }).join('');
  }

  // Each step sets up what it shows, so Back and Next work from anywhere in the tour.
  async function showWanchi(tab) {
    go(MAP);
    await mapReady();
    stopPlay();
    if (state.month !== D.NOW) { state.month = D.NOW; syncMonthUI(); refreshMap(); }
    if (state.selectedId !== 'wanchi') select('wanchi');
    state.previewTab = tab || 'overview';
    renderPreview();
    const w = byId.get('wanchi');
    map.flyTo({ center: [w.lon, w.lat], zoom: 8.4, duration: reduceMotion ? 0 : 1600 });
  }
  async function scrollTo(selector) {
    await wait(80);
    const el = $(selector);
    if (el) el.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  const STEPS = [
    { chapter: 'map', title: "Visit Oromia's map, on Gebeta", target: '#map-wrap', hold: 5500,
      text: `Everything on Visit Oromia's own map is here from the first day: ${D.fromVO.sites} attraction sites, ${D.fromVO.businesses} hotels and resorts and ${D.fromVO.services} service points.`,
      run: async () => {
        go(MAP); await mapReady(); stopPlay(); select(null);
        state.month = 0; syncMonthUI(); refreshMap();
        map.fitBounds(D.bounds, { padding: 36, duration: reduceMotion ? 0 : 1000 });
      } },
    { chapter: 'map', title: 'Every kind of place', target: '.map-legend', hold: 4500,
      text: 'Orange pins are places to visit. Blue dots are hotels, restaurants and guides. Green dots are services such as fuel stations, banks and clinics.',
      run: async () => { go(MAP); await mapReady(); } },
    { chapter: 'map', title: 'The map grows through the year', target: '#panel-year', hold: 6000,
      text: 'Play the year and partners add businesses, services and offers month by month, toward the Year 1 targets.',
      run: async () => { go(MAP); await mapReady(); stopPlay(); state.month = 0; togglePlay(); } },
    { chapter: 'place', title: 'Tap any place', target: '#preview', hold: 5500,
      text: 'Each place has a card on the map and a full page in the Gebeta Maps App: the page visitors see.',
      run: () => showWanchi('overview') },
    { chapter: 'place', title: 'Photos of the place', target: '#preview .phone', hold: 4000,
      text: 'Visitors see what a place looks like before they set off.',
      run: () => showWanchi('photos') },
    { chapter: 'place', title: 'Details, and what is missing', target: '#preview .pp-details', hold: 5500,
      text: 'Opening hours, phone and website show when they are known. When they are not, the page says so, which tells Visit Oromia what to fill in.',
      run: async () => { await showWanchi('overview'); await scrollTo('#preview .pp-details'); } },
    { chapter: 'tour360', title: "Visit Oromia's 360° tour", target: '#preview .pp-360', hold: 5500,
      text: "Lake Wonchi already has a 360° tour on visitoromia.org: the eco lodge, the information centre and a farmer's house. It opens straight from the place page.",
      run: async () => { await showWanchi('overview'); await scrollTo('#preview .pp-360'); } },
    { chapter: 'site', title: 'Inside a resort', target: '#site-overlay', hold: 6500,
      text: 'A 3D site map shows the way from reception to the lakeside bar, with the camera following the route.',
      run: async () => { go(MAP); await mapReady(); openSite('lakeview', 'bar'); } },
    { chapter: 'site', title: 'Any spot on site', target: '#site-overlay .so-side', hold: 5500,
      text: 'Pick the pool, the beach or the boat jetty and the route is drawn, with the walking time.',
      run: async () => {
        go(MAP); await mapReady();
        if (state.site !== 'lakeview') openSite('lakeview', 'pool'); else playRoute('pool');
      } },
    { chapter: 'site', title: 'Destinations too', target: '#site-overlay', hold: 7000,
      text: 'At Lake Wonchi the route runs from the gate down the trail to the boat jetty, where boats leave for the island monastery.',
      run: async () => { go(MAP); await mapReady(); openSite('wanchi', 'jetty'); } },
    { chapter: 'add', title: 'A place not on the map yet', target: '#add-form', hold: 4500,
      text: "Lake Langano is not on Visit Oromia's map. A field team adds it from the Gebeta Maps App.",
      run: async () => { closeSite(); if (state.added) resetAdd(true); go(ADD); await mapReady(); } },
    { chapter: 'add', title: 'Checked by Gebeta', target: '#add-status', hold: 4000,
      text: 'Gebeta checks the location, access and details before visitors can see it.',
      run: async () => { go(ADD); await mapReady(); if (!state.added && !$('#add-form').hidden) $('#add-form').requestSubmit(); } },
    { chapter: 'add', title: 'Live for visitors', target: '#preview', hold: 5000,
      text: 'Lake Langano is on the map now, with five businesses on its shore linked to it.',
      run: async (alive) => {
        go(ADD); await mapReady();
        if (!state.added && !$('#add-form').hidden) $('#add-form').requestSubmit();
        for (let k = 0; k < 40 && !state.added && alive(); k++) await wait(100);
      } },
    { chapter: 'dashboard', title: "Visit Oromia's dashboard", target: '#targets', hold: 5000,
      text: 'It starts with the Year 1 targets. The dark mark shows where month 7 should be.',
      run: async () => { go(DASHBOARD); await scrollTo('#targets'); } },
    { chapter: 'dashboard', title: 'What visitors do', target: '#stats', hold: 5000,
      text: 'Directions, place views, calls to businesses and saved deals, compared with the month before.',
      run: async () => { go(DASHBOARD); await scrollTo('#stats'); } },
    { chapter: 'dashboard', title: 'Where the interest is', target: '#screen-dashboard .grid-2', hold: 5000,
      text: 'The most viewed destinations and the businesses visitors call, for any period or zone.',
      run: async () => { go(DASHBOARD); await scrollTo('#screen-dashboard .grid-2'); } },
    { chapter: 'end', title: 'Now try it yourself', target: null, hold: null,
      text: 'Use the tabs at the top to explore the map, add a place or filter the dashboard. Visitor figures in this demo are sample data.' },
  ];

  const tour = { on: false, i: 0, token: 0, timer: 0, paused: false, left: 0, started: 0, spotTimer: 0, target: null };

  function startTour(chapter) {
    endTour();
    tour.on = true;
    closeSite();
    if (state.added && map) resetAdd(true);
    state.previewMode = 'app';
    $$('#preview-mode button').forEach((x) => x.setAttribute('aria-selected', String(x.dataset.mode === 'app')));
    tour.i = chapter ? Math.max(0, STEPS.findIndex((s) => s.chapter === chapter)) : 0;
    document.body.classList.add('touring');
    tour.spotTimer = setInterval(placeSpot, 200);
    runStep();
  }

  function endTour() {
    if (!tour.on) return;
    tour.on = false;
    tour.token++;
    clearTimeout(tour.timer);
    clearInterval(tour.spotTimer);
    $('#tour-card').hidden = true;
    $('#tour-spot').hidden = true;
    document.body.classList.remove('touring');
  }

  async function runStep() {
    const token = ++tour.token;
    const alive = () => tour.on && token === tour.token;
    const s = STEPS[tour.i];
    clearTimeout(tour.timer);
    tour.paused = false;
    tour.target = null;
    $('#tour-spot').hidden = true;
    renderTourCard(s);
    if (s.run) { try { await s.run(alive); } catch (err) { /* a step that cannot set up still shows its caption */ } }
    if (!alive()) return;
    tour.target = s.target;
    placeSpot();
    if (s.hold) startClock(s.hold);
  }

  function startClock(ms) {
    tour.left = ms;
    tour.started = performance.now();
    const bar = $('#tour-card .tc-bar i');
    if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = `tc-fill ${ms}ms linear forwards`; }
    tour.timer = setTimeout(tourNext, ms);
  }

  function togglePause() {
    if (!STEPS[tour.i].hold) return;
    const bar = $('#tour-card .tc-bar i');
    if (tour.paused) {
      tour.paused = false;
      tour.started = performance.now();
      tour.timer = setTimeout(tourNext, tour.left);
      if (bar) bar.style.animationPlayState = 'running';
    } else {
      tour.paused = true;
      clearTimeout(tour.timer);
      tour.left -= performance.now() - tour.started;
      if (bar) bar.style.animationPlayState = 'paused';
    }
    $('#tc-pause').innerHTML = tour.paused ? `${icon('play')}Play` : `${icon('pause')}Pause`;
  }
  function tourNext() { if (tour.on && tour.i < STEPS.length - 1) { tour.i++; runStep(); } }
  function tourBack() { if (tour.on && tour.i > 0) { tour.i--; runStep(); } }

  function renderTourCard(s) {
    const last = !s.hold;
    $('#tour-card').innerHTML = `
      <div class="tc-top">
        <span class="tc-chapter">${esc(CHAPTERS[s.chapter])}${last ? '' : ` · ${tour.i + 1} of ${STEPS.length - 1}`}</span>
        <button type="button" class="tc-x" id="tc-exit" aria-label="Close the tour">${icon('x')}</button>
      </div>
      <b class="tc-title">${esc(s.title)}</b>
      <p class="tc-text">${esc(s.text)}</p>
      ${last
        ? `<div class="tc-actions"><button type="button" class="btn btn-sm btn-navy" id="tc-explore">Explore on my own</button><button type="button" class="btn btn-sm btn-ghost" id="tc-again">${icon('play')}Watch again</button></div>`
        : `<div class="tc-bar"><i></i></div>
          <div class="tc-actions">
            <button type="button" class="btn btn-sm btn-ghost" id="tc-back"${tour.i ? '' : ' disabled'}>${icon('back')}Back</button>
            <button type="button" class="btn btn-sm btn-ghost" id="tc-pause">${icon('pause')}Pause</button>
            <button type="button" class="btn btn-sm btn-navy" id="tc-next">Next${icon('arrow')}</button>
          </div>`}`;
    $('#tour-card').hidden = false;
  }

  // A cut-out around the part of the screen the caption is about.
  function placeSpot() {
    const spot = $('#tour-spot');
    const el = tour.on && tour.target ? $(tour.target) : null;
    const r = el && el.getClientRects().length ? el.getBoundingClientRect() : null;
    if (!r || r.width < 4 || r.height < 4) { spot.hidden = true; return; }
    const pad = 6;
    spot.style.left = r.left - pad + 'px';
    spot.style.top = r.top - pad + 'px';
    spot.style.width = r.width + pad * 2 + 'px';
    spot.style.height = r.height + pad * 2 + 'px';
    spot.hidden = false;
  }

  /* ---------- Wiring ---------- */

  function init() {
    $('#f-zone').innerHTML = D.zones.map((z) => `<option>${esc(z)}</option>`).join('');
    $('#f-zone-filter').innerHTML = '<option value="all">All zones</option>' + D.zones.map((z) => `<option>${esc(z)}</option>`).join('');
    fillForm();
    buildLayers();
    setPlayButton(false);
    syncMonthUI();

    // Any move the viewer makes with the tabs ends the guided demo and hands them control.
    $$('.step').forEach((b) => b.addEventListener('click', () => { endTour(); go(b.dataset.step); }));
    $('#prev').addEventListener('click', () => { endTour(); go(state.step - 1); });
    $('#next').addEventListener('click', () => { endTour(); go(state.step + 1); });
    renderFeatures();
    $('#tour-play').addEventListener('click', () => startTour());
    $('#tour-card').addEventListener('click', (e) => {
      const id = (e.target.closest('button') || {}).id;
      if (id === 'tc-exit') endTour();
      else if (id === 'tc-next') tourNext();
      else if (id === 'tc-back') tourBack();
      else if (id === 'tc-pause') togglePause();
      else if (id === 'tc-again') startTour();
      else if (id === 'tc-explore') { endTour(); go(MAP); }
    });
    document.addEventListener('click', (e) => {
      const chapter = e.target.closest('[data-chapter]');
      if (chapter) { startTour(chapter.dataset.chapter); return; }
      const goBtn = e.target.closest('[data-go]');
      if (goBtn) { endTour(); go(goBtn.dataset.go); return; }
      const siteBtn = e.target.closest('[data-site]');
      if (siteBtn) { openSite(siteBtn.dataset.site); return; }
      const demo = e.target.closest('[data-demo]');
      if (demo) toast(demo.dataset.demo);
    });
    window.addEventListener('hashchange', () => go(stepFromHash()));
    document.addEventListener('keydown', (e) => {
      if (tour.on && !e.target.closest('input, select, textarea')) {
        if (e.key === 'Escape') endTour();
        else if (e.key === 'ArrowRight') tourNext();
        else if (e.key === 'ArrowLeft') tourBack();
        else if (e.key === ' ' && !e.target.closest('button, a')) { e.preventDefault(); togglePause(); }
        return;
      }
      if (e.key === 'Escape' && state.site) { closeSite(); return; }
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || state.site) return;
      if (e.target.closest('input, select, textarea, [contenteditable], .maplibregl-canvas, .seg, .pp-tabs')) return;
      if (e.key === 'ArrowRight') go(state.step + 1);
      if (e.key === 'ArrowLeft') go(state.step - 1);
    });

    // Place details: tabs and the photo count chip
    $('#preview').addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (!tab) return;
      state.previewTab = tab.dataset.tab;
      renderPreview();
    });

    // Site map overlay
    const overlay = $('#site-overlay');
    overlay.addEventListener('click', (e) => {
      if (e.target.closest('.site-close')) { closeSite(); return; }
      if (e.target.closest('#sm-replay')) { playRoute(state.sitePoint); return; }
      const pt = e.target.closest('[data-point]');
      if (pt) playRoute(pt.dataset.point);
    });

    // Add a place
    $('#add-form').addEventListener('submit', submitPlace);
    ['#f-name', '#f-type', '#f-access'].forEach((s) => $(s).addEventListener('input', () => {
      if (s === '#f-name' && $('#f-name').value.trim()) { $('#f-name').removeAttribute('aria-invalid'); $('#f-name-error').hidden = true; }
      if (draftMarker) draftMarker.getElement().querySelector('.pin-label').textContent = $('#f-name').value.trim() || 'New place';
      renderPreview();
    }));
    ['#f-kind', '#f-zone'].forEach((s) => $(s).addEventListener('change', () => {
      $('#official-row').hidden = $('#f-kind').value !== 'destination';
      renderPreview();
    }));
    $$('.tog').forEach((b) => b.addEventListener('click', () => {
      b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
      renderPreview();
    }));
    $('#f-official').addEventListener('click', (e) => {
      const el = e.currentTarget;
      el.setAttribute('aria-checked', String(el.getAttribute('aria-checked') !== 'true'));
      renderPreview();
    });
    $('#add-reset').addEventListener('click', () => resetAdd(false));

    // The year on the map
    $('#month').addEventListener('input', (e) => {
      stopPlay();
      state.month = Number(e.target.value);
      syncMonthUI();
      refreshMap();
      const sel = byId.get(state.selectedId);
      if (sel && !visible(sel)) select(null); else renderPreview();
    });
    $('#play').addEventListener('click', togglePlay);
    $$('#preview-mode button').forEach((b) => b.addEventListener('click', () => {
      state.previewMode = b.dataset.mode;
      $$('#preview-mode button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      renderPreview();
    }));

    // Dashboard
    $$('#f-period button').forEach((b) => b.addEventListener('click', () => {
      state.period = b.dataset.period;
      $$('#f-period button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      renderDashboard();
    }));
    $('#f-zone-filter').addEventListener('change', (e) => { state.zone = e.target.value; renderDashboard(); });
    $('#trend-toggle').addEventListener('click', (e) => {
      state.showTrendTable = !state.showTrendTable;
      e.currentTarget.textContent = state.showTrendTable ? 'Show as chart' : 'Show as table';
      e.currentTarget.setAttribute('aria-pressed', String(state.showTrendTable));
      renderTrend(dashScope(), PERIODS[state.period].months);
    });
    const dash = $('#screen-dashboard');
    const rowTip = (row, x, y) => showTip(x, y, row.dataset.tipValue, row.dataset.tipLabel);
    dash.addEventListener('pointerover', (e) => { const row = e.target.closest('.bar-row'); if (row) rowTip(row, e.clientX, e.clientY); });
    dash.addEventListener('pointermove', (e) => { const row = e.target.closest('.bar-row'); if (row) rowTip(row, e.clientX, e.clientY); });
    dash.addEventListener('pointerout', (e) => { if (e.target.closest('.bar-row') && !e.relatedTarget?.closest?.('.bar-row')) hideTip(); });
    dash.addEventListener('focusin', (e) => { const row = e.target.closest('.bar-row'); if (row) { const r = row.getBoundingClientRect(); rowTip(row, r.left + r.width * 0.55, r.top); } });
    dash.addEventListener('focusout', (e) => { if (e.target.closest('.bar-row')) hideTip(); });
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { if (state.step === DASHBOARD && !state.showTrendTable) renderTrend(dashScope(), PERIODS[state.period].months); }, 150);
    });
    window.addEventListener('scroll', hideTip, { passive: true });

    go(stepFromHash());
  }

  init();
})();
