# 2025-02-08__budget-och-expenses-fix.md

## Metadata
- **Datum**: 2025-02-08
- **Version**: v1
- **Status**: Ready for implementation

---

## Sammanfattning

Två ändringar ska göras:

### 1. Budgetkategorivy - visa ej-budgeterade kategorier i huvudlistan

**Problem nu:**
Kategorier med utgifter men utan budget visas i separat sammanställning längst ner.

**Ändring:**
- Alla kategorier med utgifter ska visas i samma lista som budgeterade kategorier
- Ej-budgeterade kategorier behandlas som budget = 0 kr
- Visas som: "Resor 3000 kr / 0 kr" (samma visuell stil som överbudget)
- Sorteras tillsammans med övriga kategorier enligt befintlig sortering
- Separat sammanställning längst ner tas bort helt

**Visningsregel:**
- Visa kategori OM: `budget > 0` ELLER `utgifter > 0`
- Dölj kategori OM: `budget = 0` OCH `utgifter = 0`

**Dynamiskt:**
- Lägg till utgift på dold kategori → kategorin dyker upp
- Radera sista utgiften från ej-budgeterad kategori → kategorin försvinner

---

### 2. Expenses-lista - visa totalbelopp istället för användarens andel

**Problem nu:**
I "senaste"-listan på expenses-sidan visas användarens andel av delade utgifter (ex: 2000 kr av 4000 kr).

**Ändring:**
- Visa alltid totala utgiftsbeloppet (4000 kr)
- Oavsett om utgiften är delad eller inte
- Delningsikon finns redan och ska fortsätta visas

---

## Acceptance Criteria

**Budget:**
- [ ] Ej-budgeterade kategorier med utgifter visas i huvudlistan
- [ ] De visas som "X kr / 0 kr" och markeras som överbudget
- [ ] Separat sammanställning är borttagen
- [ ] Kategorier utan budget och utgifter visas inte

**Expenses:**
- [ ] Totalbelopp visas i "senaste"-listan
- [ ] Delade utgifter visar t.ex. "4000 kr" istället för "2000 kr"
- [ ] Delningsikon visas fortfarande
