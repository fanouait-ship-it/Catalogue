# AniList Catalogue

## 1. GitHub
Pousse ce dossier dans un dépôt, puis Settings > Secrets and variables > Actions :
- `MEGA_EMAIL`, `MEGA_PASSWORD`
Lance le workflow "Sync AniList vers MEGA" (onglet Actions > Run workflow). Il crée `anilist/anime.json.gz` et `anilist/manga.json.gz` sur MEGA.

## 2. Render
New > Web Service > ton dépôt. Build: `npm install` — Start: `npm start`.
Variables d'environnement : `MEGA_EMAIL`, `MEGA_PASSWORD`.
