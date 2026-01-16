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
  daily_ia.py          # Génère le rapport brut du jour (JSON)
  summarize_urls.py    # Génère et met à jour les descriptions résumées pour chaque article
  prompt_summarize.txt # Prompt utilisé pour la génération des résumés
  schema.py            # Schéma des données manipulées
docs/
  index.html           # Interface web de consultation
  app.js               # Logique front-end
  styles.css           # Styles de l’interface
  data/                # Données générées (JSON)
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

### Génération et enrichissement automatique (recommandé)

Lancer le script principal, qui génère le rapport du jour puis enrichit automatiquement les descriptions :

```sh
python scripts/daily_ia.py
```

Le fichier du jour est généré dans `docs/data/YYYY-MM-DD.json` et les descriptions sont automatiquement résumées par le modèle IA.

### Génération ou enrichissement manuel

Pour enrichir ou réenrichir un fichier JSON existant (par exemple après correction manuelle) :

```sh
python scripts/summarize_urls.py docs/data/2026-01-15.json
```

Le script mettra à jour le champ `description` de chaque article selon le prompt `prompt_summarize.txt`.

### Résultats

Les résultats sont accessibles dans le dossier `docs/data/` et via l’interface web (`docs/index.html`).

## Lancer le serveur en local


```
python -m http.server 8000
```


## Fonctionnalité des scripts

- **daily_ia.py** : Génère le rapport brut du jour (ou d’une date passée) et lance automatiquement l’enrichissement des descriptions via summarize_urls.py.
- **summarize_urls.py** : Met à jour le champ `description` de chaque article à partir de la source principale, en générant un résumé court et factuel via GPT-4o. Utilise le prompt du fichier `prompt_summarize.txt`.
- **prompt_summarize.txt** : Prompt éditable pour contrôler le style et la consigne des résumés générés.
- **schema.py** : Schéma de validation des données JSON générées.

## Automatisation

Le workflow GitHub Actions `.github/workflows/daily.yml` permet d’automatiser l’exécution quotidienne du script principal.

## Auteurs

- [Votre nom]
- [Collaborateurs]

## Licence

Ce projet est sous licence MIT.

---

*Projet réalisé avec Python 3.11*