"""Turn the extracted Oromia Tourist map JSON into vo-map.js for the demo (visitor-relevant places only)."""
import sys, json, re, math

d = json.load(open(sys.argv[1], encoding="utf-8"))
ZONES = {"": "", "Adama": "East Shewa", "Bishoftu": "East Shewa", "East shewa": "East Shewa", "Bale Robe": "Bale",
         "Bale Zone": "Bale", "Robe": "Bale", "East Hararghe": "East Hararge", "Eastern Hararge": "East Hararge",
         "Haramaya": "East Hararge", "Hararghe": "East Hararge", "East Wollega Zone": "East Wellega",
         "Finfinnee Special": "Finfine Special", "Mattu": "Ilu Aba Bora", "Mirab Hararghe": "West Hararge",
         "West Hararghe": "West Hararge", "Mirab Welega": "West Wellega", "West Wollega": "West Wellega",
         "North Shewa (OR)": "North Shewa", "North shewa": "North Shewa", "north Shewa": "North Shewa",
         "Southwest Shewa": "South West Shewa", "West shewa": "West Shewa", "Shambu": "Horo Gudru Wellega"}
TYPES = {"Mininig Site": "Mining site", "Water Fall": "Waterfall", "park": "Park", "other": "Other site",
         "cultural": "Cultural heritage", "Recrational": "Recreation area"}
BUSINESS = {"Resorts": "Hotel", "Recreation Resorts": "Resort", "Resort": "Resort", "Star Hotels": "Hotel",
            "Hotel": "Hotel", "Apartment": "Apartment hotel", "art galleries": "Art gallery"}
SERVICE = {"Gasoline": "Fuel station", "commercial": "Bank", "Health Center": "Health centre", "Hospital": "Hospital",
           "Clinic": "Clinic", "Primary care clinics": "Clinic", "Police office": "Police station",
           "public transport": "Bus station", "Regional Airports.": "Airport", "Head Post office": "Post office",
           "Physical Markets": "Market", "Department Stores": "Shopping"}
AS_SITES = {"Recrational", "park", "Ethnographic museum", "Palace", "Wabe Shebele Gorge", "Historical", "His", "Landslide lakes"}
BUSINESS["resorts and commercial"] = "Hotel"
SERVICE.update({"Bank": "Bank", "Local Airports.": "Airport", "Sub Post Office": "Post office", "commercial and Head Post office": "Post office"})
# Pins that are clearly misplaced in the source map (reported to the user, not shown).
WRONG = {("Yayo Forest", "East Hararge")}  # service-layer entries that are really places to visit

def clean(s):
    s = re.sub(r"\s+", " ", (s or "")).strip()
    return "" if s in ("0", "-", ".") else s
def zone(z):
    z = clean(z)
    return ZONES.get(z, z)
def key(name):
    return re.sub(r"s$", "", re.sub(r"[^a-z]", "", name.lower()))

sites, seen, dropped = [], {}, []
def add_site(r):
    name = clean(r.get("name"))
    if not name or name.lower() in (clean(r["layer_name"]).lower(), clean(r.get("type")).lower()):
        dropped.append(f"unnamed {r['layer_name']} ({r['lat']}, {r['lon']})")
        return
    if (name, zone(r.get("zone"))) in WRONG:
        dropped.append(f"{name} ({r['lat']}, {r['lon']}, {r.get('zone','')}) is in the wrong zone")
        return
    k = key(name)
    for other in seen.get(k, []):
        km = 111 * math.hypot(r["lat"] - other[0], (r["lon"] - other[1]) * math.cos(math.radians(r["lat"])))
        if km < 150:
            dropped.append(f"{name} ({r['lat']}, {r['lon']}, {r.get('zone','')}) duplicates the pin {km:.0f} km away")
            return
    seen.setdefault(k, []).append((r["lat"], r["lon"]))
    typ = clean(r.get("type")) or clean(r["layer_name"])
    typ = TYPES.get(typ, typ[:1].upper() + typ[1:])
    desc = clean(r.get("description"))
    if re.match(r"^(is|was|are|has|it is)\b", desc):
        desc = f"{name} {desc}"
    if desc and not desc.endswith("."):
        desc += "."
    video = r["videos"][0].replace("/embed/", "/watch?v=") if r["videos"] else ""
    sites.append([name, typ, r["lat"], r["lon"], zone(r.get("zone")), clean(r.get("woreda")), clean(r.get("elevation")),
                  desc, clean(r.get("hours")), clean(r.get("phone")), clean(r.get("website")), video])

for r in d["Oromia_Tourist_Attraction_Sites"]:
    add_site(r)
services, skipped = [], {}
for r in d["Service_points"]:
    cat = r["layer_name"]
    if cat in AS_SITES:
        add_site(r); continue
    kind = "business" if cat in BUSINESS else "service" if cat in SERVICE else None
    if not kind:
        skipped[cat] = skipped.get(cat, 0) + 1; continue
    name = clean(r.get("name")) or (BUSINESS.get(cat) or SERVICE.get(cat))
    services.append([name, kind, (BUSINESS.get(cat) or SERVICE.get(cat)), r["lat"], r["lon"], zone(r.get("zone"))])

out = {"source": "Visit Oromia's Oromia Tourist map (Google My Maps), exported November 2026",
       "sites": sites, "services": services}
js = ("/* Places from Visit Oromia's own Oromia Tourist map (Google My Maps).\n"
      "   sites: [name, type, lat, lon, zone, woreda, elevation, description, hours, phone, website, video]\n"
      "   services: [name, kind, type, lat, lon, zone]. Regenerate rather than editing by hand. */\n"
      "window.VO_MAP = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
open(sys.argv[2], "w", encoding="utf-8").write(js)
print(f"sites {len(sites)}, businesses {sum(1 for s in services if s[1]=='business')}, services {sum(1 for s in services if s[1]=='service')}, {len(js)//1024} KB")
print("dropped duplicates:"); [print("  ", x) for x in dropped]
print("left out categories:", skipped)
print("zones:", sorted({s[4] for s in sites} | {s[5] for s in services}))
