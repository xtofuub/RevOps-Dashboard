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
cp .env.local.example .env.local
# aseta SESSION_SECRET vahaan satunnaiseen merkkijonoon (min 32 merkkia)
npm install
```

## Kaynnistys

```bash
npm run build
npm start
```

Avaa selaimessa:

- `http://localhost:3000/login`

## Kehitysmoodi

```bash
npm run dev
```

## Oletustunnukset

Ensimmaisella kaynnistyksella luodaan paikalliset testitunnukset:

- Admin: `admin` / `admin123`
- User: `user` / `user123`

## Hyodylliset komennot

```bash
npm run build    # tuotantoversio
npm start        # kaynnista tuotantopalvelin
npm run dev      # kehityspalvelin
npm run lint
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

- [README.md](../README.md)
- [docs/developer-guide.md](developer-guide.md)
- [docs/user-guide.md](user-guide.md)
