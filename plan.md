# Projektbudget (Temporary Budget) - Implementation Plan

## Overview
Add a "Project Budget" feature to Stacka that lets users create time-limited budgets for specific projects (trips, renovations, events, etc.) with their own categories and expense tracking — separate from the existing monthly budget system.

---

## Phase 1: Database Schema

### New table: `temporary_budgets`
```sql
CREATE TABLE temporary_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  partner_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,                          -- "Thailand-resa", "Kök renovering"
  description TEXT,                            -- Optional description
  total_budget NUMERIC NOT NULL DEFAULT 0,     -- Total budget amount (SEK)
  total_spent NUMERIC NOT NULL DEFAULT 0,      -- Cached total spent
  currency TEXT NOT NULL DEFAULT 'SEK',        -- Display currency (SEK, EUR, USD, THB, etc.)
  exchange_rate NUMERIC DEFAULT 1,             -- Rate to convert from currency to SEK
  start_date DATE NOT NULL,                    -- Project start date
  end_date DATE NOT NULL,                      -- Project end date
  linked_budget_period TEXT,                    -- Optional: YYYY-MM period to pull from monthly budget (NULL = no link)
  status TEXT NOT NULL DEFAULT 'active',        -- 'active' | 'completed' | 'archived'
  is_shared BOOLEAN DEFAULT false,             -- Shared with partner
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### New table: `temporary_budget_categories`
```sql
CREATE TABLE temporary_budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temporary_budget_id UUID NOT NULL REFERENCES temporary_budgets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                          -- "Flyg", "Hotell", "Mat", etc.
  budgeted_amount NUMERIC NOT NULL DEFAULT 0,  -- Amount allocated to this category
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Modify `expenses` table
```sql
ALTER TABLE expenses
  ADD COLUMN temporary_budget_id UUID REFERENCES temporary_budgets(id),
  ADD COLUMN temporary_budget_category_id UUID REFERENCES temporary_budget_categories(id),
  ADD COLUMN original_currency TEXT,           -- Original currency code if different from SEK
  ADD COLUMN original_amount NUMERIC;          -- Original amount before conversion
```

### RLS Policies
- Same pattern as budgets: user can see own + partner's temporary budgets
- Expenses with `temporary_budget_id` follow same RLS as regular expenses

### Migration file
- `20240101000021_temporary_budgets.sql`

---

## Phase 2: Types & Hooks

### Types (`src/types/index.ts`)
```typescript
export type TemporaryBudget = Tables<'temporary_budgets'>
export type TemporaryBudgetCategory = Tables<'temporary_budget_categories'>

export interface TemporaryBudgetWithCategories extends TemporaryBudget {
  temporary_budget_categories: TemporaryBudgetCategory[]
}

export interface TemporaryBudgetWithExpenses extends TemporaryBudgetWithCategories {
  expenses: ExpenseWithCategory[]
}
```

### Hook: `src/hooks/use-temporary-budgets.ts`
- `useTemporaryBudgets()` — List all active temporary budgets
- `useTemporaryBudget(id)` — Single budget with categories + expenses
- `useArchivedTemporaryBudgets()` — For archive page
- `useCreateTemporaryBudget()` — Create with categories
- `useUpdateTemporaryBudget()` — Update settings/amounts
- `useDeleteTemporaryBudget()` — Hard delete
- `useArchiveTemporaryBudget()` — Soft archive (set status='archived')
- `useTemporaryBudgetCategories(budgetId)` — CRUD for categories
- `useCreateTemporaryBudgetCategory()`
- `useUpdateTemporaryBudgetCategory()`
- `useDeleteTemporaryBudgetCategory()`

### Query keys
```typescript
['temporary-budgets']                    // All active
['temporary-budgets', 'archived']        // Archived ones
['temporary-budget', id]                 // Single with categories
['temporary-budget', id, 'expenses']     // Expenses for a budget
```

---

## Phase 3: Currency Support (Lightweight)

### Approach
- Use a static list of common currencies with manually maintained rates (no external API)
- User selects currency when creating project budget
- Exchange rate is stored at creation time and can be manually adjusted
- All amounts in DB remain in SEK (converted on input)
- When adding expense to a project budget with foreign currency:
  - Show input in foreign currency
  - Auto-convert to SEK using stored rate
  - Store both `original_amount`/`original_currency` and `amount` (SEK)
- Display shows both: "500 THB (65 kr)"

### Static currency data (`src/lib/utils/currencies.ts`)
```typescript
export const CURRENCIES = [
  { code: 'SEK', name: 'Svensk krona', symbol: 'kr', defaultRate: 1 },
  { code: 'EUR', name: 'Euro', symbol: '€', defaultRate: 11.5 },
  { code: 'USD', name: 'US Dollar', symbol: '$', defaultRate: 10.5 },
  { code: 'GBP', name: 'Brittiskt pund', symbol: '£', defaultRate: 13.5 },
  { code: 'NOK', name: 'Norsk krona', symbol: 'kr', defaultRate: 1.0 },
  { code: 'DKK', name: 'Dansk krona', symbol: 'kr', defaultRate: 1.55 },
  { code: 'THB', name: 'Thailändsk baht', symbol: '฿', defaultRate: 0.31 },
  // etc.
]
```

Users can manually adjust the exchange rate in project budget settings after creation. No API calls needed — keeps it simple and fast.

---

## Phase 4: UI Components

### 4a. Budget List Page Update (`src/app/(app)/budget/page.tsx`)

Modify existing budget list page to show both monthly and project budgets:

- Add a section **"Projektbudgetar"** below the monthly budget list
- Each project budget card shows:
  - Name + date range
  - Progress bar (spent/total)
  - Currency indicator if non-SEK
  - Days remaining
- "Ny projektbudget" button
- "Arkiv" link button at bottom of page → `/budget/archive`

### 4b. New Project Budget Form (`src/components/budget/temporary-budget-form.tsx`)

Create form page at `/budget/project/new`:

**Step 1 — Basic Info:**
- Name (text input)
- Description (optional)
- Start date & End date (date pickers)
- Total budget amount
- Currency selector (dropdown, default SEK)
  - If non-SEK selected: show exchange rate field (editable, pre-filled with default)
- Shared with partner toggle (if partner exists)

**Step 2 — Categories:**
- Dynamic list where user adds categories
- Each has: name + budgeted amount (in selected currency, converted to SEK)
- Quick-add common templates: "Flyg", "Hotell", "Mat", "Transport", "Aktiviteter", "Shopping"
- Sum validation: categories total vs. budget total (warning if mismatch, not blocking)

**Step 3 — Monthly Budget Link:**
- Toggle: "Allokera från månadsbudget?"
- If yes: select which budget period(s) the project spans
- Show warning if no: "Denna projektbudget påverkar inte din månadsbudget. Utgifter räknas separat."
- Can be changed later in project budget settings

### 4c. Project Budget Detail Page (`src/app/(app)/budget/project/[id]/page.tsx`)

**Header:**
- Project name + date range
- Status badge (active/completed)
- Settings gear icon → opens settings dialog
- Back button

**Overview Card** (same style as monthly budget detail):
- Total spent / Total budget
- Progress bar
- Days remaining / Days elapsed
- Daily budget suggestion (remaining ÷ remaining days)

**Pro-rata Distribution** (if linked to monthly budget):
- Show how much is allocated per budget period
- Based on: `(total_budget ÷ total_days) × days_in_period`

**Categories Section:**
- List of project categories with progress bars
- Each shows: spent / budgeted
- Tap to drill down → shows expenses in that category
- Unbudgeted spending highlighted

**Recent Expenses:**
- Last 5 expenses in this project
- Tap to edit (reuses existing ExpenseEditDialog)

**Quick Add Expense button** (floating or in header)

### 4d. Project Budget Settings Dialog

Accessible from detail page gear icon:
- Edit name, description
- Edit dates
- Edit total budget
- Edit currency & exchange rate
- Toggle monthly budget link + period selection
- Mark as completed
- Archive / Delete

### 4e. Adding Expenses to Project Budget

**Two ways to add expenses:**

1. **From project budget detail page** — "Add expense" button
   - Opens expense form with project budget pre-selected
   - Category dropdown shows project budget categories (not regular categories)
   - If foreign currency: amount input in project currency, shows SEK conversion below
   - Date, description, cost assignment all work same as regular expenses

2. **From regular expense edit** — moving expense to project
   - In ExpenseEditDialog: add a new section "Projektbudget"
   - Dropdown showing active project budgets
   - When selected: shows project categories to pick from
   - Saves `temporary_budget_id` + `temporary_budget_category_id` on expense

### 4f. Archive Page (`src/app/(app)/budget/archive/page.tsx`)

- Lists all archived budgets (both monthly and project)
- Tab/segment control: "Månadsbudgetar" | "Projektbudgetar"
- Each shows basic info (period/name, total, date range)
- Tap to view (read-only detail)
- Restore option (unarchive)

---

## Phase 5: Monthly Budget Integration

### When project budget IS linked to a monthly budget period:
- Show project budget allocation in the monthly budget detail page as an info card
- Pro-rata calculation: `daily_rate = total_budget ÷ total_days`
- Per-period amount: `daily_rate × days_in_period`
- This is **display-only** — doesn't modify budget_items in monthly budget
- Monthly budget detail page shows: "Projektbudget: Thailand-resa — 8 500 kr allokerat denna period"

### When project budget is NOT linked:
- Show warning once during creation
- Expenses in project budget are NOT counted in monthly budget calculations
- No interaction between the two systems

### Existing monthly budget modifications:
- `useBudgets()` hook: add filter to exclude archived budgets from main list
- Add `useArchivedBudgets()` for archive page
- Budget list page: add "Archive" action to each budget card's detail page
- Add `is_archived` column to `budgets` table (default false)

---

## Phase 6: Translations

Add keys to both `sv.json` and `en.json` for all new strings:
- `projectBudget.title`, `projectBudget.create`, `projectBudget.categories`, etc.
- `archive.title`, `archive.monthly`, `archive.project`, `archive.restore`, etc.
- `currency.select`, `currency.exchangeRate`, `currency.converted`, etc.

---

## File Structure Summary

### New files:
```
src/hooks/use-temporary-budgets.ts
src/lib/utils/currencies.ts
src/components/budget/temporary-budget-form.tsx
src/components/budget/temporary-budget-card.tsx
src/components/budget/temporary-budget-detail.tsx
src/components/budget/temporary-budget-settings-dialog.tsx
src/components/budget/temporary-budget-expense-form.tsx
src/components/budget/temporary-budget-skeleton.tsx
src/components/budget/archive-list.tsx
src/app/(app)/budget/project/new/page.tsx
src/app/(app)/budget/project/[id]/page.tsx
src/app/(app)/budget/project/[id]/edit/page.tsx
src/app/(app)/budget/archive/page.tsx
supabase/migrations/20240101000021_temporary_budgets.sql
```

### Modified files:
```
src/types/database.ts          — Add new table types
src/types/index.ts             — Add new type exports
src/app/(app)/budget/page.tsx  — Add project budget section + archive link
src/app/(app)/budget/[id]/page.tsx — Add archive action + project budget info card
src/components/expenses/expense-edit-dialog.tsx — Add project budget assignment
src/hooks/use-budgets.ts       — Add archive support for monthly budgets
messages/sv.json               — Swedish translations
messages/en.json               — English translations
```

---

## Implementation Order

1. Database migration (tables + RLS + columns)
2. Update `database.ts` types (regenerate or manual)
3. Currency utilities
4. Temporary budget hooks
5. Temporary budget form (create)
6. Budget list page (add project section + archive link)
7. Project budget detail page
8. Project budget settings dialog
9. Project budget expense form
10. Expense edit dialog (add project assignment)
11. Archive page
12. Monthly budget link display
13. Translations
14. Monthly budget archive support (`is_archived` on budgets table)

---

## UX Principles
- **Mobile-first**: All new UI designed for mobile, same style as existing app
- **Consistent**: Use same Card, Progress, motion patterns as monthly budget
- **Color**: Project budgets use `stacka-mint` as accent color (differentiates from olive monthly budgets)
- **Animations**: Same framer-motion patterns (fade in, slide up)
- **Simple**: Currency conversion is optional and unobtrusive
- **Progressive**: Start simple, add complexity only when user enables features (currency, monthly link)
