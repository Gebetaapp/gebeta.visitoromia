"""Search Wikimedia Commons for freely licensed photos and list candidates with licence and author."""
import sys, json, urllib.request, urllib.parse, re, html, time, os, urllib.error

QUERIES = json.loads(sys.argv[1])
out = json.load(open(sys.argv[2], encoding='utf-8')) if os.path.exists(sys.argv[2]) else {}
for key, q in QUERIES.items():
    params = {"action": "query", "format": "json", "generator": "search", "gsrsearch": q, "gsrnamespace": "6",
              "gsrlimit": "6", "prop": "imageinfo", "iiprop": "url|extmetadata|size", "iiurlwidth": "640"}
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "GebetaDemoBuilder/1.0 (demo photos; contact via Gebeta)"})
    for attempt in range(5):
        try:
            data = json.load(urllib.request.urlopen(req, timeout=30)); break
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
            time.sleep(8 * (attempt + 1))
    time.sleep(3)
    cands = []
    for p in sorted((data.get("query") or {}).get("pages", {}).values(), key=lambda x: x.get("index", 99)):
        ii = (p.get("imageinfo") or [{}])[0]
        meta = ii.get("extmetadata", {})
        lic = meta.get("LicenseShortName", {}).get("value", "")
        artist = re.sub(r"<[^>]+>", "", html.unescape(meta.get("Artist", {}).get("value", ""))).strip()
        if not p["title"].lower().endswith((".jpg", ".jpeg")):
            continue
        cands.append({"title": p["title"], "thumb": ii.get("thumburl"), "w": ii.get("width"), "h": ii.get("height"),
                      "license": lic, "artist": artist[:80], "page": ii.get("descriptionurl")})
    out[key] = cands
    json.dump(out, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f"\n{key}  ({q})")
    for c in cands[:4]:
        print(f"   {c['title'][:70]:70} {c['license']:14} {c['artist'][:30]}")
json.dump(out, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
