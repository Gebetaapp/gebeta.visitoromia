"""Extract the Oromia Tourist map into JSON: attraction sites, service points, towns and photo links."""
import sys, re, json, html
import xml.etree.ElementTree as ET

ns = {"k": "http://www.opengis.net/kml/2.2"}
KEYS = {"name": "name", "type": "type", "type1": "type", "type2": "type2", "descrption": "description",
        "description": "description", "description:-": "description", "opening_hour": "hours", "opening_ho": "hours",
        "opening hour": "hours", "informatio": "info", "information": "info", "phone_numb": "phone",
        "phone_number": "phone", "phone number": "phone", "website": "website", "zone": "zone",
        "woreda": "woreda", "elevation": "elevation", "ownership": "ownership"}

def parse_desc(desc):
    text = re.sub(r"<br\s*/?>", "\n", desc or "")
    text = html.unescape(re.sub(r"<[^>]+>", "\n", text))
    out = {}
    for line in (l.strip() for l in text.split("\n")):
        m = re.match(r"^([A-Za-z_ :\-0-9]+?)(?::-)?\s{1,}(.+)$", line) if line else None
        key = None
        for k in sorted(KEYS, key=len, reverse=True):
            if line.lower().startswith(k + " ") or line.lower().startswith(k + ":"):
                key = k; break
        if key:
            val = line[len(key):].lstrip(" :-").strip()
            if val and KEYS[key] not in out:
                out[KEYS[key]] = val
    return out

root = ET.parse(sys.argv[1]).getroot()
doc = root.find("k:Document", ns)
data = {}
for folder in doc.findall("k:Folder", ns):
    fname = folder.findtext("k:name", default="?", namespaces=ns)
    items = []
    for m in folder.findall(".//k:Placemark", ns):
        coords = (m.findtext(".//k:coordinates", default="", namespaces=ns) or "").strip().split(",")
        if len(coords) < 2:
            continue
        rec = {"layer_name": (m.findtext("k:name", default="", namespaces=ns) or "").strip(),
               "lon": round(float(coords[0]), 5), "lat": round(float(coords[1]), 5)}
        rec.update(parse_desc(m.findtext("k:description", default="", namespaces=ns)))
        media = []
        for d in m.findall(".//k:ExtendedData/k:Data", ns):
            if d.get("name") == "gx_media_links":
                media += (d.findtext("k:value", default="", namespaces=ns) or "").split()
        rec["photos"] = [u for u in media if "youtube" not in u]
        rec["videos"] = sorted(set(u for u in media if "youtube" in u))
        items.append(rec)
    data[fname] = items
json.dump(data, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for k, v in data.items():
    print(k, len(v), "with photos:", sum(1 for r in v if r["photos"]), "photo urls:", sum(len(r["photos"]) for r in v))
