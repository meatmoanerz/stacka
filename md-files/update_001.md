# Stacka – Nya ändringar (Claude-ready)

Den här filen innehåller **nya** önskade ändringar och bugfixar som ska implementeras i Stacka. Varje punkt är formulerad med **mål**, **beteende/regler** och **klart när**.

---

## 1) Budget

### 1.1 Budget-sidan ska visa total spend (när konton är kopplade)
**Problem:** På budgetsidan visas bara “min” spendering, inte partnerns, trots att budgeten delas när konton är kopplade.

**Mål:**
- På **budgetsidan (översikten)** ska spendering alltid visas som **total spend mot total budget** när konton är kopplade.

**Regler:**
- Total spend = (mina utgifter i perioden) + (partners utgifter i perioden)
- Total budget = budgetens total (delad)

**Klart när:**
- Budgetsidan visar alltid total spend/total budget för delade budgetar.
- Siffran matchar summeringen av utgifter för båda användare i perioden.

---

### 1.2 Toggle i budget-detalj: Total vs Min vs Partner
**Mål:**
- I budget-detaljvyn (där man ser progress per kategori) ska användaren kunna växla mellan olika perspektiv.

**UI/UX:**
- Lägg till en toggle/knapp (t.ex. segmented control) med lägen:
  1) **Total** (total spend mot total budget)
  2) **Min** (min spend mot min del av budgeten)
  3) **Partner** (partners spend mot partners del av budgeten)

**Regler:**
- “Min del av budgeten” och “partners del av budgeten” ska definieras enligt hur ni delar budgeten i appen (t.ex. 50/50 eller annan uppdelning om det finns).
- Växling ska påverka:
  - totalsiffror i toppen
  - kategori-progress (förbrukat per kategori)
  - eventuella KPI/summary på budget-detaljen (om de finns)

**Klart när:**
- Toggle finns i budget-detaljen.
- Alla siffror/progress uppdateras korrekt när man växlar läge.
- Default-läge kan vara **Total**.

---

## 2) Lån

### 2.1 Fixa felmeddelande: “kunde inte skapa utgifter”
**Problem:** När man klickar “registrera månadskostnader” får man meddelande att det inte gick att skapa utgifter.

**Mål:**
- Åtgärda buggen så att funktionen kan skapa utgifter stabilt.

**Klart när:**
- Knappen skapar utgifter enligt spec (ränta + amortering per lån där relevant) utan fel.
- Vid fel: visa ett tydligt felmeddelande med vad som saknas (t.ex. kategori saknas, konto saknas, period saknas).

---

### 2.2 Välj datum för registrerade utgifter (default = 1:a innevarande månad)
**Mål:**
- När användaren skapar utgifter från lån ska de kunna välja vilket datum utgifterna registreras på.

**Beteende:**
- Visa en datumväljare i samband med åtgärden (modal eller inline).
- Defaultdatum ska vara: **den 1:a i innevarande månad**.

**Klart när:**
- Användaren kan välja datum innan skapandet körs.
- Skapade utgifter får exakt det valda datumet.
- Default är korrekt och förifylld.

---

## 3) Gemensamt konto

### 3.1 “Spara som default” för valda kategorier
**Mål:**
- Användaren ska kunna spara sina valda kategorier som standardval som auto-fylls kommande månader.

**Beteende:**
- Lägg till en knapp: **“Spara som default”**
- När man trycker:
  - De valda kategorierna sparas som användarens default.
  - Kommande månader ska dessa kategorier vara förvalda automatiskt.
- Om användaren trycker “Spara som default” en senare månad:
  - Då blir de nya valen default för framtida månader.

**Klart när:**
- Default-valen persisteras (DB/inställningar).
- Nya månader laddar dessa val automatiskt.

---

### 3.2 Tillåt att välja alla kategorier (inte bara fasta kostnader)
**Problem:** Nu kan man bara välja fasta kostnader.

**Mål:**
- I “Gemensamt konto” ska användaren kunna välja **samtliga** kategorier (hela kategorilistan).

**Klart när:**
- Listan innehåller alla kategorier som finns i appen.
- Urval fungerar och påverkar beräkningen korrekt.

---

## 4) Dashboard

### 4.1 Förbrukat KPI ska beräknas korrekt
**Problem:** KPI-värdena går inte ihop (ex: fasta kostnader 7979 kr, förbrukat 3990 kr).

**Mål:**
- Säkerställ att “Förbrukat” KPI beräknas enligt samma regler som budgetens spendering/utgifter.

**Regler:**
- “Förbrukat” ska spegla summeringen av registrerade utgifter i aktuell period (enligt appens perioddefinition).
- Om KPI:er delar upp “fasta kostnader” vs “förbrukat”, måste definitionerna vara konsekventa och transparenta.

**Klart när:**
- KPI:erna är matematiskt konsekventa (summor stämmer med datat).
- Värden matchar utgiftsdata för perioden.

---

### 4.2 Sparkvot: Actual vs Budget (användarvänligt)
**Mål:**
- Uppdatera “sparkvot” KPI så att den visar:
  1) **Actual**: hur mycket man faktiskt har sparat baserat på registrerade utgifter.
  2) **Budget**: vilken sparkvot man “ska” vara på enligt budget (det som visas nu).

**Beteende / UX:**
- Visa “Actual vs Budget” på ett lättläst sätt (t.ex. två rader, två chips, eller en liten jämförelse-widget).
- Actual ska baseras på faktiska utgifter (och inkomster enligt hur du definierar sparkvot i appen).
- Budget ska fortsätta baseras på budgetens planerade sparande.

**Klart när:**
- Dashboard visar både Actual och Budget-sparkvot.
- Actual-värdet uppdateras när användaren registrerar utgifter.
- Layouten är tydlig och inte “plottrig”.

---
