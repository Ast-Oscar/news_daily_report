# scripts/daily_ia.py

import json
import os
import hashlib
from datetime import datetime, timezone
from pathlib import Path

from openai import OpenAI

from schema import VEILLE_JSON_SCHEMA, CATEGORIES

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "docs" / "data"
INDEX_PATH = DATA_DIR / "index.json"

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

def now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def paris_today_yyyymmdd() -> str:
    # Python 3.9+ : zoneinfo standard
    from zoneinfo import ZoneInfo
    return datetime.now(ZoneInfo("Europe/Paris")).date().isoformat()

def stable_id(date_str: str, url: str, title: str) -> str:
    base = f"{date_str}::{url}::{title}".lower().encode("utf-8")
    return hashlib.sha256(base).hexdigest()[:16]

def load_index():
    if INDEX_PATH.exists():
        return json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    return {"timezone": "Europe/Paris", "available_dates": [], "latest": ""}

def save_index(idx):
    INDEX_PATH.write_text(json.dumps(idx, indent=2, ensure_ascii=False), encoding="utf-8")

def build_prompt(date_paris: str) -> str:
    # Prompt volontairement proche de ton prompt original, mais avec sortie JSON.
    # Très important: "publié le jour même" + liens directs.
    categories_list = "\n".join(CATEGORIES)

    return f"""
Agis comme un analyste senior en veille technologique spécialisé en intelligence artificielle devant réaliser la veille du jour d'aujourd'hui uniquement.

Date de référence (Europe/Paris) : {date_paris}

Objectif :
- Produis uniquement les actualités IA publiées aujourd'hui le {date_paris} (pas d’archives), à l’échelle mondiale.
- Couvre toutes les catégories (au moins 1 item par catégorie si possible) :
  {categories_list}

Contraintes obligatoires :
- Les actualités doivent être directement liées à l’IA (pas de techno générique).
- Chaque news doit être publiée aujourd'hui le {date_paris} : la date doit être explicitement visible sur la page source.
- Si la date de publication n’est pas clairement trouvable sur la page, tu peux inclure l’item mais :
  - verification_status = "unverified"
  - confidence = "low" (ou "medium" uniquement si source officielle très claire)
  - NE PAS affirmer que c’est publié aujourd'hui le {date_paris} dans la description.
- Aucune extrapolation : uniquement des faits sourcés.
- Liens directs et précis vers les articles originaux (pas de pages d’accueil, pas de pages catégorie/tag).
- Une news = un fait = une source primaire claire (source secondaire optionnelle si elle ajoute un fait distinct).
- Langue : français.
- Ton : neutre, factuel, synthétique.
- Description : 4–6 lignes max (~700 caractères).

Sortie :
- Retourne UNIQUEMENT un JSON valide, strictement conforme au schéma fourni.
"""

def main():
    import logging
    import time
    from openai import OpenAIError

    logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s %(message)s')
    print("[DEBUG] Initialisation du dossier de données...")

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[DEBUG] DATA_DIR: {DATA_DIR}")

    date_paris = paris_today_yyyymmdd()
    print(f"[DEBUG] Date Paris: {date_paris}")
    out_path = DATA_DIR / f"{date_paris}.json"
    print(f"[DEBUG] Output path: {out_path}")

    # 1 run/jour: si déjà généré, on stop (utile si relance)
    if out_path.exists():
        logging.info(f"Already generated: {out_path}")
        print(f"[DEBUG] Fichier déjà généré: {out_path}")
        return

    prompt = build_prompt(date_paris)
    print("[DEBUG] Prompt construit.")

    # Debug: starting request
    logging.debug("Starting OpenAI request...")
    print("[DEBUG] Début de la requête OpenAI...")
    start_time = time.time()
    try:
        resp = client.responses.create(
            model="gpt-4o-mini",
            input=prompt,
            tools=[{"type": "web_search"}],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "veille_ia",
                    "schema": VEILLE_JSON_SCHEMA["schema"]
                }
            },
            metadata={
                "project": "veille-ia",
                "date_paris": date_paris,
                "step": "single_call",
            },
            # You can add timeout here if supported, e.g. timeout=60
        )
        elapsed = time.time() - start_time
        logging.debug(f"OpenAI request completed in {elapsed:.2f}s")
        print(f"[DEBUG] Requête OpenAI terminée en {elapsed:.2f}s")
        raw = (resp.output_text or "").strip()
        logging.debug(f"Response received: {len(raw)} chars")
        print(f"[DEBUG] Réponse reçue ({len(raw)} caractères)")
        data = json.loads(raw)
        print("[DEBUG] JSON chargé depuis la réponse.")
    except OpenAIError as e:
        logging.error(f"OpenAI API error: {e}")
        print(f"[DEBUG] Erreur OpenAI API: {e}")
        return
    except Exception as e:
        logging.error(f"General error during request: {e}")
        print(f"[DEBUG] Erreur générale lors de la requête: {e}")
        return

    # Force métadonnées
    print("[DEBUG] Ajout des métadonnées au JSON...")
    data["date"] = date_paris
    data["timezone"] = "Europe/Paris"
    data["generated_at_utc"] = now_utc_iso()
    print("[DEBUG] Métadonnées ajoutées.")
    # Sauvegarde le JSON dans le fichier du jour
    print(f"[DEBUG] Sauvegarde du JSON dans {out_path} ...")
    out_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[DEBUG] JSON écrit dans {out_path}")

if __name__ == "__main__":
    main()