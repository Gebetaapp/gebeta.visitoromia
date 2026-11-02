# Tools

Scripts used to build the demo's data. None of them run when the demo is served.

| Script | What it does |
|---|---|
| `kml_extract.py` | Reads Visit Oromia's map exported as KML (`https://www.google.com/maps/d/kml?mid=191qIsBmBzyJGPwwV3cokkA_QTndq4Vzg&forcekml=1`) into JSON. |
| `make_vo_map.py` | Turns that JSON into `vo-map.js`: tidies zones and types, drops duplicate and unnamed pins, keeps visitor-relevant categories. |
| `extract_basemap.js` | Cuts `basemap.js`, the built-in copy of the Gebeta map, from Gebeta's vector tiles. Needs a Gebeta API key in `config.js`. |
| `tiles_lib.js` | Helpers for `extract_basemap.js`. It loads `@mapbox/vector-tile` and `pbf` from another local project's `node_modules`; point `PNPM` at any folder that has them, or run `npm install @mapbox/vector-tile@1 pbf@3` and change the requires. |
| `inspect_style.js` | Prints the layers of Gebeta's standard map style. |
| `commons_search.py`, `get_commons.py` | Search Wikimedia Commons and download the chosen photos with their credits. |
| `nocache_server.py` | A local web server that turns caching off, for checking changes. |

Typical runs, from the `oromia-demo` folder:

```bash
python -I tools/kml_extract.py map.kml oromia_map.json
python -I tools/make_vo_map.py oromia_map.json vo-map.js
node tools/extract_basemap.js config.js basemap.js
python tools/nocache_server.py . 8000
```
