'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { motion } from 'framer-motion'
import { ArrowLeft, Landmark, Plus, TrendingDown, Percent, Wallet } from 'lucide-react'
import { useAllLoans } from '@/hooks/use-loans'
import { useLoanGroups } from '@/hooks/use-loan-groups'
import { LoanForm, LoanCard } from '@/components/loans'
import { Skeleton } from '@/components/ui/skeleton'

export default function LoansSettingsPage() {
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)

  const { data: loans, isLoading } = useAllLoans()
  const { data: loanGroups } = useLoanGroups()

  // Calculate totals
  const totalDebt = loans?.reduce((sum, loan) => sum + loan.current_balance, 0) ?? 0
  const totalMonthlyAmortization = loans?.reduce((sum, loan) => sum + loan.monthly_amortization, 0) ?? 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate weighted average interest rate
  const avgInterestRate = loans && loans.length > 0
    ? loans.reduce((sum, loan) => sum + (loan.current_balance * loan.interest_rate), 0) /
      loans.reduce((sum, loan) => sum + loan.current_balance, 0)
    : 0

  // Calculate total monthly interest
  const totalMonthlyInterest = loans?.reduce((sum, loan) => {
    return sum + (loan.current_balance * (loan.interest_rate / 100 / 12))
  }, 0) ?? 0

  const totalMonthlyCost = totalMonthlyAmortization + totalMonthlyInterest

  // Group loans by loan_group
  const groupedLoans = loans?.reduce((acc, loan) => {
    const groupId = loan.group_id || 'ungrouped'
    if (!acc[groupId]) {
      acc[groupId] = []
    }
    acc[groupId].push(loan)
    return acc
  }, {} as Record<string, typeof loans>)

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-stacka-olive">Lån</h1>
          <p className="text-sm text-muted-foreground">Hantera dina lån och skulder</p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : loans && loans.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card className="border-0 shadow-sm bg-gradient-to-br from-stacka-sage/20 to-stacka-sage/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-stacka-olive" />
                <span className="text-xs text-muted-foreground">Total skuld</span>
              </div>
              <p className="text-xl font-bold text-stacka-olive">{formatCurrency(totalDebt)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-stacka-peach/20 to-stacka-peach/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-stacka-coral" />
                <span className="text-xs text-muted-foreground">Månadskostnad</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(totalMonthlyCost)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(totalMonthlyAmortization)} amor. + {formatCurrency(Math.round(totalMonthlyInterest))} ränta
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      {/* Average Interest Rate */}
      {loans && loans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stacka-sage/20 flex items-center justify-center">
                  <Percent className="w-5 h-5 text-stacka-olive" />
                </div>
                <div>
                  <p className="font-medium">Snittränta</p>
                  <p className="text-xs text-muted-foreground">Viktad mot skuldbelopp</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-stacka-olive">{avgInterestRate.toFixed(2)}%</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Loans List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : loans && loans.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Grouped by loan type */}
          {groupedLoans && loanGroups?.map(group => {
            const groupLoans = groupedLoans[group.id]
            if (!groupLoans || groupLoans.length === 0) return null

            const groupTotal = groupLoans.reduce((sum, loan) => sum + loan.current_balance, 0)

            return (
              <div key={group.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <h2 className="font-semibold text-stacka-olive">{group.name}</h2>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(groupTotal)}
                  </span>
                </div>
                <div className="space-y-3">
                  {groupLoans.map((loan, index) => (
                    <LoanCard key={loan.id} loan={loan} index={index} />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Ungrouped loans */}
          {groupedLoans?.['ungrouped'] && groupedLoans['ungrouped'].length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-muted-foreground">Övriga</h2>
              <div className="space-y-3">
                {groupedLoans['ungrouped'].map((loan, index) => (
                  <LoanCard key={loan.id} loan={loan} index={index} />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-stacka-sage/30 flex items-center justify-center mx-auto mb-4">
                <Landmark className="w-8 h-8 text-stacka-olive" />
              </div>
              <h3 className="font-semibold mb-2">Inga lån registrerade</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Lägg till dina lån för att spåra skulder och räntor
              </p>
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Lägg till lån
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Floating Add Button */}
      {loans && loans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="fixed bottom-24 right-4 z-10"
        >
          <Button
            size="lg"
            className="rounded-full shadow-lg h-14 w-14"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </motion.div>
      )}

      {/* Add Loan Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lägg till lån</DialogTitle>
            <DialogDescription>
              Registrera ett nytt lån för att spåra skuld och ränta
            </DialogDescription>
          </DialogHeader>
          <LoanForm onSuccess={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="border-0 shadow-sm bg-stacka-sage/10">
          <CardContent className="p-4">
            <h4 className="font-medium text-sm mb-2">Tips för lånhantering</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Håll koll på ränteändringar och uppdatera här</li>
              <li>• Se amorteringsplan för att förstå din tidslinje</li>
              <li>• Överväg att amortera extra på lån med hög ränta</li>
              <li>• Jämför räntor regelbundet för att hitta bättre villkor</li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
