import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Skeleton,
  SkeletonCard,
  SkeletonProgress,
  SkeletonList,
  SkeletonChart
} from '@/components/ui/skeleton'
import { motion } from 'framer-motion'

/**
 * Skeleton for KPI Cards (4 cards grid)
 */
export function KPICardsSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-2 gap-3"
    >
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </motion.div>
  )
}

/**
 * Skeleton for Budget Overview card
 */
export function BudgetOverviewSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <SkeletonProgress />
        <SkeletonProgress />
        <SkeletonProgress />
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton for Expense Chart card
 */
export function ExpenseChartSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <SkeletonChart />
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton for Recent Expenses list
 */
export function RecentExpensesSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
      </CardHeader>
      <CardContent>
        <SkeletonList count={5} withIcon />
      </CardContent>
    </Card>
  )
}

/**
 * Complete Dashboard Skeleton
 * Matches the exact layout of dashboard/page.tsx
 */
export function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-6">
      {/* Header Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </motion.div>

      {/* KPI Cards Skeleton */}
      <KPICardsSkeleton />

      {/* Charts Row Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <BudgetOverviewSkeleton />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ExpenseChartSkeleton />
        </motion.div>
      </div>

      {/* Recent Expenses Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <RecentExpensesSkeleton />
      </motion.div>
    </div>
  )
}
