'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { BudgetForm } from '@/components/budget/budget-form'
import { LoadingPage } from '@/components/shared/loading-spinner'
import { useNextAvailablePeriod } from '@/hooks/use-budgets'
import { useUser } from '@/hooks/use-user'

function BudgetNewContent() {
  const searchParams = useSearchParams()
  const urlPeriod = searchParams.get('period')
  const { data: user } = useUser()
  const salaryDay = user?.salary_day || 25
  const { period: nextAvailablePeriod, isLoading } = useNextAvailablePeriod(salaryDay)
  
  // Use URL period if provided, otherwise use next available period
  const defaultPeriod = urlPeriod || nextAvailablePeriod

  if (isLoading && !urlPeriod) {
    return <LoadingPage />
  }

  return (
    <div className="p-4">
      <BudgetForm defaultPeriod={defaultPeriod} />
    </div>
  )
}

export default function BudgetNewPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <BudgetNewContent />
    </Suspense>
  )
}

