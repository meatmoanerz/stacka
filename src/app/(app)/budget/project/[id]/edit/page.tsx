'use client'

import { use } from 'react'
import { TemporaryBudgetForm } from '@/components/budget/temporary-budget-form'
import { useTemporaryBudget } from '@/hooks/use-temporary-budgets'
import { LoadingPage } from '@/components/shared/loading-spinner'

export default function EditProjectBudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: budget, isLoading } = useTemporaryBudget(id)

  if (isLoading) {
    return <LoadingPage />
  }

  if (!budget) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Projektbudget hittades inte</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <TemporaryBudgetForm existingBudget={budget} />
    </div>
  )
}
