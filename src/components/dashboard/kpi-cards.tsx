'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatPercentage } from '@/lib/utils/formatters'
import { getDaysUntilSalary, getPeriodProgress } from '@/lib/utils/budget-period'
import { TrendingDown, TrendingUp, Calendar, PiggyBank, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface KPICardsProps {
  totalBudget: number
  totalSpent: number
  savingsRate: number  // Budget savings rate (planned)
  salaryDay: number
  hasBudget: boolean
  totalIncome: number
  actualSavings: number  // Actual savings from savings category expenses
}

export function KPICards({
  totalBudget,
  totalSpent,
  savingsRate,
  salaryDay,
  hasBudget,
  totalIncome,
  actualSavings
}: KPICardsProps) {
  const remaining = totalBudget - totalSpent
  const daysUntilSalary = getDaysUntilSalary(salaryDay)
  const periodProgress = getPeriodProgress(salaryDay)
  const dailyBudget = daysUntilSalary > 0 && totalBudget > 0 ? remaining / daysUntilSalary : 0
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  const noBudget = totalBudget === 0

  // Calculate actual savings rate based on actual savings registered in savings categories
  // Actual = actualSavings / totalIncome * 100
  const actualSavingsRate = totalIncome > 0 ? (actualSavings / totalIncome) * 100 : 0

  // Check if overspent or on track
  const isOverBudget = spentPercentage > periodProgress
  
  const cards = [
    {
      label: 'Kvar att spendera',
      value: noBudget ? '–' : formatCurrency(remaining),
      subtext: noBudget
        ? 'Ingen budget'
        : daysUntilSalary > 0 ? `${formatCurrency(dailyBudget)}/dag` : 'Ny period idag',
      icon: remaining >= 0 || noBudget ? TrendingUp : TrendingDown,
      color: noBudget ? 'text-muted-foreground' : remaining >= 0 ? 'text-success' : 'text-destructive',
      bgColor: noBudget ? 'bg-muted/50' : remaining >= 0 ? 'bg-success/10' : 'bg-destructive/10',
      cardBg: 'bg-gradient-to-br from-stacka-mint/30 to-white dark:from-stacka-mint/10 dark:to-card',
    },
    {
      label: 'Förbrukat',
      value: formatCurrency(totalSpent),
      subtext: noBudget
        ? '–'
        : `${formatPercentage(spentPercentage)} av budget`,
      icon: TrendingDown,
      color: noBudget ? 'text-stacka-olive' : isOverBudget ? 'text-warning' : 'text-stacka-olive',
      bgColor: noBudget ? 'bg-stacka-sage/20' : isOverBudget ? 'bg-warning/10' : 'bg-stacka-sage/20',
      cardBg: 'bg-gradient-to-br from-stacka-peach/30 to-white dark:from-stacka-coral/10 dark:to-card',
    },
    {
      label: 'Dagar till lön',
      value: daysUntilSalary === 0 ? 'Löning! 🥳' : daysUntilSalary.toString(),
      subtext: daysUntilSalary === 0 ? '' : daysUntilSalary === 1 ? 'dag kvar' : 'dagar kvar',
      icon: Calendar,
      color: daysUntilSalary === 0 ? 'text-success' : 'text-stacka-blue',
      bgColor: daysUntilSalary === 0 ? 'bg-success/10' : 'bg-stacka-blue/10',
      cardBg: daysUntilSalary === 0
        ? 'bg-gradient-to-br from-success/20 to-white dark:from-success/10 dark:to-card'
        : 'bg-gradient-to-br from-stacka-blue/20 to-white dark:from-stacka-blue/10 dark:to-card',
    },
    {
      label: 'Sparkvot',
      value: formatPercentage(actualSavingsRate),
      subtext: hasBudget
        ? `Budget: ${formatPercentage(savingsRate)}`
        : 'Faktisk sparkvot',
      icon: PiggyBank,
      color: actualSavingsRate >= 10 ? 'text-success' : actualSavingsRate >= 0 ? 'text-muted-foreground' : 'text-destructive',
      bgColor: actualSavingsRate >= 10 ? 'bg-success/10' : actualSavingsRate >= 0 ? 'bg-muted/50' : 'bg-destructive/10',
      cardBg: 'bg-gradient-to-br from-stacka-sage/30 to-white dark:from-stacka-sage/10 dark:to-card',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={cn("border-0 shadow-sm", card.cardBg)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className={cn("text-xl font-bold", card.color)}>{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.subtext}</p>
                </div>
                <div className={cn("p-2 rounded-lg", card.bgColor)}>
                  <card.icon className={cn("w-4 h-4", card.color)} aria-hidden="true" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
