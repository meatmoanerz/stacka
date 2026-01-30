# Stacka – Nya uppdateringar (Claude-ready)

Den här filen beskriver **nya** ändringar/bugfixar. Jag kommer att bifoga screenshots i min prompt till Claude för kontext.

## Bifogade bilder (för Claude)
**UI/UX darkmode / input-problem:**
- `e023b8f3-f55d-451e-8d35-cbba840b8b86.png`
- `44f8361b-0c46-45ef-90df-f28ddb1e2ae1.png`
- `7281ccfd-f931-4747-9566-a0f4a0ab7eca.png`

(Plus eventuella tidigare dashboard/recurring screenshots om behövs.)

---

## 1) Dashboard

### 1.1 Ta bort sektionen “Fördelning”
**Mål:** Sektionen “Fördelning” ger inte tillräckligt värde och ska tas bort från dashboard.

**Klart när:**
- Sektionen och dess komponent(er) är borttagna från dashboard UI.
- Inga tomma ytor/buggiga layout-sid effects uppstår.

---

### 1.2 Sparkvot – Actual-beräkning ska baseras på faktiskt sparat belopp / budgetinkomst
**Problem:** Actual sparkvot visar fel (t.ex. 95%) trots att inget sparande registrerats.

**Mål:** Actual sparkvot ska visa hur stor andel av **inkomst enligt budget** som faktiskt sparats.

**Definition (enligt önskat exempel):**
- `IncomeBudget = inkomstbeloppet i budgeten för perioden`
- `SavedActual = summa av registrerade utgifter i kategorigrupp “Sparande” (dvs. faktiska spar-utgifter) för perioden`
- `SavedBudget = budgeterat sparande (som redan används för “Budget”-sparkvot)`
- `SparkvotActual = SavedActual / IncomeBudget`
- `SparkvotBudget = SavedBudget / IncomeBudget`

**Exempel:**
- IncomeBudget = 10 000 kr
- SavedActual = 2 000 kr (registrerat sparande)
- SavedBudget = 5 000 kr (budgeterat sparande)
→ Actual = 20%, Budget = 50%

**Klart när:**
- “Sparkvot” KPI visar **Actual vs Budget** enligt ovan.
- Om SavedActual = 0 → Actual visar 0% (inte ett högt värde).
- Beräkningen använder **total data** (jag + partner) när konton är kopplade, om inte användaren explicit filtrerar per person.

---

### 1.3 “Senaste utgifterna” ska visa hela utgiften (inte bara min del)
**Problem:** Senaste utgifterna visar fortfarande endast “min del” i delat konto-läge.

**Mål:** Listan ska visa **totalbeloppet för varje utgift** när konton är kopplade.

**Klart när:**
- Beloppen i “Senaste utgifterna” matchar totalsumman (inte user-split).
- Om det finns en UI-toggle någonstans för “Min/Partner/Total” så ska default på dashboard vara **Total**.

---

## 2) Lån

### 2.1 Fixa “Registrera månadskostnader som utgift” – felaktigt datumintervall (2026-02-31)
**Problem (från devtools):**
- API-anrop bygger ett ogiltigt datum: `date=lte.2026-02-31`
- Fel: `date/time field value out of range: "2026-02-31"`
- Request som syns:
  - `GET .../expenses?...&date=gte.2026-02-01&date=lte.2026-02-31 ... 400`
  - `Failed to create expenses from loans: { code: '22008', message: 'date/time field value out of range: "2026-02-31"' }`

**Mål:** Datumberäkningen ska alltid använda ett giltigt “end of month”-datum.

**Regel:**
- Slutdatum för månaden ska beräknas korrekt (28/29/30/31) via riktig date-funktion.
  - Ex: `endOfMonth(year, month)` i JS eller motsv.

**Klart när:**
- Funktionen kan köras i februari och andra månader utan 400 error.
- API-anrop använder korrekt `date=lte.<YYYY-MM-lastDay>`.

---

### 2.2 Default-period för registrering ska vara 1:a i **nuvarande budgetperiod** (inte kalender-månad)
**Problem:** Default månad/date utgår från nuvarande kalender-månad, men ska följa budgetperioden.

**Mål:**
- Defaultdatum (och default period) för “registrera månadskostnader” ska vara:
  - **den 1:a i nuvarande budgetperiod**

**Klart när:**
- Default väljer periodstart enligt appens budgetperiod-logik.
- Om användaren ändrar datum, används det valda datumet för skapade utgifter.

---

## 3) Expenses

### 3.1 Datumväljare fungerar inte på mobil (tap på Datum gör inget)
**Problem:** På telefonen händer inget när man trycker på Datum i “Ny utgift” → kan inte välja datum.

**Mål:** Datum-fältet ska öppna datumväljaren på mobil.

**Klart när:**
- Tap på datumfältet öppnar date picker på iOS/Android.
- Datumval sparas och påverkar utgiftens registreringsdatum korrekt.
- Ingen overlay/z-index/focus-bugg blockerar interaktionen.

---

## 4) Budget (toggle Total / User1 / User2)

### 4.1 Spend är korrekt – men budgetbelopp måste följa toggle-läget
**Problem:** När man togglar Total/mig/partner visas spend korrekt, men budgetbeloppet i samma vy är inte justerat → man kan inte se om individen är över/under sin egen budget.

**Mål:** I alla budgetvyer ska både **spend** och **budget** matcha valt läge.

**Regel (exempel som ska stämma i UI):**
- Restaurang:
  - User1 budget: 1000
  - User2 budget: 2000
  - User1 spend: 1500
  - User2 spend: 1000
- Total-läge: 2500 spend / 3000 budget (inom budget)
- User1-läge: 1500 spend / 1000 budget (över budget)
- User2-läge: 1000 spend / 2000 budget (inom budget)

**Klart när:**
- Alla kategori-rader visar rätt “budget tak” beroende på toggle.
- Progressbars/procent räknas korrekt i respektive läge.

---

### 4.2 Inkomst, Budgeterat och Sparkvot ska också påverkas av toggle-läget
**Mål:** När användaren växlar Total/User1/User2 ska även toppsummeringar uppdateras.

**Scope (minst):**
- Inkomst (budgetinkomst)
- Budgeterat (total budget)
- Sparkvot (Actual vs Budget) – per valt läge

**Klart när:**
- Alla dessa värden uppdateras konsekvent när togglen ändras.
- Total-läge visar totalsummor, User-läge visar respektive användares del.

---

## 5) Settings

### 5.1 Fixa 404 för /privacy och /help
**Problem (console):**
- `GET https://stacka-three.vercel.app/privacy?... 404`
- `GET https://stacka-three.vercel.app/help?... 404`

**Mål:** Länkarna i Settings ska inte ge 404.

**Åtgärd:**
- Skapa routes/pages för `/privacy` och `/help` (eller uppdatera länkarna till korrekta routes om de ska heta något annat).

**Klart när:**
- Settings-sidan kan öppna Privacy och Help utan 404 i console.
- Sidorna renderar innehåll (även placeholder duger initialt).

---

## 6) UI/UX (Dark mode)

### 6.1 Fix: vissa fält har ljus bakgrund i dark mode → text blir oläslig
**Problem:** Fortfarande inputs/ytor som får ljus bakgrund i dark mode, vilket gör att texten inte syns (se bifogade screenshots).

**Mål:** Alla inputs/containers följer dark theme tokens konsekvent.

**Klart när:**
- Inga inputfält eller dropdowns har “vit/ljus” bakgrund i dark mode om inte designen uttryckligen kräver det.
- Text/placeholder/values har tillräcklig kontrast i dark mode.
- Gäller särskilt:
  - dropdowns (kategori)
  - datum/datepicker
  - kreditkortshanterare / CCM-input (enligt bild)

---
