'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion } from 'framer-motion'
import { ArrowLeft, Wallet, Calculator, Info } from 'lucide-react'
import { useBudgets, useBudget } from '@/hooks/use-budgets'
import { useUser, usePartner } from '@/hooks/use-user'
import { formatCurrency } from '@/lib/utils/formatters'
import { formatPeriodDisplay, getCurrentBudgetPeriod, getRecentPeriods } from '@/lib/utils/budget-period'
import { cn } from '@/lib/utils/cn'

// Local storage key for selected categories
const STORAGE_KEY = 'stacka-shared-account-categories'

export default function SharedAccountPage() {
  const router = useRouter()
  const { data: user } = useUser()
  const { data: partner } = usePartner()
  const { data: budgets } = useBudgets()

  const salaryDay = user?.salary_day || 25
  const currentPeriod = getCurrentBudgetPeriod(salaryDay)
  const recentPeriods = getRecentPeriods(salaryDay, 6)

  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod.period)

  // Initialize selectedCategories from localStorage
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          return new Set(parsed)
        }
      }
    } catch (e) {
      console.error('Failed to load saved categories:', e)
    }
    return new Set()
  })

  // Find budget for selected period
  const selectedBudget = budgets?.find(b => b.period === selectedPeriod)
  const { data: budgetDetails } = useBudget(selectedBudget?.id || '')

  // Get fixed expense items from budget
  const fixedItems = useMemo(() => {
    if (!budgetDetails?.budget_items) return []
    return budgetDetails.budget_items.filter(item => item.type === 'fixedExpense')
  }, [budgetDetails])

  // Save selected categories to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(selectedCategories)))
    } catch (e) {
      console.error('Failed to save categories:', e)
    }
  }, [selectedCategories])

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  // Calculate totals
  const totals = useMemo(() => {
    const selectedItems = fixedItems.filter(item => selectedCategories.has(item.category_id || ''))
    const total = selectedItems.reduce((sum, item) => sum + item.amount, 0)
    const perPerson = total / 2

    return {
      total,
      perPerson,
      selectedCount: selectedItems.length,
      items: selectedItems,
    }
  }, [fixedItems, selectedCategories])

  const hasPartner = !!partner

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
          <h1 className="text-xl font-bold text-stacka-olive">Gemensamt konto</h1>
          <p className="text-sm text-muted-foreground">Beräkna överföring till gemensamt konto</p>
        </div>
      </motion.div>

      {/* Period Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Välj period" />
          </SelectTrigger>
          <SelectContent>
            {recentPeriods.map(period => (
              <SelectItem key={period.period} value={period.period}>
                <span className="capitalize">{formatPeriodDisplay(period.period)}</span>
                {period.period === currentPeriod.period && (
                  <span className="ml-2 text-xs text-stacka-olive">(Aktuell)</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm bg-gradient-to-br from-stacka-olive to-stacka-olive/80 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/70 text-sm">Total summa</p>
                <p className="text-3xl font-bold">{formatCurrency(totals.total)}</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <Calculator className="w-7 h-7" />
              </div>
            </div>

            {hasPartner && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                <div>
                  <p className="text-white/70 text-xs">Du betalar</p>
                  <p className="text-xl font-semibold">{formatCurrency(totals.perPerson)}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs">{partner?.first_name || 'Partner'} betalar</p>
                  <p className="text-xl font-semibold">{formatCurrency(totals.perPerson)}</p>
                </div>
              </div>
            )}

            <p className="text-white/60 text-xs mt-4">
              {totals.selectedCount} kategorier valda
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Card */}
      {!hasPartner && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-0 shadow-sm bg-stacka-sage/20">
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-stacka-olive shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Koppla en partner för att automatiskt beräkna 50/50-uppdelning av gemensamma kostnader.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* No Budget Warning */}
      {!selectedBudget && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-0 shadow-sm bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Ingen budget finns för {formatPeriodDisplay(selectedPeriod)}.
              </p>
              <Button
                variant="link"
                className="text-amber-700 dark:text-amber-300 p-0 h-auto mt-1"
                onClick={() => router.push(`/budget/new?period=${selectedPeriod}`)}
              >
                Skapa budget
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Categories Selection */}
      {fixedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-stacka-olive" />
                Fasta kostnader
              </CardTitle>
              <CardDescription className="text-xs">
                Välj vilka kategorier som ska ingå i gemensamma kontot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Select All / Deselect All */}
              <div className="flex gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const allIds = new Set(fixedItems.map(item => item.category_id || '').filter(Boolean))
                    setSelectedCategories(allIds)
                  }}
                >
                  Välj alla
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedCategories(new Set())}
                >
                  Avmarkera alla
                </Button>
              </div>

              {/* Category List */}
              {fixedItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer",
                    selectedCategories.has(item.category_id || '')
                      ? "bg-stacka-sage/30"
                      : "bg-muted/50 hover:bg-muted"
                  )}
                  onClick={() => toggleCategory(item.category_id || '')}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedCategories.has(item.category_id || '')}
                      onCheckedChange={() => toggleCategory(item.category_id || '')}
                    />
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  <span className="font-semibold text-sm">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Selected Items Summary */}
      {totals.selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sammanfattning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {totals.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
                <span className="font-semibold">Totalt</span>
                <span className="font-bold text-lg">{formatCurrency(totals.total)}</span>
              </div>
              {hasPartner && (
                <div className="flex items-center justify-between text-sm text-stacka-olive">
                  <span>Per person (50/50)</span>
                  <span className="font-semibold">{formatCurrency(totals.perPerson)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-sm bg-stacka-sage/10">
          <CardContent className="p-4">
            <h4 className="font-medium text-sm mb-2">Tips</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Valda kategorier sparas automatiskt</li>
              <li>• Beloppet baseras på din budget för vald period</li>
              <li>• Uppdatera budgeten för att ändra beloppen</li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
