# Stacka – Ändringslista (Claude-ready)

Den här listan är en sammanställning av önskade ändringar/uppdateringar i Stacka, formulerade så att den går att implementera direkt. Varje sektion innehåller **mål**, **beteende/regler** och **klart när**.

---

## 1) Utgifter

### 1.1 Revidera sandbox-layout för “Lägg till utgift” (ej scroll men inte för kompakt)
**Bakgrund:** Sandbox-versionen av “Lägg till utgift” blev **för kompakt**. Målet är fortfarande att **slippa scrolla**, men sidan ska kännas **mobilvänlig** och använda hela skärmen på ett naturligt sätt.

**Mål:**
- Samma data och inputfält som i nuvarande “Lägg till utgift”-sida ska finnas kvar.
- Layouten ska optimeras så att man **inte behöver skrolla** på vanliga mobilskärmar, utan att kännas “ihoptryckt”.

**Regler / UX-principer:**
- Utnyttja hela skärmytan: viktiga fält (t.ex. belopp, datum, kategori) ska vara tydliga och få mer “weight”.
- Minska scroll genom smart struktur (t.ex. grid/two-row, kombinerade rader, kompakta men inte små inputs).
- Behåll samma fält och samma funktionalitet.

**Klart när:**
- Sandbox-varianten har **alla samma fält** som originalet.
- På typisk mobil (t.ex. 375×812 eller liknande) ska användaren kunna fylla i utan vertikal scroll (så långt det är rimligt).
- UI känns inte “för kompakt” (inputs ska vara lätt-tryckta och läsbara).

---

## 2) Lån

### 2.1 Knapp: “Registrera månadskostnader som utgifter”
**Mål:** Användaren ska kunna skapa utgifter automatiskt från lånens månadsbetalningar, så att man slipper lägga till dem manuellt.

**Ny funktion:**
- På lån-sidan (eller relevant vy) ska det finnas en knapp, t.ex.:
  - **“Registrera månadskostnader som utgifter”** / **“Skapa utgifter från lån”**

**Beteende / regler:**
- När knappen körs skapas utgifter för **varje enskilt lån** separat.
- **Ränta** och **amortering** ska bli **två separata utgifter** per lån (om amortering > 0).
- Utgiftsnamn-format:
  - `*Typ av lån* - *Namn på lån*`
  - (tillägg i name eller description om det behövs för att särskilja ränta/amortering, men kravet är att basnamnet ska vara enligt formatet ovan)

**Kategorier:**
- Ränta ska alltid bokföras som utgift med kategori: **“Ränta bolån”**
- Amortering ska alltid bokföras som utgift med kategori: **“Amortering”**

**Belopp:**
- Ränta-utgiften får belopp = lånets månatliga räntekostnad.
- Amortering-utgiften får belopp = lånets månatliga amorteringsbelopp.
- Tilldelning/konto/etc. ska följa vad som är inställt på lånet (dvs. samma “tilldelning”/konto som lånet använder).

**Viktig följdeffekt: uppdatera lånens “belopp kvar”**
- När amorteringsutgiften skapas ska amorteringsbeloppet **dras av** från lånets kvarvarande belopp.
- Detta ska ske direkt, så att användaren inte behöver korrigera “kvar av lån” manuellt.
- Lån som saknar amortering (0) ska inte minska “belopp kvar”.

**Säkerhet/idempotens (viktigt för att undvika dubletter):**
- Knappen ska inte kunna råka skapa dubletter för samma period utan tydlig varning eller skydd.
  - Rekommendation: koppla genereringen till en **vald månad/period** och spara en markering att “lån-utgifter genererade för period X”.
  - Alternativ: kontrollera om utgifter redan finns för aktuellt lån + period + kategori innan insert.

**Klart när:**
- Ett klick skapar rätt antal utgifter:
  - 1 ränta-utgift per lån
  - +1 amortering-utgift per lån (om amortering > 0)
- Kategorierna blir alltid rätt.
- Lånets “belopp kvar” minskar med amorteringsbeloppet.
- Ingen oavsiktlig dubbelgenerering för samma period.

---

## 3) Budget

### 3.1 Auto-fyll budgetinputs från DB (lån + kreditkort), men redigerbart
**Mål:** När användaren skapar/editerar en budget ska vissa fält automatiskt fyllas i från databasen så man slipper räkna manuellt, men fälten ska gå att ändra.

**Lån → budget (endast lån med flagga aktiv):**
- Lånedata har en flagga som anger om belopp ska föras över till budget automatiskt.
- Om flaggan är aktiv ska appen:
  - Summera månadens **räntekostnad** för dessa lån och fylla i budgetposten **“Ränta bolån”**
  - Summera månadens **amortering** för dessa lån och fylla i budgetposten **“Amortering”**

**Kreditkort (CCM) → budget:**
- Om det finns ett belopp i kreditkort (ccm) för månaden ska detta läsas in till budgetposten **“Kreditkort”**.

**Regler:**
- Dessa fält ska **alltid försöka hämta data** om det finns tillgängligt.
- De ska vara **redigerbara**, så att användaren kan korrigera värden i budgeten manuellt.
- Auto-fyll ska inte “slåss” med användarens inmatning i samma session (t.ex. bara fylla default första gången, eller ha en “uppdatera från data”-knapp).

**Klart när:**
- Budget-sidan visar korrekt förifyllda värden baserat på aktuell månad/period.
- Användaren kan justera siffrorna och spara utan att auto-logik skriver över.

---

### 3.2 “Förbrukat” i budgeten ska vara summan av sparade utgifter för perioden
**Problem:** “Förbrukat” visar fel summa (ex: 77930/87580) och verkar inte matcha registrerade utgifter.

**Mål:**
- Förbrukat på budget-sidan för en specifik budget ska vara:
  - **Summa av alla utgifter som är registrerade för budgetens period**

**Regler:**
- Förbrukat ska baseras på samma periodlogik som budgeten (exakt start- och slutdatum för perioden).
- Om det finns undantag (t.ex. CCM ej inräknat) måste det vara konsekvent och tydligt — men grundkravet här är att det ska vara “totala utgifterna registrerade för perioden”.

**Klart när:**
- Förbrukat = exakt totalsumma av sparade utgifter i perioden (enligt periodfilter).
- Siffran uppdateras när utgifter läggs till/redigeras.

---

## 4) Nya features

### 4.1 Gemensamt konto (under Mer → Ekonomi)
**Placering:** Mer-sidan → Ekonomi → **Gemensamt konto**

**Syfte:** Ge användaren en tydlig bild över hur mycket som behöver föras över till ett gemensamt (eller annat specifikt) konto för att täcka räkningar och kostnader som dras från det kontot.

#### Funktionalitet
**Mål:**
- Användaren ska kunna definiera vilka budget-kategorier som ska ingå i beräkningen för “gemensamt konto”.
- Användaren ska kunna välja månad, och om budget finns för månaden ska appen räkna ut:
  - **Hur mycket som behöver föras över** till gemensamt/specifikt konto baserat på de valda kategorierna.

**Beteende / regler:**
1) **Kategoriurval**
- På sidan ska användaren kunna markera en lista av befintliga kategorier som ska ingå.
- Detta är en “saved configuration” (dvs. användaren behöver inte välja om varje gång).

2) **Månadsväljare**
- Användaren väljer månad (t.ex. Jan 2026).
- Appen kontrollerar om det finns en budget för den månaden.

3) **Beräkning**
- Om budget finns: summera budgetens belopp för de kategorier som är markerade.
- Presentera totalsumman som:
  - “Att föra över till gemensamt konto: X kr”
- (Ev. visa breakdown per kategori som extra, men inte krav här.)

**Klart när:**
- Det finns en ny sida under Mer → Ekonomi → Gemensamt konto.
- Användaren kan markera kategorier som sparas.
- För vald månad med existerande budget returnerar sidan en korrekt totalsumma baserat på markerade kategorier.

---

## Snabba beslut/antaganden (implementera konsekvent)
För att undvika oklarheter kan Claude göra rimliga antaganden, t.ex.:
- Hur man skiljer ränta/amortering i utgiftsnamn (name vs description vs suffix).
- Hur man förhindrar att “Skapa utgifter från lån” körs två gånger för samma period (idempotens).
- Exakt vilka datum som definierar “perioden” för en budget (start/slut).
