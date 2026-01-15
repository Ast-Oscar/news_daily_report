from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json

app = FastAPI()

# Autoriser le front local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).resolve().parents[1] / "docs" / "data"

@app.get("/dates")
def get_dates():
    index_path = DATA_DIR / "index.json"
    if not index_path.exists():
        return {"available_dates": [], "latest": None}
    idx = json.loads(index_path.read_text(encoding="utf-8"))
    return {"available_dates": idx.get("available_dates", []), "latest": idx.get("latest", None)}

@app.get("/veille/{date}")
def get_veille(date: str):
    file_path = DATA_DIR / f"{date}.json"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Données non trouvées pour cette date")
    data = json.loads(file_path.read_text(encoding="utf-8"))
    return data
