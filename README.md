# Veille IA

Projet de veille quotidienne sur l’actualité de l’intelligence artificielle.

## Description

Ce projet automatise la collecte, l’analyse et la présentation d’actualités liées à l’IA. Il s’appuie sur des scripts Python pour extraire, traiter et présenter les informations sous forme de rapports quotidiens.

## Architecture

```
.github/
  workflows/
    daily.yml           # Workflow GitHub Actions pour l’automatisation
scripts/
  daily_ia.py          # Script principal de génération du rapport
  schema.py            # Schéma des données manipulées
  extract_date.py      # Extraction et gestion des dates
  utils.py             # Fonctions utilitaires
docs/
  index.html           # Interface web de consultation
  app.js               # Logique front-end
  styles.css           # Styles de l’interface
  data/                # Données générées (JSON, CSV, etc.)
requirements.txt       # Dépendances Python
README.md              # Ce fichier
```

## Prérequis

- Python 3.11
- pip

## Installation

1. **Cloner le dépôt**  
   ```sh
   git clone <url-du-repo>
   cd news_daily_report
   ```

2. **Installer les dépendances**  
   ```sh
   pip install -r requirements.txt
   ```
   ou  
   ```sh
   python -m pip install -r requirements.txt
   ```

## Utilisation

- Lancer le script principal :
  ```sh
  python scripts/daily_ia.py
  ```

- Les résultats sont accessibles dans le dossier `docs/data/` et via l’interface web (`docs/index.html`).

## Lancer le serveur en local


```
python -m http.server 8000
```

## Automatisation

Le workflow GitHub Actions `.github/workflows/daily.yml` permet d’automatiser l’exécution quotidienne du script.

## Auteurs

- [Votre nom]
- [Collaborateurs]

## Licence

Ce projet est sous licence MIT.

---

*Projet réalisé avec Python 3.11*