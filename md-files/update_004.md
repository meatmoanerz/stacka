# Stacka – Spec: “Kvar att spendera” (Budget vs kreditkort / kassaflöde)

Den här filen beskriver en uppdaterad och tydlig logik för vad som ska visas på **Dashboard** och **Budget-sidan** när kreditkort används (kostnader realiseras i kassaflödet månaden efter).  
Claude har tillgång till koden och kan implementera detta på bästa sätt, men **målet och definitionerna nedan ska följas**.

---

## Bakgrund & mål

I Stacka finns kreditkortskostnader som påverkar **kassaflöde månaden efter** (när fakturan betalas), men budgeten styr användarbeteende **i den period man spenderar**.

Vi har redan logik i budgetskapandet som säkerställer att användaren “överlever” kassaflödesmässigt (dvs. budgeten byggs utifrån inkomster och utbetalningar som inte går via kreditkort, så att kreditkortet inte dubbelräknas).

**Det som ska uppdateras nu** är hur appen visar “Kvar att spendera” i:
- Dashboard
- Budget-sidan / budgetöversikt

---

## 1) Princip: “Kvar att spendera” ska vara budget-baserat (totalen)

### 1.1 Varför
Eftersom användaren skapar en budget som redan tar hänsyn till kassaflödet, är det mest korrekt och användbart att följa **budgetens kvarvarande utrymme** (inte “likviditet kvar” eller “kassaflöde kvar”) när man fattar vardagsbeslut.

### 1.2 Definition (måttet vi vill visa)
**Kvar att spendera (Budget)** ska vara defaultmåttet i både Dashboard och Budget-sidan.

**Definition:**
- `BudgetTotal = summa av alla budgetposter för perioden (alla kategorier)`  
- `SpentTotal = faktisk spendering för perioden, beräknad enligt appens budgetlogik (inkl. kreditkortsutgifter i spenderingsmånaden, utan dubbelräkning av kreditkortsfaktura)`  
- `RemainingBudget = BudgetTotal - SpentTotal`

**Viktigt:**  
- Detta är **Total budget kvar** (alla kategorier), inte bara “rörliga”.
- Kreditkortets “fördröjning” ska **inte** göra att budgetkvar blir “fel” – spenderingen ska kopplas till rätt period.

---

## 2) UI: Dashboard

### 2.1 KPI “Kvar att spendera” (huvudvärde)
**Ändring:**
- KPI-kortet “Kvar att spendera” ska visa `RemainingBudget` (budgetbaserat), inte något kassaflödesbaserat mått.

**Klart när:**
- “Kvar att spendera” på dashboard matchar `BudgetTotal - SpentTotal`.
- Värdet är stabilt även om kreditkort används (ingen dubbelräkning).

### 2.2 Behåll KPI/skillnad mellan Inkomst och Budgeterat
Användaren vill fortfarande se korten för:
- **Inkomst** (budgetperiodens inkomster / det värde som används i budgeten)
- **Budgeterat** (summa budgetposter och/eller BudgetTotal)

**Notering:**
- Dessa kort kan tydligt visa skillnaden mellan inkomster och budgetplan, men “Kvar att spendera” ska styras av budgeten (se 2.1).

**Klart när:**
- Dashboard visar Inkomst och Budgeterat som informativa siffror.
- “Kvar att spendera” är konsekvent budgetbaserat.

---

## 3) UI: Budget-sidan

### 3.1 Samma “Kvar att spendera”-logik som på Dashboard
**Ändring:**
- På budgetsidan ska “Kvar att spendera” också vara `RemainingBudget` (budgetbaserat, totalen).

**Klart när:**
- Budget-sidans “Kvar att spendera” matchar dashboarden för samma period.
- Det är samma definition (BudgetTotal - SpentTotal).

### 3.2 Behåll “Inkomst” och “Budgeterat” som separata kort
Användaren vill behålla korten för:
- Inkomst
- Budgeterat

Men:
- “Kvar att spendera” ska vara budgetbaserat.

**Klart när:**
- Inkomst och Budgeterat visas kvar som idag (eller förbättrat).
- “Kvar att spendera” följer spec (3.1).

---

## 4) Kreditkort – kravet i logiken (för att undvika dubbelräkning)

Vi utgår från att ni redan har fixat budgetskapandet så att kreditkort inte dubbelräknas.  
Den här specen kräver att “SpentTotal” fortsätter använda den logiken.

**Krav:**
- `SpentTotal` ska representera faktisk spendering i perioden, inklusive utgifter som betalats med kreditkort i perioden.
- Kreditkortsfakturan (när den betalas månaden efter) ska inte göra att samma köp räknas en gång till.

**Klart när:**
- Om användaren spenderar 1 000 kr på kreditkort i februari:
  - SpentTotal för februari ökar med 1 000 kr.
  - När fakturan betalas i mars ska detta inte öka SpentTotal för mars med samma 1 000 kr igen (om ni bokför fakturan som kassaflöde/överföring/ccm-händelse).

---

## 5) Acceptance checklist (snabbtest)

För en given period:
1) `RemainingBudget = BudgetTotal - SpentTotal` (Dashboard och Budget-sida visar samma).
2) Kreditkortsinköp påverkar SpentTotal i inköpsmånaden.
3) Kreditkortsfakturan månaden efter påverkar inte SpentTotal som “utgift” som dubblar inköpet.
4) Inkomst och Budgeterat visas fortsatt som separata informativa siffror (ingen toggle behövs för kassaflöde).

---

## Kort instruktion till Claude (implementation)
- Leta efter var “Kvar att spendera” beräknas idag på dashboard + budget-sida.
- Säkerställ att den funktionen använder **BudgetTotal** och **SpentTotal (budgetlogik)**, inte “cash left”.
- Återanvänd gärna en gemensam selector/helper så att dashboard och budget-sida alltid visar samma värde.

