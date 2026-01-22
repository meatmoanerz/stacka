# CLAUDE.md - Stacka Personal Finance App

**AI Assistant Guide for Contributing to Stacka**

This document provides comprehensive guidance for AI assistants working with the Stacka codebase. It covers architecture, conventions, workflows, and critical patterns to follow.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Codebase Structure](#codebase-structure)
4. [Architecture & Patterns](#architecture--patterns)
5. [Database Schema](#database-schema)
6. [State Management](#state-management)
7. [Component Patterns](#component-patterns)
8. [Development Workflows](#development-workflows)
9. [Git Conventions](#git-conventions)
10. [Testing & Deployment](#testing--deployment)
11. [Critical Rules](#critical-rules)

---

## Project Overview

**Stacka** is a personal finance application built with Next.js 16 and React 19 that helps users track expenses, manage budgets, and achieve savings goals. It features partner/household budget management, recurring expenses, credit card tracking (CCM), loan management, and AI-powered bank statement analysis.

**Key Features:**
- Budget management with salary day-based periods
- Expense tracking with cost assignment (personal/shared/partner)
- Partner connection and shared expense tracking
- Real-time synchronization via Supabase
- Credit Card Manager (CCM) with invoice period tracking
- Savings goals with progress tracking
- Loan management with amortization planning
- Internationalization (Swedish/English)

**Production URL:** https://stacka-three.vercel.app

---

## Technology Stack

### Core Framework
- **Next.js 16.1.3** - App Router (not Pages Router)
- **React 19.2.0** - Server Components by default
- **TypeScript 5** - Strict mode enabled

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS with custom theme
- **Radix UI** - Accessible component primitives (dialogs, dropdowns, etc.)
- **Framer Motion 12** - Animations and transitions
- **Lucide React** - Icon library

### State Management
- **TanStack Query 5** (React Query) - Server state management
- **Zustand 5** - Global client state (filters, UI state)
- **React Hook Form 7** - Form state management
- **Zod 4** - Schema validation

### Backend & Data
- **Supabase** - PostgreSQL database with Row Level Security (RLS)
- **@supabase/ssr** - Server-side authentication
- **@supabase/supabase-js** - Client SDK

### Additional Tools
- **date-fns 4** - Date manipulation
- **next-intl** - Internationalization
- **next-themes** - Theme switching
- **papaparse** - CSV parsing
- **recharts** - Charts and visualizations
- **sonner** - Toast notifications
- **OpenAI API** - Statement analysis

---

## Codebase Structure

```
/home/user/stacka/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (app)/                  # Protected routes group
│   │   │   ├── dashboard/          # Main dashboard
│   │   │   ├── budget/             # Budget management
│   │   │   │   ├── new/            # Create budget
│   │   │   │   └── [id]/           # View/Edit budget
│   │   │   ├── expenses/           # Expense tracking
│   │   │   │   └── list/           # Expense list view
│   │   │   ├── savings/            # Savings goals
│   │   │   ├── settings/           # User settings
│   │   │   │   ├── profile/
│   │   │   │   ├── categories/
│   │   │   │   ├── ccm/            # Credit card management
│   │   │   │   ├── loans/
│   │   │   │   └── partner/
│   │   │   └── statement-analyzer/ # Bank statement upload
│   │   ├── (auth)/                 # Auth routes group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── api/                    # API routes
│   │   │   ├── auth/callback/      # OAuth callback
│   │   │   ├── setup-user/         # Initial setup
│   │   │   ├── partner/            # Partner data
│   │   │   ├── household-incomes/  # Combined income
│   │   │   ├── statement/analyze/  # AI analysis
│   │   │   └── cron/process-recurring-expenses/
│   │   ├── onboarding/             # First-time setup
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home (redirects)
│   │   ├── providers.tsx           # Client providers
│   │   └── globals.css             # Global styles
│   ├── components/                 # React components
│   │   ├── budget/                 # Budget components
│   │   ├── dashboard/              # Dashboard widgets
│   │   ├── expenses/               # Expense forms & lists
│   │   ├── loans/                  # Loan management
│   │   ├── savings/                # Savings goal components
│   │   ├── statement/              # Statement analyzer
│   │   ├── layout/                 # App shell components
│   │   │   ├── app-shell.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── bottom-nav.tsx
│   │   ├── shared/                 # Shared utilities
│   │   ├── ui/                     # Radix UI primitives
│   │   └── realtime-provider.tsx   # Supabase realtime
│   ├── hooks/                      # Custom React hooks
│   │   ├── use-budgets.ts
│   │   ├── use-categories.ts
│   │   ├── use-expenses.ts
│   │   ├── use-expenses-realtime.ts
│   │   ├── use-incomes.ts
│   │   ├── use-loans.ts
│   │   ├── use-loan-groups.ts
│   │   ├── use-recurring-expenses.ts
│   │   ├── use-recurring-expenses-realtime.ts
│   │   ├── use-savings-goals.ts
│   │   ├── use-statement-analyzer.ts
│   │   ├── use-user.ts
│   │   └── use-ccm-invoices.ts
│   ├── lib/                        # Utilities & helpers
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser client
│   │   │   ├── server.ts           # Server client
│   │   │   └── middleware.ts       # Auth middleware
│   │   ├── statement/
│   │   │   └── bank-configs.ts     # Bank parser configs
│   │   └── utils/
│   │       ├── budget-period.ts    # Budget period logic
│   │       ├── formatters.ts       # Localization & formatting
│   │       └── cn.ts               # Class merge utility
│   ├── stores/                     # Zustand state
│   │   ├── filter-store.ts
│   │   └── ui-store.ts
│   ├── types/                      # TypeScript types
│   │   ├── database.ts             # Supabase schema types
│   │   └── index.ts                # Exported types
│   └── messages/                   # i18n translations
│       ├── sv.json                 # Swedish
│       └── en.json                 # English
├── middleware.ts                   # Next.js middleware
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript config
├── next.config.ts                  # Next.js config
├── tailwind.config.ts              # Tailwind config
├── postcss.config.mjs              # PostCSS config
├── eslint.config.mjs               # ESLint config
├── .env.example                    # Environment variables template
├── vercel.json                     # Vercel config (cron jobs)
├── README.md                       # Basic Next.js info
├── DEPLOYMENT.md                   # Deployment guide
├── BUILD_PLAN.md                   # Feature roadmap (Swedish)
└── CLAUDE.md                       # This file

```

**Path Alias:** All imports use `@/*` which resolves to `./src/*`

**Example:**
```typescript
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/formatters'
import { useExpenses } from '@/hooks/use-expenses'
```

---

## Architecture & Patterns

### Routing Structure (Next.js App Router)

**Route Groups:**
- `(app)` - Protected routes requiring authentication
- `(auth)` - Public authentication pages

**Key Routes:**
- `/` - Redirects to `/dashboard` (authenticated) or `/login` (unauthenticated)
- `/dashboard` - Main overview with KPIs and widgets
- `/budget` - Budget list view
- `/budget/new` - Create new budget
- `/budget/[id]` - View specific budget (read-only)
- `/budget/[id]/edit` - Edit existing budget
- `/expenses` - Quick add expense view
- `/expenses/list` - Full expense list with filters
- `/savings` - Savings goals management
- `/settings/*` - User settings, profile, categories, partner, CCM, loans
- `/statement-analyzer` - Bank statement upload
- `/onboarding` - First-time user setup
- `/login` - Email/password + OAuth login
- `/register` - Account creation

**API Routes:**
- `POST /api/setup-user` - Create default categories during onboarding
- `GET /api/partner` - Fetch partner profile (bypasses RLS)
- `GET /api/household-incomes` - Combined income for budget calculations
- `POST /api/statement/analyze` - AI-powered statement parsing
- `POST /api/cron/process-recurring-expenses` - Daily cron job (6 AM UTC)

### Authentication Flow

1. **Middleware** checks auth status on every request (`middleware.ts`)
2. Protected routes redirect to `/login` if not authenticated
3. Auth users redirected from `/login` to `/dashboard`
4. Onboarding check in layout - redirects to `/onboarding` if incomplete
5. OAuth callback (`/api/auth/callback`) exchanges code for session

**Important Files:**
- `/home/user/stacka/middleware.ts` - Route protection
- `/home/user/stacka/src/lib/supabase/middleware.ts` - Auth logic
- `/home/user/stacka/src/lib/supabase/client.ts` - Browser client
- `/home/user/stacka/src/lib/supabase/server.ts` - Server client

### Data Flow Pattern

```
User Action
  ↓
Page Component (Client Component with 'use client')
  ↓
Custom Hook (useQuery/useMutation from TanStack Query)
  ↓
Supabase Client (browser or server)
  ↓
Database (PostgreSQL with RLS)
  ↓
Query Cache (TanStack Query)
  ↓
UI Update (automatic via React Query)
```

**Example Flow for Creating an Expense:**
1. User submits `ExpenseForm` component
2. Form validation via Zod schema
3. `useCreateExpense` mutation hook called
4. Supabase insert operation
5. Success handler invalidates queries: `['expenses']`, `['dashboard']`, `['budgets']`
6. UI automatically re-renders with new data

### Real-time Updates

**Realtime Provider** (`src/components/realtime-provider.tsx`):
- Mounted in `AppShell` component
- Subscribes to Supabase Realtime channels
- Listens for INSERT/UPDATE/DELETE on `expenses` and `recurring_expenses` tables
- Triggers query invalidation on changes
- Partner expenses automatically sync between users

**Enabled Tables:**
- expenses
- recurring_expenses
- budgets
- budget_items
- categories
- incomes
- partner_connections
- savings_goals
- profiles

### Budget Period Logic

**Budget periods run from salary day to salary day, NOT calendar months.**

**Key Concepts:**
- **Salary Day**: Customizable per user (default: 25)
- **Period Format**: `YYYY-MM` (represents the month it belongs to)
- **Period Range**: From salary day in month M to salary day in month M+1

**Example:**
- Salary day: 25
- Period: "2026-01"
- Date range: 2026-01-25 to 2026-02-24

**Utility Functions** (`src/lib/utils/budget-period.ts`):
- `getBudgetPeriod(date, salaryDay)` - Get period string for a date
- `getCurrentBudgetPeriod(salaryDay)` - Current period
- `getPeriodDates(periodStr, salaryDay)` - Convert "YYYY-MM" to date range
- `formatPeriodDisplay(period)` - Display name (e.g., "Januari 2026")
- `getDaysUntilSalary(salaryDay)` - Days remaining in current period
- `getPeriodProgress(salaryDay)` - Progress percentage (0-100)

### Cost Assignment System

**Three types of expense ownership:**

1. **personal** - Full amount counts toward user's budget
   - Example: Personal lunch, gym membership
   - Database: `cost_assignment: 'personal'`
   - Budget impact: 100% to user

2. **shared** - 50/50 split between user and partner
   - Example: Groceries, shared bills
   - Database: `cost_assignment: 'shared'`
   - Budget impact: 50% to user, 50% to partner
   - UI indicator: Users icon

3. **partner** - Partner pays, doesn't count toward user's budget
   - Example: Partner's personal expense
   - Database: `cost_assignment: 'partner'`
   - Budget impact: 0% to user, 100% to partner
   - UI indicator: UserCheck icon

**Budget Calculations:**
- User's budget = personal expenses + (shared expenses / 2)
- Partner's budget = partner expenses + (shared expenses / 2)

### CCM (Credit Card Manager)

**Purpose:** Track credit card expenses separately from direct expenses.

**Key Features:**
- Toggle-able in settings (`/settings/ccm`)
- Invoice break date defines billing cycle (e.g., 20th of month)
- Expenses marked with `is_ccm: true`
- Separate tab in expenses view for credit card vs direct expenses
- Invoice period tracking with total amounts
- Partner cost assignment applies to CCM expenses

**Invoice Period Logic:**
- Break date: 20
- Period: "2026-01" runs from Jan 20 to Feb 19
- Expenses between these dates grouped together

**Database:**
- `ccm_invoices` table tracks invoice periods with actual billed amount
- Hook: `use-ccm-invoices.ts`

### Form Pattern

**Standard form implementation:**

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

// 1. Define schema
const expenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  category_id: z.string().uuid('Invalid category'),
  date: z.date(),
  cost_assignment: z.enum(['personal', 'shared', 'partner']),
  is_ccm: z.boolean().optional(),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

// 2. Component
export function ExpenseForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      description: '',
      cost_assignment: 'personal',
      is_ccm: false,
    },
  })

  const createExpense = useCreateExpense()

  const onSubmit = async (values: ExpenseFormValues) => {
    try {
      await createExpense.mutateAsync(values)
      toast.success('Expense created')
      form.reset()
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to create expense')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

---

## Database Schema

**Provider:** Supabase (PostgreSQL with Row Level Security)

**Schema File:** `/home/user/stacka/src/types/database.ts` (auto-generated)

### Key Tables

#### profiles
User account information and preferences.

```typescript
{
  id: uuid (PK, references auth.users)
  email: string
  first_name: string
  last_name: string
  avatar_url: string?
  salary_day: number (1-31, default: 25)
  currency: string (default: 'SEK')
  language: string (default: 'sv')
  theme: string (default: 'system')
  ccm_enabled: boolean (default: false)
  ccm_invoice_break_date: number? (1-31)
  onboarding_completed: boolean (default: false)
  created_at: timestamp
  updated_at: timestamp
}
```

#### partner_connections
Partner linking for shared budgets.

```typescript
{
  id: uuid (PK)
  user1_id: uuid (FK → profiles)
  user2_id: uuid (FK → profiles)
  status: enum ('pending', 'active', 'rejected', 'revoked')
  initiated_by: uuid (FK → profiles)
  invite_code: string (unique, 8 chars)
  expires_at: timestamp
  connected_at: timestamp?
  created_at: timestamp
  updated_at: timestamp
}
```

**Status Flow:** pending → active (or rejected/revoked)

#### categories
Expense/income categories with type and subcategory.

```typescript
{
  id: uuid (PK)
  user_id: uuid (FK → profiles)
  name: string
  type: enum ('income', 'fixedExpense', 'variableExpense', 'savings')
  subcategory: enum ('home', 'housing', 'transport', 'entertainment',
                     'loans', 'savings', 'other')
  icon: string?
  color: string?
  is_default: boolean (default: false)
  is_shared_expense: boolean (default: false)
  default_value: number? (default amount for budgets)
  created_at: timestamp
  updated_at: timestamp
}
```

#### incomes
User income sources.

```typescript
{
  id: uuid (PK)
  user_id: uuid (FK → profiles)
  name: string
  amount: number
  is_shared: boolean (default: false)
  created_at: timestamp
  updated_at: timestamp
}
```

#### budgets
Monthly budget overview (period-based).

```typescript
{
  id: uuid (PK)
  user_id: uuid (FK → profiles)
  period: string (format: 'YYYY-MM')
  total_income: number
  total_expenses: number
  total_cashflow_expenses: number
  total_ccm_expenses: number
  net_balance: number (income - expenses)
  savings_ratio: number (percentage)
  created_at: timestamp
  updated_at: timestamp
}
```

**Unique constraint:** (user_id, period)

#### budget_items
Individual budget line items per category.

```typescript
{
  id: uuid (PK)
  budget_id: uuid (FK → budgets)
  category_id: uuid (FK → categories)
  item_type: enum ('income', 'fixedExpense', 'variableExpense', 'savings')
  amount: number
  user_amount: number? (for partner split)
  partner_amount: number? (for partner split)
  created_at: timestamp
  updated_at: timestamp
}
```

#### expenses
Transaction records.

```typescript
{
  id: uuid (PK)
  user_id: uuid (FK → profiles)
  category_id: uuid (FK → categories)
  amount: number
  description: string
  date: date
  cost_assignment: enum ('personal', 'shared', 'partner')
  is_recurring: boolean (default: false)
  recurring_expense_id: uuid? (FK → recurring_expenses)
  is_ccm: boolean (default: false)
  created_at: timestamp
  updated_at: timestamp
}
```

#### recurring_expenses
Recurring payment setup.

```typescript
{
  id: uuid (PK)
  user_id: uuid (FK → profiles)
  category_id: uuid (FK → categories)
  amount: number
  description: string
  day_of_month: number (1-31)
  cost_assignment: enum ('personal', 'shared', 'partner')
  is_ccm: boolean (default: false)
  is_active: boolean (default: true)
  last_processed: date?
  created_at: timestamp
  updated_at: timestamp
}
```

**Processing:** Cron job runs daily at 6 AM UTC to create expenses from recurring templates.

#### loans
Debt tracking.

```typescript
{
  id: uuid (PK)
  user_id: uuid (FK → profiles)
  loan_group_id: uuid? (FK → loan_groups)
  name: string
  loan_type: enum ('mortgage', 'personal', 'car', 'student', 'other')
  original_amount: number
  current_balance: number
  interest_rate: number (percentage)
  monthly_amortization: number
  start_date: date
  end_date: date?
  created_at: timestamp
  updated_at: timestamp
}
```

#### loan_groups
Loan organization (e.g., "Bolån", "Övriga").

```typescript
{
  id: uuid (PK)
  user_id: uuid (FK → profiles)
  name: string
  created_at: timestamp
}
```

#### savings_goals
Savings targets.

```typescript
{
  id: uuid (PK)
  user_id: uuid (FK → profiles)
  name: string
  goal_type: enum ('emergency', 'vacation', 'home', 'car',
                   'education', 'retirement', 'other')
  target_amount: number
  current_amount: number (default: 0)
  target_date: date?
  monthly_target: number? (calculated or manual)
  status: enum ('active', 'completed', 'archived')
  is_shared: boolean (default: false)
  created_at: timestamp
  updated_at: timestamp
}
```

#### statement_analyses
Bank statement uploads.

```typescript
{
  id: uuid (PK)
  user_id: uuid (FK → profiles)
  file_name: string
  file_type: string ('pdf' | 'csv')
  bank_name: string?
  transaction_count: number
  status: enum ('processing', 'completed', 'failed')
  error_message: string?
  created_at: timestamp
  updated_at: timestamp
}
```

#### statement_transactions
Parsed transactions from statements.

```typescript
{
  id: uuid (PK)
  statement_analysis_id: uuid (FK → statement_analyses)
  date: date
  description: string
  amount: number
  suggested_category_id: uuid? (FK → categories)
  confirmed_category_id: uuid? (FK → categories)
  expense_id: uuid? (FK → expenses, after confirmation)
  created_at: timestamp
}
```

#### ccm_invoices
Credit card invoice tracking.

```typescript
{
  id: uuid (PK)
  user_id: uuid (FK → profiles)
  period: string (format: 'YYYY-MM')
  invoice_amount: number?
  created_at: timestamp
  updated_at: timestamp
}
```

**Unique constraint:** (user_id, period)

### Row Level Security (RLS)

**All tables have RLS enabled.**

**Standard policies:**
- Users can only access their own data
- Partners can access each other's shared data (based on `partner_connections.status = 'active'`)
- Service role key bypasses RLS (used in API routes)

**Partner sharing logic:**
- Expenses with `cost_assignment = 'shared'` visible to both partners
- Categories with `is_shared_expense = true` visible to both partners
- Incomes with `is_shared = true` included in household income
- Budgets and savings goals can be partner-aware

---

## State Management

### Three-Tier State Management

#### 1. Server State (TanStack Query)

**Used for:** All database data (expenses, budgets, categories, etc.)

**Query Key Patterns:**
```typescript
// Top-level entities
['expenses']
['budgets']
['categories']
['user']
['partner']
['incomes']
['savings-goals']
['loans']

// With filters
['expenses', { period, salaryDay, limit, categoryId }]
['expenses', 'period', 'YYYY-MM']

// Specific entity
['budget', id]
['expense', id]
```

**Configuration:**
- Stale times: 60s (default), 5min (user), 30s (partner)
- Automatic cache invalidation on mutations
- Realtime subscriptions trigger invalidation

**Example Hook:**
```typescript
// src/hooks/use-expenses.ts
export function useExpenses(options?: UseExpensesOptions) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['expenses', options],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('*, category:categories(*)')
        .order('date', { ascending: false })

      if (options?.period) {
        // Apply period filter
      }

      const { data, error } = await query
      if (error) throw error
      return data as ExpenseWithCategory[]
    },
  })
}
```

#### 2. Global UI State (Zustand)

**Used for:** UI state that needs to be shared across components

**Stores:**

1. **Filter Store** (`src/stores/filter-store.ts`)
   - Expense filters (category, cost type, date range, search)
   - Budget period filter

2. **UI Store** (`src/stores/ui-store.ts`)
   - Sidebar open/closed
   - Add expense dialog visibility
   - Selected period

**Example:**
```typescript
// src/stores/filter-store.ts
import { create } from 'zustand'

interface FilterState {
  expenseCategoryFilter: string | null
  setExpenseCategoryFilter: (id: string | null) => void
}

export const useFilterStore = create<FilterState>((set) => ({
  expenseCategoryFilter: null,
  setExpenseCategoryFilter: (id) => set({ expenseCategoryFilter: id }),
}))
```

#### 3. Local Component State

**Used for:** Temporary UI state (form values, toggles, etc.)

```typescript
const [isOpen, setIsOpen] = useState(false)
const [selectedDate, setSelectedDate] = useState(new Date())
```

### Query Invalidation Pattern

**After mutations, invalidate related queries:**

```typescript
export function useCreateExpense() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (expense: InsertTables<'expenses'>) => {
      // Insert logic
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}
```

---

## Component Patterns

### Naming Conventions

**Feature-based organization:**
```
components/
  {feature}/
    {feature}-{type}.tsx
```

**Types:**
- `*-form.tsx` - Form components
- `*-list.tsx` - List components
- `*-card.tsx` - Card/widget components
- `*-dialog.tsx` - Dialog/modal components
- `*-skeleton.tsx` - Loading skeletons

**Examples:**
- `expense-form.tsx`
- `budget-list.tsx`
- `savings-goal-card.tsx`
- `expense-list-skeleton.tsx`

### Client vs Server Components

**Default:** Server Components (no 'use client' directive)

**Use 'use client' when:**
- Using React hooks (useState, useEffect, etc.)
- Using browser APIs (localStorage, window, etc.)
- Event handlers (onClick, onSubmit, etc.)
- Using context providers
- Using TanStack Query hooks

**Example:**
```typescript
'use client'  // Required for hooks and interactivity

import { useState } from 'react'
import { useExpenses } from '@/hooks/use-expenses'

export function ExpenseList() {
  const [filter, setFilter] = useState('')
  const { data: expenses } = useExpenses()
  // ...
}
```

### Component Structure Template

```typescript
'use client'

// 1. External imports
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// 2. Internal imports (grouped by type)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCreateExpense } from '@/hooks/use-expenses'
import { formatCurrency } from '@/lib/utils/formatters'
import { toast } from 'sonner'

// 3. Types and schemas
const schema = z.object({
  // ...
})

type FormValues = z.infer<typeof schema>

interface ComponentProps {
  // ...
}

// 4. Component
export function ComponentName({ prop }: ComponentProps) {
  // Hooks first
  const [state, setState] = useState()
  const form = useForm()
  const mutation = useMutation()

  // Handlers
  const handleSubmit = () => {}

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Loading States

**Always provide skeleton loaders for data fetching:**

```typescript
export function ExpenseList() {
  const { data: expenses, isLoading } = useExpenses()

  if (isLoading) {
    return <ExpenseListSkeleton />
  }

  return (
    <div>
      {expenses.map(expense => (
        <ExpenseCard key={expense.id} expense={expense} />
      ))}
    </div>
  )
}
```

**Skeleton files:**
- `src/components/dashboard/dashboard-skeleton.tsx`
- `src/components/expenses/expense-list-skeleton.tsx`
- `src/components/budget/budget-list-skeleton.tsx`

### Styling Conventions

**Tailwind CSS with custom theme:**

**Color Palette:**
- `stacka-olive` - Primary accent
- `stacka-sage` - Secondary neutral
- `stacka-mint` - Light accent
- `stacka-peach` - Warm accent
- `stacka-coral` - Highlight (CCM)
- `stacka-blue` - Info/Shared indicator

**Responsive Design:**
- Mobile-first approach
- Breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)
- Max-width containers: `max-w-lg` (mobile), `max-w-4xl` (tablet), `max-w-6xl` (desktop)

**Layout Pattern:**
```typescript
<div className="min-h-screen bg-background">
  <div className="container mx-auto max-w-6xl p-4 md:p-6">
    {/* Content */}
  </div>
</div>
```

**Class Utility:**
Use `cn()` helper for conditional classes:
```typescript
import { cn } from '@/lib/utils/cn'

<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === 'primary' && "primary-class"
)} />
```

### Animation Patterns

**Framer Motion for transitions:**

```typescript
import { motion, AnimatePresence } from 'framer-motion'

<AnimatePresence mode="wait">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.2 }}
  >
    {content}
  </motion.div>
</AnimatePresence>
```

**Common animations:**
- Page transitions: fade + Y translate
- List items: staggered delays
- Dialogs: scale + opacity
- Skeletons: shimmer effect

---

## Development Workflows

### Local Development

**Setup:**
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials

# Run dev server
npm run dev

# Open http://localhost:3000
```

**Required Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Creating New Features

**Follow this order:**

1. **Database Schema** (if needed)
   - Create migration in Supabase
   - Update `/home/user/stacka/src/types/database.ts`
   - Add RLS policies

2. **Custom Hook** (`src/hooks/use-{feature}.ts`)
   - Read hooks (useQuery)
   - Write hooks (useMutation)
   - Proper query key structure
   - Query invalidation on mutations

3. **Components** (`src/components/{feature}/`)
   - Form component with Zod validation
   - List component with skeleton loader
   - Card/widget components

4. **Page** (`src/app/(app)/{feature}/page.tsx`)
   - Import and compose components
   - Handle loading and error states

5. **Navigation** (if needed)
   - Update sidebar (`src/components/layout/sidebar.tsx`)
   - Update bottom nav (`src/components/layout/bottom-nav.tsx`)

6. **Translations** (if user-facing)
   - Update `src/messages/sv.json`
   - Update `src/messages/en.json`

### Testing Checklist

**Before committing:**
- [ ] Build passes: `npm run build`
- [ ] Lint passes: `npm run lint`
- [ ] Types are correct (no TypeScript errors)
- [ ] Tested on mobile viewport
- [ ] Tested with partner account (if partner feature)
- [ ] Loading states work correctly
- [ ] Error states handled gracefully
- [ ] RLS policies prevent unauthorized access

**Manual Testing:**
```bash
# Test build
npm run build

# Test production locally
npm start

# Lint
npm run lint
```

### Common Tasks

**Add a new category type:**
1. Update database enum in Supabase
2. Update `src/types/database.ts`
3. Update category form component
4. Add translations

**Add a new expense field:**
1. Add column to `expenses` table
2. Update `src/types/database.ts`
3. Update expense form schema
4. Update expense form UI
5. Update expense list/card components

**Add a new dashboard widget:**
1. Create component in `src/components/dashboard/`
2. Add data hook if needed
3. Import in `src/app/(app)/dashboard/page.tsx`
4. Add skeleton variant

---

## Git Conventions

### Branch Strategy

**Main Branch:** `main` (production)

**Feature Branches:** When working with Claude Code on the web, branches are automatically created with the pattern:
```
claude/{description}-{sessionId}
```

**Example:** `claude/add-claude-documentation-NCqt4`

### Commit Message Format

**Standard format:**
```
type: Brief description (50 chars max)

- Detailed change 1
- Detailed change 2
- Bug fix descriptions
- Feature additions

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `style:` - Code style changes (formatting)
- `test:` - Test additions or changes
- `chore:` - Build/tooling changes

**Examples:**
```
feat: Add recurring expenses widget to dashboard

- Created RecurringExpensesWidget component
- Added useRecurringExpenses hook
- Integrated with realtime subscriptions
- Added translations for Swedish and English

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

```
fix: Correct budget period calculation for edge cases

- Fixed calculation when salary day is 31 and month has 30 days
- Added test cases for February with different salary days
- Updated getPeriodDates utility function

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Pull Request Guidelines

**When creating PRs:**
1. Ensure all commits are pushed to feature branch
2. Use descriptive PR title matching commit message style
3. Include summary of changes (bullet points)
4. Include test plan (checklist of what to test)

**PR Template:**
```markdown
## Summary
- Change 1
- Change 2
- Change 3

## Test Plan
- [ ] Tested on mobile
- [ ] Tested on desktop
- [ ] Verified partner functionality
- [ ] Checked loading states
- [ ] Verified no console errors
```

### Git Workflows for AI Assistants

**Pushing to Remote:**
```bash
# Always use -u flag for new branches
git push -u origin claude/feature-name-sessionId

# If push fails due to network (403, timeout), retry with exponential backoff:
# Wait 2s, retry
# Wait 4s, retry
# Wait 8s, retry
# Wait 16s, retry (max 4 retries)
```

**Fetching/Pulling:**
```bash
# Fetch specific branch
git fetch origin branch-name

# Pull with exponential backoff on failure
git pull origin branch-name
```

**CRITICAL:** Branch names must start with `claude/` and match the session ID, otherwise push will fail with 403.

---

## Testing & Deployment

### Local Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Lint
npm run lint
```

### Deployment Process

**Platform:** Vercel

**Production URL:** https://stacka-three.vercel.app

**Deployment Workflow:**

1. **Update Version** in `package.json` (semantic versioning)
   - Patch: Bug fixes (0.1.1 → 0.1.2)
   - Minor: New features (0.1.2 → 0.2.0)
   - Major: Breaking changes (0.2.0 → 1.0.0)

2. **Commit Changes** with descriptive message

3. **Push to Main Branch**
   ```bash
   git push origin main
   ```

4. **Automatic Deployment**
   - Vercel automatically deploys on push to `main`
   - Build logs available in Vercel dashboard

5. **Verify Deployment**
   - Wait 1-2 minutes for deployment
   - Visit production URL
   - Hard refresh browser (Ctrl+F5)
   - Test key features

**Manual Deployment (if needed):**
```bash
npx vercel --prod
```

**Environment Variables:**
All production environment variables are configured in Vercel dashboard. Never commit `.env.local` to repository.

**Cron Jobs:**
Configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/process-recurring-expenses",
      "schedule": "0 6 * * *"
    }
  ]
}
```

See `/home/user/stacka/DEPLOYMENT.md` for detailed deployment guide.

---

## Critical Rules

### Security

**NEVER:**
- Commit `.env.local` or any file containing secrets
- Expose API keys in client-side code
- Skip RLS validation for user data access
- Use `dangerouslySetInnerHTML` without sanitization
- Trust user input without validation

**ALWAYS:**
- Use Zod schemas for all user input validation
- Use parameterized queries (Supabase handles this)
- Validate file uploads (type, size, content)
- Use HTTPS in production
- Sanitize data before rendering

### Data Integrity

**NEVER:**
- Delete data without user confirmation
- Cascade delete without considering dependencies
- Update data without validation
- Skip error handling in mutations

**ALWAYS:**
- Validate data with Zod before mutations
- Handle edge cases (empty arrays, null values)
- Provide rollback mechanisms for critical operations
- Test with both user and partner data

### Performance

**NEVER:**
- Fetch all data at once (use pagination/limits)
- Skip loading states
- Ignore query optimization
- Load unnecessary data

**ALWAYS:**
- Use TanStack Query for caching
- Implement skeleton loaders
- Lazy load large components
- Optimize database queries (select only needed columns)
- Use proper query keys for granular cache invalidation

### User Experience

**NEVER:**
- Show technical error messages to users
- Skip loading states
- Ignore mobile viewport
- Remove user data without confirmation

**ALWAYS:**
- Provide clear, user-friendly error messages
- Show skeleton loaders during data fetching
- Test on mobile devices
- Ask for confirmation before destructive actions
- Use toast notifications for feedback

### Code Quality

**NEVER:**
- Use `any` type in TypeScript
- Skip prop types for components
- Create default exports (use named exports)
- Ignore ESLint warnings

**ALWAYS:**
- Use proper TypeScript types
- Document complex logic with comments
- Follow component naming conventions
- Keep components focused and single-responsibility
- Use meaningful variable names

### Partner Features

**NEVER:**
- Share data before partner connection is active
- Ignore `cost_assignment` when calculating budgets
- Show partner's personal expenses
- Skip partner validation in RLS policies

**ALWAYS:**
- Check `partner_connections.status = 'active'` before sharing
- Respect `cost_assignment` settings
- Filter expenses by cost_assignment
- Test with two separate accounts
- Verify realtime synchronization

### Budget Period Logic

**NEVER:**
- Use calendar months for budget periods
- Ignore user's custom salary day
- Hardcode period calculations

**ALWAYS:**
- Use budget period utilities from `src/lib/utils/budget-period.ts`
- Calculate periods based on `salary_day` from user profile
- Use `getPeriodDates()` to convert period strings to date ranges
- Format periods consistently as `YYYY-MM`

### Internationalization

**NEVER:**
- Hardcode user-facing strings in components
- Skip translations for new features

**ALWAYS:**
- Use `next-intl` for all user-facing text
- Add translations to both `sv.json` and `en.json`
- Use proper locale formatting for dates and currencies
- Test with both Swedish and English

---

## Quick Reference

### File Locations

| Purpose | Location |
|---------|----------|
| Types | `/home/user/stacka/src/types/database.ts` |
| Hooks | `/home/user/stacka/src/hooks/` |
| Components | `/home/user/stacka/src/components/` |
| Pages | `/home/user/stacka/src/app/(app)/` |
| API Routes | `/home/user/stacka/src/app/api/` |
| Utilities | `/home/user/stacka/src/lib/utils/` |
| Supabase | `/home/user/stacka/src/lib/supabase/` |
| Stores | `/home/user/stacka/src/stores/` |
| Translations | `/home/user/stacka/src/messages/` |

### Key Utilities

```typescript
// Budget Period
import {
  getBudgetPeriod,
  getCurrentBudgetPeriod,
  getPeriodDates,
  formatPeriodDisplay,
  getDaysUntilSalary,
  getPeriodProgress
} from '@/lib/utils/budget-period'

// Formatters
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatCompact,
  formatDate,
  formatRelativeDate,
  getInitials
} from '@/lib/utils/formatters'

// Class Names
import { cn } from '@/lib/utils/cn'

// Supabase Clients
import { createClient } from '@/lib/supabase/client' // Browser
import { createClient } from '@/lib/supabase/server' // Server
```

### Common Query Keys

```typescript
['user']                        // Current user profile
['partner']                     // Partner profile
['categories']                  // All categories
['incomes']                     // User incomes
['expenses']                    // All expenses
['expenses', { period, ... }]   // Filtered expenses
['expenses', 'period', period]  // Period-specific
['budgets']                     // All budgets
['budget', id]                  // Specific budget
['savings-goals']               // Savings goals
['loans']                       // All loans
['loan-groups']                 // Loan groups
['recurring-expenses']          // Recurring expenses
['ccm-invoices']                // CCM invoices
['dashboard']                   // Dashboard aggregated data
```

### Important Patterns

**Query with RLS:**
```typescript
const { data } = await supabase
  .from('expenses')
  .select('*, category:categories(*)')
  .order('date', { ascending: false })
// RLS automatically filters by user_id and partner access
```

**Service Role (Bypass RLS):**
```typescript
// Only in API routes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

**Mutation with Invalidation:**
```typescript
return useMutation({
  mutationFn: async (data) => {
    // Mutation logic
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['entity'] })
    queryClient.invalidateQueries({ queryKey: ['related-entity'] })
    toast.success('Success message')
  },
  onError: (error) => {
    toast.error('Error message')
  },
})
```

---

## Additional Resources

- **Next.js Documentation:** https://nextjs.org/docs
- **React Documentation:** https://react.dev
- **TanStack Query:** https://tanstack.com/query/latest
- **Supabase Documentation:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Radix UI:** https://www.radix-ui.com/docs
- **Framer Motion:** https://www.framer.com/motion

---

## Project History

**Version History:**
- v0.1.1 (2026-01-21) - Security updates to Next.js
- v0.1.0 (Initial) - Full budget/expense management system

**Current Status:** MVP complete, Phase 3 features in progress

**See BUILD_PLAN.md for detailed feature roadmap (in Swedish)**

---

**Last Updated:** 2026-01-22

**Maintainer:** Development Team

**Production URL:** https://stacka-three.vercel.app

---

*This document is maintained for AI assistants working with the Stacka codebase. Keep it updated as the project evolves.*
