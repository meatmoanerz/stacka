# Stacka – To do (fixar & uppdateringar)

Den här listan beskriver planerade fixar och uppdateringar i **Stacka**. Varje punkt är formulerad med tydligt **mål**, önskat **beteende** och **klart när** (acceptance criteria).

---

## 1) Utgifter

### 1.1 Redigera befintlig utgift (tap → edit view)
**Mål:** Användaren ska kunna öppna en registrerad utgift och redigera dess värden.

**Beteende:**
- Klick på en utgift i listan öppnar en “Edit expense”-vy.
- Vyn är förifylld med befintliga värden (belopp, datum, kategori, konto, kommentar osv).
- **Spara** uppdaterar posten.
- **Avbryt/back** lämnar utan att spara.

**Klart när:**
- Det går att uppdatera alla relevanta fält för en utgift.
- Listan och summeringar uppdateras direkt efter sparning.
- Inga dubbla poster skapas (uppdatering, inte ny insert).


### 1.2 Ny layout för “Lägg till utgift” utan scroll (test i ny sandbox-route)
**Mål:** Testa en mer kompakt layout där hela formuläret får plats utan scroll för bättre användarvänlighet.

**Krav/önskemål:**
- Behåll den snygga känslan men gör inputs mer kompakta (t.ex. beloppet mindre).
- Var kreativ: grupperingar, två-kolumnslayout, chips/radioknappar, collapse/accordion etc.
- **Viktigt:** Implementera detta i en **ny sandbox-sökväg/route** så nuvarande sida kan behållas oförändrad.

**Klart när:**
- Det finns en separat route som visar “compact add expense”-layouten.
- Den går att testa sida vid sida mot nuvarande implementation.
- Formuläret är fullt funktionellt även i testläget.

---

## 2) UI/UX

### 2.1 Förbättra läsbarhet i dark mode för inputfält
**Problem:** Input-texten är mörk på mörk bakgrund (dålig kontrast) i dark mode.

**Mål:** Text, placeholder och ev. label ska vara tydligt läsbara i dark mode.

**Klart när:**
- Input-texten har korrekt färg/kontrast i dark mode.
- Placeholder/labels är också tydliga (inte “för svaga”).
- Gäller konsekvent i hela appen (inte bara en vy).

---

## 3) Dashboard

### 3.1 Korrekt beräkning av “dagar till lön” med helgjustering
**Problem:** Lön räknas mot 25:e även när 25:e är helg. Ex: **23 jan** visas “2 dagar kvar” men om **25:e är söndag** ska lönedagen bli **vardagen innan (23 jan)** → alltså **0 dagar kvar**.

**Mål:** Beräkningen ska utgå från faktisk lönedag:
- Standard: 25:e
- Om 25:e infaller på helg → flytta till närmast föregående vardag (fre).

**Klart när:**
- 23 jan (när 25:e är söndag) ger 0 dagar kvar.
- Logiken fungerar för alla månader och alla helgutfall.


### 3.2 Roligare copy när det är löning
**Mål:** När dagar till lön = 0 ska UI visa en glad status istället för “0 dagar”.

**Beteende:**
- Om “dagar kvar” == 0 → visa text: **“Löning! 🥳”**

**Klart när:**
- Texten visas på rätt dag enligt helgjusterad lönelogik.


### 3.3 Period/aktuell månad ska följa lönelogiken (periodskifte)
**Problem:** Lönedagslogiken påverkar även period. När lönedagen blir **23 jan** ska nästa period (februari) börja då, men appen visar fortfarande januari i flera vyer.

**Mål:** “Aktuell period” ska baseras på samma logik som lönedagen, och uppdateras konsekvent överallt.

**Klart när:**
- Periodnamn/datumintervall uppdateras korrekt på dashboard och övriga ställen där period visas.
- Byter period när den “faktiska lönedagen” inträffar.


### 3.4 “Kvar att spendera” ska baseras på budgetinkomst – faktiskt förbrukat
**Mål:** Kvar att spendera ska vara korrekt kopplat till månadens budget.

**Definition:**
- **Kvar att spendera = Inkomst (från månadens budget) – faktiskt förbrukat**

**Klart när:**
- Värdet matchar budgetens inkomst och summeringen av verkliga utgifter/”förbrukat”.
- Uppdateras direkt när nya utgifter registreras eller ändras.

---

## 4) Lån

### 4.1 Val av amorteringsmodell: fast belopp eller procent
**Mål:** Vid skapande av lån ska användaren kunna välja amorteringstyp.

**Beteende:**
- Alternativ A: **Fast summa per månad**
- Alternativ B: **Procentuell amortering** (procent av valt underlag enligt din modell)

**Klart när:**
- UI stödjer valet och visar rätt inputfält.
- Sparad data räcker för att beräkna amortering per månad.


### 4.2 “Typ av lån” spinner – går inte att spara
**Problem:** När man lägger till “typ av lån” står den och laddar/spinner och går inte att spara.

**Mål:** Typ-fältet ska fungera: ladda data, välja, spara.

**Klart när:**
- Dropdown/lista laddar korrekt.
- Man kan välja typ och spara lån utan att fastna.


### 4.3 Rensa duplicates i “Typ av lån”
**Problem:** Det finns många dubbletter i listan för “typ av lån”. Det ska bara finnas en av varje.

**Mål:** Typ-listan ska vara unik och ren.

**Beteende:**
- Samma typ ska inte kunna visas flera gånger i dropdown/lista.
- Om duplicates finns i datan: dedupe i queryn och/eller normalisera datat.

**Klart när:**
- Varje låntyp visas exakt en gång.
- Nya lån skapar inte fler dubbletter av samma typ.


### 4.4 Collapsa lån per låntyp + visa key metrics i collapsed state
**Mål:** Lån-listan ska bli mer överskådlig genom att grupperas per låntyp och kunna expand/collapse.

**Beteende:**
- Lånen grupperas per **Typ av lån**.
- Varje grupp kan **collapsas/expanderas**.
- I collapsed-läget visas key metrics per typ:

**Key metrics per låntyp (collapsed summary):**
- **Totalt lånebelopp**
- **Snittränta** (helst viktad)
- **Total månadsamortering**
- **Total månadsränta**
- **Total månadsbetalning** (amortering + ränta)

**Klart när:**
- Listan blir kort och lätt att skumma.
- Expand visar underliggande lån för typen.
- Summeringar stämmer och uppdateras vid ändringar.


### 4.5 Flagga: “Lägg automatiskt till i budget”
**Mål:** Lån ska kunna markeras för att auto-populera budgetposter.

**Beteende:**
- Toggle/checkbox på lånet: **“lägg automatiskt till i budget”**
- Om aktiverad: när ny budget skapas ska:
  - **räntekostnad** och **amortering** fyllas i automatiskt i budgetens inputfält (men vara redigerbara).

**Klart när:**
- Flaggan sparas på lånet.
- Ny budget hämtar dessa värden och fyller i dem.


### 4.6 Bug: “Belopp kvar” sätts till 1 kr vid nytt lån
**Problem:** När ett nytt lån skapas registreras det som att **1 kr kvar** att betala, så man måste manuellt gå in och korrigera.

**Mål:** “Belopp kvar” ska sättas korrekt direkt vid skapande.

**Beteende:**
- Default: **belopp kvar = ursprungligt lånebelopp** (om ingen annan logik finns).

**Klart när:**
- Nya lån får rätt “kvar att betala” utan manuell edit.
- Inga lån får 1 kr kvar om inte användaren uttryckligen anger det.

---

## 5) Budget

### 5.1 Auto-populera budgetinputs från andra tabeller (men redigerbart)
**Mål:** När användaren skapar ny budget ska appen automatiskt fylla i vissa budgetrader så man slipper manuellt tänka belopp.

**Ska hämtas in:**
- **Kreditkort**
- **Sparandekategorier** med aktivt **månadssparande**
- **Lån** med “auto till budget” aktiverat

**Krav:**
- Värdena fylls automatiskt in i inputfälten.
- De är **redigerbara** (användaren kan korrigera).

**Klart när:**
- Ny budget-vyn är förifylld varje gång med aktuella värden från dessa källor.
- Användaren kan ändra och spara utan att auto-logiken “skriver över” manuella ändringar i samma session.


### 5.2 CCM räknas fel i “kvar totalt”
**Problem:** CCM påverkar “kvar totalt” trots att UI säger att CCM inte ska vara inräknat. Om man markerar en post med CCM så påverkar totalen.

**Mål:** Logiken ska matcha copy:
- CCM ska **inte** räknas med i “kvar totalt” (om det är den tänkta regeln).

**Klart när:**
- CCM-flaggen påverkar inte “kvar totalt” (enligt spec).
- UI-text och beräkningslogik är konsekventa.


### 5.3 Fel belopp i “förbrukat” jämfört med sparade utgifter
**Problem:** “Förbrukat” matchar inte summan av registrerade utgifter.

**Mål:** “Förbrukat” ska summera korrekt baserat på sparade utgifter i aktuell period.

**Klart när:**
- Förbrukat = exakt summa av relevanta utgifter (enligt period, ev. filterregler som CCM).
- Uppdateras när utgifter läggs till/redigeras.


### 5.4 Spara-knapp + bottom navbar ska vara “sticky” när tangentbord öppnas
**Problem:** Spara-knapp och bottom navbar flyttar upp sig när tangentbordet öppnas och känns inte “fast i botten”.

**Mål:** Stabil layout på mobila enheter när man skriver i inputfält.

**Klart när:**
- Spara-knappen ligger kvar där den ska (enligt din designstandard) även när keyboard öppnas.
- Bottom navbar beter sig konsekvent (ingen “hoppa runt”-känsla).


### 5.5 Ny budget ska använda faktisk månadsinkomst – inte “månadslön”
**Problem:** Ny budget hämtar inkomst från “månadslön” men inkomsten kan variera månad för månad. Budget ska baseras på den **faktiskt sparade månadsinkomsten** som användaren registrerar varje månad.

**Mål:** Vid skapande av ny budget:
- Inkomst ska hämtas från tabellen/registreringen för **månadens faktiska inkomst** (inte statisk månadslön).

**Klart när:**
- Skapar man ny budget för en månad används den månadsinkomst användaren sparat för just den månaden.
- Om månadsinkomst saknas: appen har definierat fallback (t.ex. tomt, varning, eller default).
