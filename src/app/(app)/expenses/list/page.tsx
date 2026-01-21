'use client'

import { useState } from 'react'
import { useExpenses, useDeleteExpense } from '@/hooks/use-expenses'
import { useUser } from '@/hooks/use-user'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ExpenseListSkeleton } from '@/components/expenses/expense-list-skeleton'
import { formatCurrency, formatRelativeDate } from '@/lib/utils/formatters'
import { getCurrentBudgetPeriod, formatPeriodDisplay, getRecentPeriods } from '@/lib/utils/budget-period'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import type { ExpenseWithCategory, CostType } from '@/types'

const categoryIcons: Record<string, string> = {
  Mat: '🍔',
  Hem: '🏠',
  Kläder: '👕',
  Nöje: '🎬',
  Restaurang: '🍽️',
  Transport: '🚗',
  Kollektivtrafik: '🚌',
  Resor: '✈️',
  El: '⚡',
  Prenumerationer: '📱',
}

export default function ExpenseListPage() {
  const { data: user } = useUser()
  const salaryDay = user?.salary_day || 25
  const currentPeriod = getCurrentBudgetPeriod(salaryDay)
  
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod.period)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | CostType>('all')
  const [deleteExpense, setDeleteExpense] = useState<ExpenseWithCategory | null>(null)
  
  const { data: expenses = [], isLoading } = useExpenses({ 
    period: selectedPeriod, 
    salaryDay 
  })
  const deleteExpenseMutation = useDeleteExpense()

  const recentPeriods = getRecentPeriods(salaryDay, 6)

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || expense.category?.cost_type === typeFilter
    return matchesSearch && matchesType
  })

  // Group by date
  const groupedExpenses = filteredExpenses.reduce((groups, expense) => {
    const date = expense.date
    if (!groups[date]) groups[date] = []
    groups[date].push(expense)
    return groups
  }, {} as Record<string, ExpenseWithCategory[]>)

  const handleDelete = async () => {
    if (!deleteExpense) return
    try {
      await deleteExpenseMutation.mutateAsync(deleteExpense.id)
      toast.success('Utgift borttagen')
      setDeleteExpense(null)
    } catch {
      toast.error('Kunde inte ta bort utgift')
    }
  }

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const currentIndex = recentPeriods.findIndex(p => p.period === selectedPeriod)
    if (direction === 'prev' && currentIndex < recentPeriods.length - 1) {
      setSelectedPeriod(recentPeriods[currentIndex + 1].period)
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedPeriod(recentPeriods[currentIndex - 1].period)
    }
  }

  if (isLoading) {
    return <ExpenseListSkeleton />
  }

  const totalSpent = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)

  return (
    <div className="p-4 space-y-4">
      {/* Header with period navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigatePeriod('prev')}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-stacka-olive capitalize">
            {formatPeriodDisplay(selectedPeriod)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(totalSpent)} totalt
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigatePeriod('next')}
          disabled={selectedPeriod === currentPeriod.period}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sök utgifter..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Type Filter */}
      <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">Alla</TabsTrigger>
          <TabsTrigger value="Fixed" className="flex-1">Fast</TabsTrigger>
          <TabsTrigger value="Variable" className="flex-1">Rörligt</TabsTrigger>
          <TabsTrigger value="Savings" className="flex-1">Spar</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Inga utgifter hittades</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {Object.entries(groupedExpenses)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, dayExpenses]) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatRelativeDate(date)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(dayExpenses.reduce((s, e) => s + e.amount, 0))}
                    </span>
                  </div>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-0 divide-y divide-border">
                      {dayExpenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-stacka-sage/20 flex items-center justify-center text-lg">
                              {categoryIcons[expense.category?.name] || '💰'}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{expense.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {expense.category?.name}
                                {expense.is_ccm && ' • Kreditkort'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-semibold",
                              expense.is_ccm ? "text-stacka-coral" : ""
                            )}>
                              -{formatCurrency(expense.amount)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteExpense(expense)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteExpense} onOpenChange={() => setDeleteExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta bort utgift?</DialogTitle>
            <DialogDescription>
              Är du säker på att du vill ta bort "{deleteExpense?.description}"?
              Detta går inte att ångra.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteExpense(null)}>
              Avbryt
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Ta bort
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

