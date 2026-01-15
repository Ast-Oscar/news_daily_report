# scripts/schema.py

CATEGORIES = [
    "GOUVERNANCE_REGULATION_EVALUATION",
    "ECONOMIE_INDUSTRIE_INVESTISSEMENTS",
    "RSE_SOCIETE_CULTURE",
    "CYBERSECURITE_RISQUES_SECURITE_MODELES",
    "SANTE_SCIENCE_RECHERCHE",
    "DEFENSE_GEOPOLITIQUE_SOUVERAINETE",
]

VEILLE_JSON_SCHEMA = {
    "name": "veille_ia_du_jour",
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "required": ["date", "timezone", "generated_at_utc", "items"],
        "properties": {
            "date": {"type": "string", "pattern": r"^\d{4}-\d{2}-\d{2}$"},
            "timezone": {"type": "string", "const": "Europe/Paris"},
            "generated_at_utc": {"type": "string"},
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "id",
                        "categorie",
                        "sous_categorie",
                        "titre",
                        "description",
                        "sources",
                        "verification_status",
                        "confidence",
                    ],
                    "properties": {
                        "id": {"type": "string", "minLength": 8, "maxLength": 80},
                        "categorie": {"type": "string", "enum": CATEGORIES},
                        "sous_categorie": {"type": "string", "minLength": 2, "maxLength": 80},
                        "titre": {"type": "string", "minLength": 8, "maxLength": 180},
                        "description": {"type": "string", "minLength": 20, "maxLength": 700},
                        "sources": {
                            "type": "array",
                            "minItems": 1,
                            "maxItems": 3,
                            "items": {
                                "type": "object",
                                "additionalProperties": False,
                                "required": ["url", "type"],
                                "properties": {
                                    "url": {"type": "string", "minLength": 10, "maxLength": 500},
                                    "type": {"type": "string", "enum": ["primary", "secondary"]},
                                },
                            },
                        },
                        # verified = date explicitement affichée sur la page et == date du jour (Paris)
                        # unverified = date non trouvée (on n’affirme pas que c’est "du jour")
                        "verification_status": {"type": "string", "enum": ["verified", "unverified"]},
                        "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
                    },
                },
            },
            # optionnel: utile pour debug/audit
            "meta": {
                "type": "object",
                "additionalProperties": False
            },
        },
    },
    "strict": True,
}
