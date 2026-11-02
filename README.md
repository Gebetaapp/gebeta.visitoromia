# Gebeta and Visit Oromia: partnership demo

A clickable demo for Visit Oromia's non-technical team: their own map on Gebeta Maps, with
photos, place details and site maps; a field team adding a new place; and the dashboard
Visit Oromia gets. Visitor figures (views, directions, calls, saves) are sample data.

## Play demo

The demo opens on **Play demo**: what is in the demo, as six cards, and a *Play the demo*
button. The guided demo takes about 90 seconds. It clicks through the demo itself, with a
caption for each step and a highlight on the part it is about. Viewers can pause, go back or
skip, *Show me* on a card plays just that part, and clicking any tab at the top ends the
guided demo so they can try it themselves. Keys during the guided demo: arrows to move,
space to pause, Esc to stop.

## Walkthrough (about 5 minutes)

Arrow keys move between the steps.

1. **The map.** Opens on Lake Wonchi. The card on the map and the phone show what a visitor
   sees: photos, details, Overview / Photos / Site map tabs and what is nearby. Details Visit
   Oromia has not filled in yet show as "not added yet". Lake Wonchi also links to Visit
   Oromia's own 360° tour on visitoromia.org. Press *Site map* for the 3D site map: pick the
   boat jetty, hot springs or eco lodge and the walking route is drawn with the camera
   following it. The sample *Lakeview resort* in Bishoftu has one too (reception, bar, pool,
   beach, jetty). *Play Year 1* shows partners adding businesses, services and offers.
2. **Add a place.** Lake Langano is not on Visit Oromia's map. Submit it and it goes
   Submitted, Checked by Gebeta, Live, with five businesses on the west shore.
3. **Dashboard.** Year 1 targets against pace, directions, views, calls, deals saved, top
   destinations, calls to businesses, activity by zone, routes and offers. Change the period
   or zone and everything updates.

## Where the data comes from

- **Visit Oromia's Oromia Tourist map** (their Google My Maps link): 134 attraction sites,
  65 hotels and resorts and 120 service points (fuel, banks, health, police, bus stations,
  markets, airports), with their names, types, zones, woredas and descriptions. They are on
  the map from month 0. Churches, mosques, schools, government offices, prisons and military
  sites were left out. `vo-map.js` holds this data.
- **Photos** of 12 places and two dishes, from Wikimedia Commons under free licences. Each
  photo shows its author and licence. The photos on Visit Oromia's map could not be
  downloaded: Google only serves them to signed-in viewers.
- **Sample listings**: generic businesses and services that show the map growing during the
  year, the Lakeview resort and all offers. Offers are only on sample listings.
- **Site maps** (`sites.js`) are illustrative layouts. Lake Wonchi's uses its real features
  (gate, horses, trail, jetty, island monastery, hot springs, eco lodge) but not surveyed
  positions.

## 360° tours

Visit Oromia's Wanchi tour (Panotour) is at https://visitoromia.org/WanchiVR/WanchiVR.html.
Lake Wonchi's place page links to it; it opens in a new tab, because Claude artifacts cannot
embed other sites. It is the only tour we could confirm: visitoromia.org did not load from
outside Ethiopia while this was built. To link more tours, add a `tour360` entry like
Wanchi's in `data.js`.

Worth passing to Visit Oromia's web team: search engines have indexed their tour page with
an extra `?xml=` parameter that makes the tour viewer load content from an outside spam
site. Updating the tour viewer and blocking tour files passed in the address would stop it.

## Issues found in Visit Oromia's map

Worth raising with them, since Gebeta's check step is meant to catch exactly these:

- Sof Omar Cave appears twice; one pin is about 145 km from the caves.
- Yayo Forest appears three times; one pin is in East Hararghe.
- Borena National Park has two pins 39 km apart.
- Several pins have no name (only a category such as "park" or "Historical").
- Zone names are spelled several ways ("East shewa", "Bale Zone", "North Shewa (OR)").
- Most places have no opening hours, phone number or website yet.

## Run it locally

1. Copy `config.example.js` to `config.js` and paste a Gebeta Maps API key to use the live
   Gebeta map. `config.js` is not committed. Without it, the demo uses its built-in copy of
   the Gebeta map.
2. Serve the folder and open http://localhost:8000:

   ```bash
   python -m http.server 8000
   ```

## Host it on a subdomain

The demo is a static site: no build step and no server code. Serve this folder as it is,
with `index.html` at the root.

1. **Hosting.** Any static host works: nginx or Apache on a Gebeta server pointed at this
   folder, or Cloudflare Pages, Netlify or Vercel connected to the repo (no build command,
   output directory `/`), which redeploy on every push.
2. **The key.** Create `config.js` on the host with a Gebeta key that is limited to map
   tiles and locked to the subdomain. Everything in `config.js` reaches visitors' browsers,
   so the domain lock is what protects the key. With a valid key the site uses the live
   Gebeta map; if the key is missing or refused, it falls back to the built-in map.
3. **DNS and HTTPS.** Point the subdomain at the host (a CNAME, or an A record for a Gebeta
   server) and turn on HTTPS.

The site loads Manrope from Google Fonts and map tiles from `tiles.gebeta.app`; everything
else is in this folder.

## Send it as one file, or as a Claude artifact

`node build-single.js` writes to `dist/`:

- `Visit-Oromia-Demo.html`: the whole demo in one file, photos included, that opens with a
  double-click. It includes the API key from `config.js` and uses the live Gebeta map.
- `visit-oromia-artifact.html` and `photos/`: the Claude artifact. No API key; it shows the
  built-in map, because artifacts cannot load map tiles.
- `artifact-preview.html`: the artifact page wrapped so it can be checked in a browser.

Rebuild after changing the key or any file. The built-in map lives in `basemap.js`: Gebeta
tiles at zoom 6 for the region, plus zoom 10 detail around Lake Langano and Lake Wonchi.

## Before it goes out

- **Calls.** The partnership framework promises reports on searches, views, directions and
  popular routes. The dashboard also shows calls to businesses. Confirm the app counts call
  taps, or present calls as planned.
- **The API key.** The key used while building this covers every Gebeta API. Do not use it
  on the subdomain or in a single file that leaves Gebeta; use a key limited to tiles.

## Files

- `index.html`, `styles.css`: the page, in Gebeta's house style.
- `app.js`: steps, map, place details, site maps, add-a-place flow and dashboard.
- `data.js`: featured destinations, photos, sample listings, offers, routes and activity.
- `vo-map.js`: places from Visit Oromia's map. `sites.js`: site maps. `basemap.js`: built-in map.
- `photos/`: the Commons photos. `config.example.js`: copy to `config.js` for the API key.
- `vendor/`: MapLibre GL 5.2.0 (BSD licence, see `MAPLIBRE-LICENSE.txt`).
- `build-single.js`: builds the single file and the artifact into `dist/`.
- `tools/`: the scripts that built the data (see `tools/README.md`).
