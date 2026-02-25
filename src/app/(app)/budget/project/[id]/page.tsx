'use client'

import { use } from 'react'
import { TemporaryBudgetDetail } from '@/components/budget/temporary-budget-detail'

export default function ProjectBudgetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <TemporaryBudgetDetail id={id} />
}
