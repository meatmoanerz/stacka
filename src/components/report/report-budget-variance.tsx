'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import type { ExpenseWithCategory, BudgetWithItems } from '@/types'

interface ReportBudgetVarianceProps {
  expenses: ExpenseWithCategory[]
  budget: BudgetWithItems | null
}

export function ReportBudgetVariance({ expenses, budget }: ReportBudgetVarianceProps) {
  if (!budget || !budget.budget_items?.length) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Budget vs Utfall</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Ingen budget för denna period</p>
        </CardContent>
      </Card>
    )
  }

  // Sum expenses per category
  const spentByCategory: Record<string, number> = {}
  for (const exp of expenses) {
    const catId = exp.category_id || 'unknown'
    spentByCategory[catId] = (spentByCategory[catId] || 0) + exp.amount
  }

  // Build variance items from budget items
  const items = budget.budget_items
    .filter(item => item.amount > 0)
    .map(item => {
      const budgeted = item.amount
      const spent = spentByCategory[item.category_id || ''] || 0
      const delta = budgeted - spent
      const percentage = budgeted > 0 ? Math.min((spent / budgeted) * 100, 150) : 0
      const isOver = spent > budgeted

      return {
        name: item.category?.name || 'Okänd',
        budgeted,
        spent,
        delta,
        percentage,
        isOver,
      }
    })
    .sort((a, b) => b.spent - a.spent)

  const withinBudget = items.filter(i => !i.isOver).length
  const total = items.length

  // Show top 3 + summary for rest
  const displayItems = items.slice(0, 3)
  const remainingItems = items.slice(3)
  const remainingDelta = remainingItems.reduce((sum, i) => sum + i.delta, 0)

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Budget vs Utfall</CardTitle>
          <span className="text-xs text-muted-foreground">
            {withinBudget}/{total} inom budget
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayItems.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium truncate mr-2">{item.name}</span>
              <span className={cn(
                'text-xs font-semibold shrink-0',
                item.isOver ? 'text-red-500' : 'text-green-600'
              )}>
                {item.isOver ? '+' : '-'}{formatCurrency(Math.abs(item.delta))}
              </span>
            </div>
            <Progress
              value={Math.min(item.percentage, 100)}
              className={cn(
                'h-2',
                item.isOver && '[&>div]:bg-red-400'
              )}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(item.spent)} spenderat</span>
              <span>{formatCurrency(item.budgeted)} budgeterat</span>
            </div>
          </div>
        ))}
        {remainingItems.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
            <span>{remainingItems.length} fler kategorier</span>
            <span className={cn(
              'font-semibold',
              remainingDelta < 0 ? 'text-red-500' : 'text-green-600'
            )}>
              {remainingDelta < 0 ? '+' : '-'}{formatCurrency(Math.abs(remainingDelta))}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
