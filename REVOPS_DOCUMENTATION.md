# RevOps Alusta - Lyhyt Kaytto- ja Dev-Ohje

Taman dokumentin tarkoitus on auttaa tiimia (myos uusia kehittajia) kayttamaan ja yllapitamaan RevOps dashboardia nopeasti.

## 1) Mita "dynaaminen" tarkoittaa tassa alustassa?

Aikaisemmin uusia mittareita sai lisattya vain koodimuutoksilla.
Nyt sivulla on dynaaminen kenttamalli:

- Voit lisata uusia mittareita suoraan UI:ssa ilman backend-koodia.
- Voit myos piilottaa, palauttaa tai poistaa custom-mittareita UI:sta.
- Uudet mittarit tallentuvat selaimen localStorageen (kenttamaaritykset + arvot).
- Uudet mittarit naytetaan automaattisesti:
- Enter Data -lomakkeessa
- Overview KPI -korteissa
- Data Table -weekly taulukossa
- Charts metric selectorissa (numerokentat)

## 2) Missa uusia mittareita lisataan?

Dashboard -> Enter Weekly Data

- Osio D: "Dynamic Metrics Wall" (nayttaa aktiiviset dynaamiset mittarit)
- Osio E: "Metric Studio" (hallinta)

Metric Studion toiminnot:

- Optional production examples: viisi tuotannon esimerkkimittaria ovat oletuksena piilotettu ja kayttaja voi ottaa ne kayttoon tarvittaessa
- Quick templates: nopea lisays yleisille tuotantomittareille
- Create custom metric: oma nimi + tyyppi + suffix
- Customize: muuta custom-mittarin nimea, tyyppia ja suffixia
- Visible now: piilota mittari
- Hidden metrics: palauta mittari takaisin
- Custom metric delete: poistaa kenttamaarityksen ja siihen liittyvat custom-arvot viikkodatasta

1. Kirjoita mittarin nimi (esim. "Tuotannon Uptime").
2. Valitse tyyppi: `number` tai `text`.
3. Paina "Lisaa".
4. Kentta ilmestyy heti syottoon ja tallennukseen.

## 3) Tuotannon esimerkkimittarit (optional)

Seuraavat pyytamasi tuotannon mittarit on lisatty valmiiksi templateiksi:

- Hyvaksyttyjen indikaattorien maara
- JR-analystin syottamien indikaattorien maara
- Kuinka usein USB-guard hajoaa
- Kuinka paljon asiakas kayttaa USB-guardia
- Muiden tuotteiden kayttoaste

## 4) Tallennuslogiikka (lyhyesti)

- Viikkodata: `revops_weekly_entries` localStorage avaimessa.
- Dynaamisten kenttien maaritykset: `revops_custom_fields` localStorage avaimessa.
- Piilotetut mittarit: `revops_hidden_metrics` localStorage avaimessa.
- Jokaisella viikolla voi olla `customFields`-objekti, johon dynaamiset kentat tallennetaan.

## 5) Yllapito-ohje kehittajalle

Jos haluat jatkossa vieda datan tietokantaan (esim. Supabase/Postgres):

1. Vie `weekly_entries` tauluun kaikki peruskentat.
2. Luo `custom_fields` taulu kenttamaarityksille (`id`, `label`, `type`).
3. Tallenna dynaamiset arvot joko:
- JSON-kenttaan (esim. `custom_fields_json`), tai
- omaan avain-arvo tauluun (`entry_id`, `field_id`, `value`).

## 6) Ideoita ensi viikon palsuun (Roope + Annu)

Tuotannon lisadataa, joka voisi tuoda arvoa:

- Tuotannon uptime prosentti (viikko)
- MTTR (vika havaittu -> korjaus valmis)
- USB-guardin aktiiviset kayttajat per paiva
- Uusien asiakkaiden onboarding läpimeno (%)
- Automaattisten hälytysten maara / viikko
- Kriittisten incidenttien maara / viikko
- Top 3 yleisinta syyta tuotannon poikkeamille

## 7) Nopea tarkistuslista ennen palaveria

- Pystyyko uusi mittari lisaantymaan ilman koodimuutosta?
- Pystyyko mittarin piilottamaan ja palauttamaan ilman koodimuutosta?
- Poistuuko custom-mittari tarvittaessa ja puhdistuuko sen arvot?
- Naykyyko mittari Enter Data + Overview + Data Table + Charts?
- Tallentuuko arvo viikolle oikein?
- Onko mittarin nimi ymmarrettava liiketoiminnalle?
