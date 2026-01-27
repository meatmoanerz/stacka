'use client'

import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface KPICardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  loading?: boolean
}

export function KPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  loading = false,
}: KPICardProps) {
  return (
    <div
      className={cn(
        'bg-slate-800 rounded-xl border border-slate-700 p-5 transition-all hover:border-slate-600',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          {loading ? (
            <div className="h-9 w-24 bg-slate-700 rounded animate-pulse mt-2" />
          ) : (
            <p className="text-3xl font-bold text-white mt-2">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          )}
          {description && (
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-slate-500">vs last period</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-slate-700/50 rounded-lg">
          <Icon className="w-6 h-6 text-emerald-400" />
        </div>
      </div>
    </div>
  )
}
