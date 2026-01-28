'use client'

import { use, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useBudget, useDeleteBudget } from '@/hooks/use-budgets'
import { useExpensesByPeriod } from '@/hooks/use-expenses'
import { useUser } from '@/hooks/use-user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { LoadingPage } from '@/components/shared/loading-spinner'
import { formatCurrency, formatPercentage } from '@/lib/utils/formatters'
import { formatPeriodDisplay, getCurrentBudgetPeriod } from '@/lib/utils/budget-period'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  PiggyBank, 
  TrendingDown,
  Wallet,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { BudgetItem } from '@/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function BudgetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: user } = useUser()
  const { data: budget, isLoading } = useBudget(id)
  const deleteBudget = useDeleteBudget()
  
  const salaryDay = user?.salary_day || 25
  const currentPeriod = getCurrentBudgetPeriod(salaryDay)
  const { data: expenses } = useExpensesByPeriod(budget?.period || '', salaryDay)

  // Group budget items by type
  const groupedItems = useMemo(() => {
    if (!budget?.budget_items) return { fixed: [], variable: [], savings: [] }
    
    return {
      fixed: budget.budget_items.filter(item => item.type === 'fixedExpense'),
      variable: budget.budget_items.filter(item => item.type === 'variableExpense'),
      savings: budget.budget_items.filter(item => item.type === 'savings'),
    }
  }, [budget])

  // Calculate actual spending per category (considering cost assignment)
  // - personal: full amount (user pays 100%)
  // - shared: 50% (split with partner)
  // - partner: 0% (partner pays, not counted toward user's budget)
  const actualSpending = useMemo(() => {
    if (!expenses) return {}

    return expenses.reduce((acc, expense) => {
      const categoryId = expense.category_id
      const assignment = expense.cost_assignment || 'personal'

      // Calculate user's share based on cost assignment
      let userShare = 0
      if (assignment === 'personal') {
        userShare = expense.amount // Full amount
      } else if (assignment === 'shared') {
        userShare = expense.amount / 2 // 50/50 split
      }
      // partner = 0 (not counted)

      if (!acc[categoryId]) acc[categoryId] = 0
      acc[categoryId] += userShare
      return acc
    }, {} as Record<string, number>)
  }, [expenses])

  // Calculate totals
  const totals = useMemo(() => {
    const fixedBudgeted = groupedItems.fixed.reduce((sum, item) => sum + item.amount, 0)
    const variableBudgeted = groupedItems.variable.reduce((sum, item) => sum + item.amount, 0)
    const savingsBudgeted = groupedItems.savings.reduce((sum, item) => sum + item.amount, 0)
    
    const fixedActual = groupedItems.fixed.reduce((sum, item) => sum + (actualSpending[item.category_id || ''] || 0), 0)
    const variableActual = groupedItems.variable.reduce((sum, item) => sum + (actualSpending[item.category_id || ''] || 0), 0)
    const savingsActual = groupedItems.savings.reduce((sum, item) => sum + (actualSpending[item.category_id || ''] || 0), 0)
    
    return {
      fixedBudgeted,
      variableBudgeted,
      savingsBudgeted,
      fixedActual,
      variableActual,
      savingsActual,
      totalBudgeted: fixedBudgeted + variableBudgeted + savingsBudgeted,
      totalActual: fixedActual + variableActual,
    }
  }, [groupedItems, actualSpending])

  async function handleDelete() {
    try {
      await deleteBudget.mutateAsync(id)
      toast.success('Budget borttagen')
      router.push('/budget')
    } catch (error) {
      console.error('Delete budget error:', error)
      toast.error('Kunde inte ta bort budgeten')
    }
  }

  if (isLoading) {
    return <LoadingPage />
  }

  if (!budget) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Budget hittades inte</p>
        <Button asChild className="mt-4">
          <Link href="/budget">Tillbaka</Link>
        </Button>
      </div>
    )
  }

  const isCurrent = budget.period === currentPeriod.period
  const remaining = budget.total_income - totals.totalActual - totals.savingsBudgeted

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-stacka-olive capitalize">
            {formatPeriodDisplay(budget.period)}
          </h1>
          {isCurrent && (
            <span className="text-xs text-stacka-olive bg-stacka-sage/30 px-2 py-0.5 rounded-full">
              Aktuell period
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/budget/${id}/edit`}>
            <Edit2 className="w-4 h-4" />
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ta bort budget?</AlertDialogTitle>
              <AlertDialogDescription>
                Är du säker på att du vill ta bort denna budget? Detta går inte att ångra.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Ta bort
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>

      {/* Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-0 shadow-sm bg-gradient-to-br from-stacka-olive to-stacka-olive/80 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/70 text-sm">Kvar att spendera</p>
                <p className={cn(
                  "text-3xl font-bold",
                  remaining < 0 && "text-stacka-coral"
                )}>
                  {formatCurrency(remaining)}
                </p>
              </div>
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <Wallet className="w-7 h-7" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white/80">
                <span>Spenderat</span>
                <span>{formatCurrency(totals.totalActual)} / {formatCurrency(totals.fixedBudgeted + totals.variableBudgeted)}</span>
              </div>
              <Progress 
                value={Math.min(100, (totals.totalActual / (totals.fixedBudgeted + totals.variableBudgeted)) * 100)} 
                className="h-2 bg-white/20" 
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Inkomst</p>
            <p className="font-semibold text-sm">{formatCurrency(budget.total_income)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Budgeterat</p>
            <p className="font-semibold text-sm">{formatCurrency(totals.totalBudgeted)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-success/10">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Sparkvot</p>
            <p className="font-semibold text-sm text-success">{formatPercentage(budget.savings_ratio || 0)}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Fixed Expenses */}
      {groupedItems.fixed.length > 0 && (
        <BudgetSection
          title="Fasta kostnader"
          icon={<TrendingDown className="w-4 h-4" />}
          items={groupedItems.fixed}
          actualSpending={actualSpending}
          budgetedTotal={totals.fixedBudgeted}
          actualTotal={totals.fixedActual}
          delay={0.15}
        />
      )}

      {/* Variable Expenses */}
      {groupedItems.variable.length > 0 && (
        <BudgetSection
          title="Rörliga kostnader"
          icon={<TrendingDown className="w-4 h-4" />}
          items={groupedItems.variable}
          actualSpending={actualSpending}
          budgetedTotal={totals.variableBudgeted}
          actualTotal={totals.variableActual}
          delay={0.2}
        />
      )}

      {/* Savings */}
      {groupedItems.savings.length > 0 && (
        <BudgetSection
          title="Sparande"
          icon={<PiggyBank className="w-4 h-4" />}
          items={groupedItems.savings}
          actualSpending={actualSpending}
          budgetedTotal={totals.savingsBudgeted}
          actualTotal={totals.savingsActual}
          delay={0.25}
          accentColor="success"
        />
      )}
    </div>
  )
}

interface BudgetSectionProps {
  title: string
  icon: React.ReactNode
  items: BudgetItem[]
  actualSpending: Record<string, number>
  budgetedTotal: number
  actualTotal: number
  delay: number
  accentColor?: 'default' | 'success'
}

function BudgetSection({
  title,
  icon,
  items,
  actualSpending,
  budgetedTotal,
  actualTotal,
  delay,
  accentColor = 'default',
}: BudgetSectionProps) {
  const percentage = budgetedTotal > 0 ? (actualTotal / budgetedTotal) * 100 : 0
  const isOverBudget = percentage > 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                accentColor === 'success' ? "bg-success/10 text-success" : "bg-stacka-olive/10 text-stacka-olive"
              )}>
                {icon}
              </div>
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-sm font-semibold",
                isOverBudget && "text-destructive"
              )}>
                {formatCurrency(actualTotal)} / {formatCurrency(budgetedTotal)}
              </p>
              {isOverBudget && (
                <p className="text-xs text-destructive flex items-center gap-1 justify-end">
                  <AlertTriangle className="w-3 h-3" />
                  Över budget
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map(item => {
            const actual = actualSpending[item.category_id || ''] || 0
            const budgeted = item.amount
            const itemPercentage = budgeted > 0 ? (actual / budgeted) * 100 : 0
            const itemOverBudget = itemPercentage > 100

            return (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className={cn(
                    "font-medium",
                    itemOverBudget && "text-destructive"
                  )}>
                    {formatCurrency(actual)} / {formatCurrency(budgeted)}
                  </span>
                </div>
                <Progress 
                  value={Math.min(itemPercentage, 100)} 
                  className={cn(
                    "h-1.5",
                    itemOverBudget && "[&>div]:bg-destructive"
                  )} 
                />
              </div>
            )
          })}
        </CardContent>
      </Card>
    </motion.div>
  )
}

