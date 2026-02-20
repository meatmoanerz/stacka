'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ReportSkeleton() {
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="text-center space-y-1">
          <Skeleton className="w-32 h-6 mx-auto" />
          <Skeleton className="w-20 h-4 mx-auto" />
        </div>
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>

      {/* Hero card */}
      <Skeleton className="w-full h-[130px] rounded-xl" />

      {/* Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <Skeleton className="w-40 h-5" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[220px]" />
        </CardContent>
      </Card>

      {/* Category ranking */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <Skeleton className="w-32 h-5" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-16 h-4" />
              </div>
              <Skeleton className="w-full h-2 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Budget variance */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <Skeleton className="w-36 h-5" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-1">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-2 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
