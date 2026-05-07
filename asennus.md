# Asennus

## Tarvitset

- Node.js 20+ suositus
- npm
- Internet-yhteys riippuvuuksien asennukseen

Huom:

- Sovellus kayttaa paikallisesti SQLitea tiedostoon `data/revops-dashboard.db`
- Kayttajat tallentuvat tiedostoon `data/users.json`

## Asennus

```bash
npm install
```

## Kaynnistys kehityksessa

```bash
npm run dev
```

Avaa selaimessa:

- `http://localhost:3000/login`

## Oletustunnukset

Ensimmaisella kaynnistyksella luodaan paikalliset testitunnukset:

- Admin: `admin` / `admin123`
- User: `user` / `user123`

## Hyodylliset komennot

```bash
npm run lint
npm run build
npm run test
```

## Valinnaiset ymparistomuuttujat

Jos haluat datatiedostot muualle:

```bash
REVOPS_DASHBOARD_DB_PATH=/polku/revops-dashboard.db
REVOPS_LEGACY_SNAPSHOT_PATH=/polku/weekly-metrics.json
```

## Tarkeaa

- `data/users.json` sisaltaa paikalliset kayttajat ja salasanatiivisteet
- Salasanat eivat tallennu selkokielisina, vaan ne on hashattu `bcrypt`:lla
- `data/revops-dashboard.db` sisaltaa dashboard-datan
- Tietokannassa oikeat taulut ovat `workspaces`, `snapshots` ja `snapshot_revisions`
- Jos portti `3000` varattu, Next.js voi kayttaa toista porttia

## Muut dokumentaatiot

Lisadokumentaatio loytyy taalta:

- [README.md](C:\Users\SB1\Desktop\lol\RevOps-Dashboard\README.md)
- [docs/developer-guide.md](C:\Users\SB1\Desktop\lol\RevOps-Dashboard\docs\developer-guide.md)
- [docs/user-guide.md](C:\Users\SB1\Desktop\lol\RevOps-Dashboard\docs\user-guide.md)
- [docs/RevOps-Developer-Guide.docx](C:\Users\SB1\Desktop\lol\RevOps-Dashboard\docs\RevOps-Developer-Guide.docx)
- [docs/RevOps-User-Guide.docx](C:\Users\SB1\Desktop\lol\RevOps-Dashboard\docs\RevOps-User-Guide.docx)
