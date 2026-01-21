'use client'

import { use } from 'react'
import { useBudget } from '@/hooks/use-budgets'
import { BudgetForm } from '@/components/budget/budget-form'
import { LoadingPage } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function BudgetEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: budget, isLoading } = useBudget(id)

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

  return (
    <div className="p-4">
      <BudgetForm existingBudget={budget} />
    </div>
  )
}

