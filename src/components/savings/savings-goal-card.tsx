'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils/formatters'
import { format, differenceInDays, differenceInMonths } from 'date-fns'
import { sv } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import { MoreHorizontal, Trash2, Edit2, CheckCircle2, Users, PiggyBank, Calendar } from 'lucide-react'
import { useDeleteSavingsGoal, useUpdateSavingsGoal } from '@/hooks/use-savings-goals'
import { toast } from 'sonner'
import type { SavingsGoalWithCategory, GoalCategory } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const goalCategoryIcons: Record<GoalCategory, string> = {
  emergency: '🛡️',
  vacation: '✈️',
  home: '🏠',
  car: '🚗',
  education: '📚',
  retirement: '👴',
  other: '🎯',
}

interface SavingsGoalCardProps {
  goal: SavingsGoalWithCategory
  onEdit?: (goal: SavingsGoalWithCategory) => void
}

export function SavingsGoalCard({ goal, onEdit }: SavingsGoalCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const deleteGoal = useDeleteSavingsGoal()
  const updateGoal = useUpdateSavingsGoal()

  // Calculate progress
  const currentAmount = goal.starting_balance + goal.starting_balance_user1 + goal.starting_balance_user2
  const targetAmount = goal.target_amount || 0
  const progressPercent = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0
  const remaining = Math.max(targetAmount - currentAmount, 0)
  const isCompleted = progressPercent >= 100

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!goal.target_date) return null
    const targetDate = new Date(goal.target_date)
    const today = new Date()
    const daysLeft = differenceInDays(targetDate, today)
    const monthsLeft = differenceInMonths(targetDate, today)

    if (daysLeft < 0) return 'Förfallet'
    if (daysLeft === 0) return 'Idag'
    if (daysLeft === 1) return '1 dag kvar'
    if (monthsLeft >= 2) return `${monthsLeft} månader kvar`
    return `${daysLeft} dagar kvar`
  }

  // Calculate monthly savings needed
  const getMonthlySavingsNeeded = () => {
    if (!goal.target_date || remaining <= 0) return null
    const targetDate = new Date(goal.target_date)
    const today = new Date()
    const monthsLeft = Math.max(differenceInMonths(targetDate, today), 1)
    return Math.ceil(remaining / monthsLeft)
  }

  const handleDelete = async () => {
    try {
      await deleteGoal.mutateAsync(goal.id)
      toast.success('Sparmål arkiverat')
      setShowDeleteDialog(false)
    } catch {
      toast.error('Kunde inte ta bort sparmålet')
    }
  }

  const handleMarkComplete = async () => {
    try {
      await updateGoal.mutateAsync({
        id: goal.id,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      toast.success('Grattis! Sparmål uppnått! 🎉')
    } catch {
      toast.error('Kunde inte uppdatera sparmålet')
    }
  }

  const timeRemaining = getTimeRemaining()
  const monthlySavingsNeeded = getMonthlySavingsNeeded()

  return (
    <>
      <Card className={cn(
        "border-0 shadow-sm overflow-hidden transition-all",
        isCompleted && "bg-stacka-sage/10 ring-2 ring-stacka-sage/30"
      )}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-stacka-peach/20 flex items-center justify-center text-lg">
                {goalCategoryIcons[goal.goal_category]}
              </div>
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  {goal.name}
                  {isCompleted && <CheckCircle2 className="w-4 h-4 text-stacka-olive" />}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {goal.category?.name}
                  {goal.is_shared && (
                    <span className="inline-flex items-center gap-1 ml-2 text-stacka-blue">
                      <Users className="w-3 h-3" />
                      Delat
                    </span>
                  )}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(goal)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Redigera
                  </DropdownMenuItem>
                )}
                {!isCompleted && (
                  <DropdownMenuItem onClick={handleMarkComplete}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Markera som uppnått
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Ta bort
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Progress */}
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{formatCurrency(currentAmount)}</span>
              <span className="text-muted-foreground">av {formatCurrency(targetAmount)}</span>
            </div>
            <Progress
              value={progressPercent}
              className={cn("h-2", isCompleted && "[&>div]:bg-stacka-olive")}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progressPercent.toFixed(0)}% uppnått</span>
              {remaining > 0 && <span>{formatCurrency(remaining)} kvar</span>}
            </div>
          </div>

          {/* Footer info */}
          <div className="flex flex-wrap gap-2 text-xs">
            {timeRemaining && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted">
                <Calendar className="w-3 h-3" />
                {timeRemaining}
              </div>
            )}
            {goal.monthly_savings_enabled && goal.monthly_savings_amount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-stacka-sage/20 text-stacka-olive">
                <PiggyBank className="w-3 h-3" />
                {formatCurrency(goal.monthly_savings_amount)}/mån
              </div>
            )}
            {monthlySavingsNeeded && !isCompleted && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-stacka-peach/20 text-stacka-coral">
                Behöver {formatCurrency(monthlySavingsNeeded)}/mån
              </div>
            )}
          </div>

          {/* Target date display */}
          {goal.target_date && (
            <p className="text-xs text-muted-foreground mt-2">
              Mål: {format(new Date(goal.target_date), 'd MMMM yyyy', { locale: sv })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort sparmål?</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort "{goal.name}"? Sparmålet kommer att arkiveras och kan inte återställas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
