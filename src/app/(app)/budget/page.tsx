'use client'

import Link from 'next/link'
import { useBudgets } from '@/hooks/use-budgets'
import { useUser } from '@/hooks/use-user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BudgetListSkeleton } from '@/components/budget/budget-list-skeleton'
import { IncomeOverviewCard } from '@/components/budget/income-overview-card'
import { formatCurrency, formatPercentage } from '@/lib/utils/formatters'
import { formatPeriodDisplay, getCurrentBudgetPeriod } from '@/lib/utils/budget-period'
import { motion } from 'framer-motion'
import { Plus, ChevronRight, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Budget } from '@/types'

export default function BudgetListPage() {
  const { data: user } = useUser()
  const { data: budgets, isLoading } = useBudgets()
  
  const salaryDay = user?.salary_day || 25
  const currentPeriod = getCurrentBudgetPeriod(salaryDay)

  if (isLoading) {
    return <BudgetListSkeleton />
  }

  return (
    <div className="p-4 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-stacka-olive">Budgetar</h1>
          <p className="text-sm text-muted-foreground">Hantera dina månadsbudgetar</p>
        </div>
        <Button asChild>
          <Link href="/budget/new">
            <Plus className="w-4 h-4 mr-2" />
            Ny budget
          </Link>
        </Button>
      </motion.div>

      {/* Current Period Highlight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm bg-gradient-to-br from-stacka-olive to-stacka-olive/80 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/70 text-sm">Aktuell period</p>
                <p className="text-xl font-bold capitalize">
                  {formatPeriodDisplay(currentPeriod.period)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
            {budgets?.find(b => b.period === currentPeriod.period) ? (
              <Link 
                href={`/budget/${budgets.find(b => b.period === currentPeriod.period)?.id}`}
                className="inline-flex items-center text-sm text-white/90 hover:text-white"
              >
                Visa budget
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            ) : (
              <Link 
                href={`/budget/new?period=${currentPeriod.period}`}
                className="inline-flex items-center text-sm text-white/90 hover:text-white"
              >
                Skapa budget för denna period
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Income Card */}
      <IncomeOverviewCard period={currentPeriod.period} />

      {/* Budget List */}
      {(!budgets || budgets.length === 0) ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-stacka-sage/30 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-stacka-olive" />
              </div>
              <h3 className="font-semibold mb-2">Inga budgetar ännu</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Skapa din första budget för att börja planera din ekonomi
              </p>
              <Button asChild>
                <Link href="/budget/new">Skapa budget</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget, index) => (
            <BudgetCard 
              key={budget.id} 
              budget={budget} 
              index={index}
              isCurrent={budget.period === currentPeriod.period}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BudgetCard({ budget, index, isCurrent }: { budget: Budget; index: number; isCurrent: boolean }) {
  const spentRatio = budget.total_income > 0 
    ? ((budget.total_expenses) / budget.total_income) * 100 
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
    >
      <Link href={`/budget/${budget.id}`}>
        <Card className={cn(
          "border-0 shadow-sm transition-all hover:shadow-md",
          isCurrent && "ring-2 ring-stacka-olive"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold capitalize">
                  {formatPeriodDisplay(budget.period)}
                </p>
                {isCurrent && (
                  <span className="text-xs text-stacka-olive font-medium">Aktuell</span>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Förbrukat</span>
                <span className="font-medium">
                  {formatCurrency(budget.total_expenses)} / {formatCurrency(budget.total_income)}
                </span>
              </div>
              <Progress value={Math.min(spentRatio, 100)} className="h-2" />
            </div>

            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>Sparkvot: {formatPercentage(budget.savings_ratio)}</span>
              <span>Kvar: {formatCurrency(budget.net_balance)}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

