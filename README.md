# Strada

Strada est un outil visuel et agréable pour organiser ses trips, sans la complexité des outils existants.

![preview](.github/preview.png)

## Ce que ça fait

On commence par explorer une carte interactive — on recherche des endroits, des restaurants, des monuments.
En cliquant sur un point d'intérêt, une fiche s'ouvre avec les infos pratiques (horaires, note, prix, photos).
On peut ensuite l'ajouter à un voyage, l'organiser par jours, réordonner les étapes par glisser-déposer.
Une fois le planning prêt, l'app calcule automatiquement l'itinéraire optimal sur la carte.

## Stack

- **Frontend** — React, Vite, Tailwind CSS, Mapbox GL JS
- **Backend** — FastAPI, SQLite
- **APIs** — Mapbox (carte, géocodage, itinéraires), Google Places (photos, horaires, notes)
