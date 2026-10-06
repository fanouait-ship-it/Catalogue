"""Télécharge tous les anime et manga d'AniList (API GraphQL) -> out/*.json.gz"""
import gzip, json, os, time, urllib.request, urllib.error

URL = os.environ.get("ANILIST_URL", "https://graphql.anilist.co")
QUERY = """
query ($type: MediaType, $last: Int) {
  Page(page: 1, perPage: 50) {
    media(type: $type, id_greater: $last, sort: ID) {
      id type format status seasonYear episodes chapters volumes
      averageScore popularity genres isAdult
      title { romaji english native }
      coverImage { medium }
    }
  }
}"""

def call(variables):
    body = json.dumps({"query": QUERY, "variables": variables}).encode()
    req = urllib.request.Request(URL, body, {"Content-Type": "application/json", "Accept": "application/json"})
    for attempt in range(8):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)["data"]["Page"]["media"]
        except urllib.error.HTTPError as e:
            wait = int(e.headers.get("Retry-After", 60)) if e.code == 429 else 5 * (attempt + 1)
            print(f"HTTP {e.code}, pause {wait}s"); time.sleep(wait)
        except Exception as e:
            print("Erreur:", e); time.sleep(5 * (attempt + 1))
    raise SystemExit("Échec après plusieurs essais")

os.makedirs("out", exist_ok=True)
for media_type in ("ANIME", "MANGA"):
    items, last = [], 0
    while True:
        batch = call({"type": media_type, "last": last})
        if not batch: break
        items += batch; last = batch[-1]["id"]
        if len(items) % 2500 < 50: print(media_type, len(items))
        time.sleep(0.75)  # limite : 90 requêtes/min
    path = f"out/{media_type.lower()}.json.gz"
    with gzip.open(path, "wt", encoding="utf-8") as f: json.dump(items, f, ensure_ascii=False)
    print(f"{media_type}: {len(items)} entrées -> {path}")
