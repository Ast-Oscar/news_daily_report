# scripts/summarize_urls.py
import json
import os
import sys
from pathlib import Path
from openai import OpenAI



from datetime import datetime
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo

def paris_today_yyyymmdd():
    return datetime.now(ZoneInfo("Europe/Paris")).date().isoformat()

if len(sys.argv) < 2:
    # Utilise la date du jour Europe/Paris
    today = paris_today_yyyymmdd()
    input_path = Path(__file__).parents[2] / "docs" / "data" / f"{today}.json"
    print(f"Aucune date passée, utilisation du fichier : {input_path}")
else:
    input_path = Path(sys.argv[1])
prompt_path = Path(__file__).parent / "prompt_summarize.txt"

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

with input_path.open("r", encoding="utf-8") as f:
    data = json.load(f)

with prompt_path.open("r", encoding="utf-8") as f:
    prompt_template = f.read().strip()

# Récupérer toutes les URLs, titres et leur mapping item/sources
url_to_item_src = {}
url_title_pairs = []
for item in data.get("items", []):
    titre = item.get("titre", "")
    for src in item.get("sources", []):
        url = src.get("url")
        if url:
            url_title_pairs.append((url, titre))
            url_to_item_src[url] = src

# Construire le prompt pour toutes les URLs avec leur titre
prompt = prompt_template + "\n\n" + "\n".join([
    f"Titre: {titre}\nURL: {url}" for url, titre in url_title_pairs
])

# Appel au modèle

schema = {
    "type": "object",
    "properties": {
        "summaries": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "url": {"type": "string"},
                    "description": {"type": "string"}
                },
                "required": ["url", "description"],
                "additionalProperties": False
            }
        }
    },
    "required": ["summaries"],
    "additionalProperties": False
}

resp = client.responses.create(
    model="gpt-4o",
    input=prompt,
    tools=[{"type": "web_search"}],
    text={
        "format": {
            "type": "json_schema",
            "name": "summaries",
            "schema": schema
        }
    },
    metadata={
        "project": "veille-ia",
        "step": "summarize_all",
        "timestamp": str(__import__('time').time())
    },
)
raw = (resp.output_text or "").strip()
try:
    obj = json.loads(raw)
    summaries = obj["summaries"]
except Exception:
    # fallback parsing si le modèle ne respecte pas le format
    summaries = []
    import re
    for url in urls:
        pattern = rf"URL: {re.escape(url)}\s*Résumé: (.+?)(?:\nURL:|$)"
        match = re.search(pattern, raw, re.DOTALL)
        description = match.group(1).strip() if match else "Non trouvé"
        summaries.append({"url": url, "description": description})

# Remplacement de la description principale de chaque item par la nouvelle description de la source principale
url_to_new_desc = {s["url"]: s["description"] for s in summaries}
for item in data.get("items", []):
    # On prend la première source qui a une url
    main_src = next((src for src in item.get("sources", []) if src.get("url")), None)
    if main_src and main_src["url"] in url_to_new_desc:
        item["description"] = url_to_new_desc[main_src["url"]]

with input_path.open("w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Descriptions mises à jour dans {input_path}")
