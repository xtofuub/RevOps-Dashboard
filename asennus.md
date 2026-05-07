# Asennus

## Tarvitset

- Node.js 20+ suositus
- npm
- Internet-yhteys riippuvuuksien asennukseen

Huom:

- Sovellus käyttää paikallisesti SQLitea tiedostoon `data/revops-dashboard.db`
- Käyttäjät tallentuvat tiedostoon `data/users.json`

## Asennus

```bash
npm install
```

## Käynnistys kehityksessä

```bash
npm run dev
```

Avaa selaimessa:

- `http://localhost:3000/dashboard`

## Oletustunnukset

Ensimmäisellä käynnistyksellä luodaan paikalliset testitunnukset:

- Admin: `admin` / `admin123`
- User: `user` / `user123`

## Hyödylliset komennot

```bash
npm run lint
npm run build
npm run test
```

## Valinnaiset ympäristömuuttujat

Jos haluat datatiedostot muualle:

```bash
REVOPS_DASHBOARD_DB_PATH=/polku/revops-dashboard.db
REVOPS_LEGACY_SNAPSHOT_PATH=/polku/weekly-metrics.json
```

## Tärkeää

- `data/users.json` sisältää paikalliset käyttäjät ja salasanatiivisteet
- Salasanat eivät tallennu selväkielisinä, vaan ne on hashattu `bcrypt`:llä
- `data/revops-dashboard.db` sisältää dashboard-datan
- Jos portti `3000` varattu, Next.js voi käyttää toista porttia

## Muut dokumentaatiot

Lisädokumentaatio löytyy täältä:

- [README.md](C:\Users\SB1\Desktop\lol\RevOps-Dashboard\README.md)
- [docs/developer-guide.md](C:\Users\SB1\Desktop\lol\RevOps-Dashboard\docs\developer-guide.md)
- [docs/user-guide.md](C:\Users\SB1\Desktop\lol\RevOps-Dashboard\docs\user-guide.md)
