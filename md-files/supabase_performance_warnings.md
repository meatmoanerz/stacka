# Supabase Performance Warnings - Sammanfattning

## Översikt
Du har två typer av performance-varningar från Supabase Database Linter:
1. **Auth RLS InitPlan** (103 varningar)
2. **Multiple Permissive Policies** (73 varningar)

## 1. Auth RLS InitPlan - HÖGSTA PRIORITET ⚠️

### Problem
RLS-policies re-evaluerar `auth.<function>()` och `current_setting()` för **varje rad** i tabellen istället för en gång per query. Detta ger suboptimal prestanda när tabellerna växer.

### Påverkade Tabeller (alla tabeller i databasen)
- budget_items
- budgets  
- savings_goal_contributions
- partner_connections
- ccm_invoices
- loan_groups
- budget_item_assignments
- profiles
- recurring_expenses
- loans
- loan_interest_history
- expenses
- statement_analyses
- statement_transactions
- incomes
- categories
- custom_goal_types
- monthly_incomes
- savings_goals

### Lösning
Ändra från:
```sql
-- FÖRE (dålig prestanda)
CREATE POLICY "Users can view own budget items" 
ON budget_items FOR SELECT 
USING (user_id = auth.uid());
```

Till:
```sql
-- EFTER (bra prestanda)
CREATE POLICY "Users can view own budget items" 
ON budget_items FOR SELECT 
USING (user_id = (SELECT auth.uid()));
```

### Varför detta är viktigt
- Vid 1000 rader: funktionen körs 1000 gånger utan subquery, 1 gång med subquery
- Direkt påverkan på query-prestanda när data växer
- Enkel fix med stor effekt

### Rekommenderad åtgärd
**Kör ett migrations-script** som uppdaterar alla RLS-policies:
1. Lista alla policies på dina tabeller
2. Ersätt `auth.uid()` med `(SELECT auth.uid())`
3. Ersätt `auth.email()` med `(SELECT auth.email())`
4. Ersätt andra `auth.*` funktioner på samma sätt

---

## 2. Multiple Permissive Policies - MEDELHÖG PRIORITET 📊

### Problem
Flera permissiva policies för samma roll och action betyder att **alla policies körs** för varje query, även om första policyn redan gav access.

### Mest påverkade tabeller

#### Loans (8 dubbletter per role)
```
authenticated: SELECT, INSERT, UPDATE, DELETE har flera policies
anon: SELECT, UPDATE, DELETE har flera policies
```
Exempel på duplicerade policies:
- "Allow authenticated to manage loans"
- "Users can manage own loans"  
- "Partners can view shared loans"

#### Budget Items (4 dubbletter)
```
authenticated: SELECT, INSERT, UPDATE, DELETE
```
Policies som överlappar:
- "Allow authenticated to manage budget_items"
- "Users can manage budget items"
- "Users can view own budget items"
- "Users can view partner budget items"

#### Statement Analyses, Loan Groups, Categories, m.fl.
Liknande mönster med överlappande policies

### Lösning
Konsolidera policies genom att kombinera logiken:

```sql
-- FÖRE (flera policies)
CREATE POLICY "Users can view own loans" ON loans FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Partners can view shared loans" ON loans FOR SELECT  
USING (user_id IN (SELECT partner_id FROM partner_connections WHERE user_id = auth.uid()));

-- EFTER (en kombinerad policy)
CREATE POLICY "Users can view accessible loans" ON loans FOR SELECT
USING (
  user_id = (SELECT auth.uid()) 
  OR user_id IN (
    SELECT partner_id FROM partner_connections 
    WHERE user_id = (SELECT auth.uid()) AND status = 'accepted'
  )
);
```

### Varför detta är viktigt
- Varje extra policy = en extra query execution
- Blir särskilt märkbart på stora dataset
- Gör policies mer läsbara och underhållbara

### Rekommenderad åtgärd
**Granska och konsolidera policies tabell för tabell:**
1. Börja med mest använda tabeller (loans, expenses, budgets)
2. Kombinera policies med samma action
3. Testa noggrant att access-reglerna fortfarande fungerar

---

## Prioriterad Åtgärdsplan

### Fas 1 - Quick Wins (Högsta ROI)
1. ✅ Fixa Auth RLS InitPlan på mest använda tabeller:
   - expenses
   - budgets
   - budget_items
   - loans
   - incomes

### Fas 2 - Full Implementation  
2. ✅ Fixa Auth RLS InitPlan på alla återstående tabeller
3. ✅ Konsolidera Multiple Permissive Policies på huvudtabeller

### Fas 3 - Optimering
4. ✅ Review och konsolidera alla policies
5. ✅ Lägg till indexes där det behövs (kolla query performance)

---

## Exempel Migration Script

```sql
-- Exempel: Uppdatera expenses-policies
BEGIN;

-- Ta bort gamla policies
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can view partner expenses" ON expenses;
DROP POLICY IF EXISTS "Allow authenticated to read own expenses" ON expenses;

-- Skapa ny konsoliderad policy med SELECT subquery
CREATE POLICY "Users can view accessible expenses" 
ON expenses FOR SELECT
USING (
  user_id = (SELECT auth.uid())
  OR user_id IN (
    SELECT partner_id FROM partner_connections 
    WHERE user_id = (SELECT auth.uid()) 
    AND status = 'accepted'
  )
);

-- Samma för INSERT
DROP POLICY IF EXISTS "Users can create own expenses" ON expenses;
DROP POLICY IF EXISTS "Allow authenticated to insert own expenses" ON expenses;

CREATE POLICY "Users can create expenses"
ON expenses FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

-- etc för UPDATE och DELETE...

COMMIT;
```

---

## Sammanfattning

**Rekommendation:** Börja med Auth RLS InitPlan-fixen först då den:
- Påverkar alla queries på alla tabeller
- Är enklare att implementera (mekanisk ersättning)
- Ger större performance-vinst per arbetsinsats

Multiple Permissive Policies kan åtgärdas successivt per tabell när du ändå uppdaterar RLS-policies.

**Estimerad tidsåtgång:**
- Auth RLS InitPlan fix: 2-4 timmar (alla tabeller)
- Multiple Permissive Policies: 4-8 timmar (alla tabeller)
- Totalt: 1-2 dagars arbete för komplett åtgärd

**Förväntad förbättring:**
- 30-70% snabbare queries på stora dataset (>10k rows)
- Lägre database CPU-användning
- Bättre skalbarhet över tid
