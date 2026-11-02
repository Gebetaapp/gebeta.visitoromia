"""Download chosen Commons thumbnails and record their credits."""
import sys, json, urllib.request, time, os
picks = json.loads(sys.argv[1])
cands = json.load(open(sys.argv[2], encoding="utf-8"))
out = sys.argv[3]
os.makedirs(out, exist_ok=True)
credits = {}
for key, title_part in picks.items():
    c = next((c for k in cands for c in cands[k] if title_part in c["title"]), None)
    if not c:
        print("missing", key); continue
    for attempt in range(4):
        try:
            req = urllib.request.Request(c["thumb"], headers={"User-Agent": "GebetaDemoBuilder/1.0"})
            open(os.path.join(out, key + ".jpg"), "wb").write(urllib.request.urlopen(req, timeout=30).read())
            break
        except Exception as e:
            time.sleep(6 * (attempt + 1))
    time.sleep(1.5)
    credits[key] = {"title": c["title"], "artist": c["artist"], "license": c["license"], "page": c["page"]}
    print(key, "<-", c["title"][:60], c["license"])
json.dump(credits, open(os.path.join(out, "credits.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
