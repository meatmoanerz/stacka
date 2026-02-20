'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts'
import { formatCompact, formatCurrency } from '@/lib/utils/formatters'
import type { PeriodSummary } from '@/hooks/use-report-data'

interface ReportHistoryChartProps {
  data: PeriodSummary[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-1 capitalize">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">
            {entry.name === 'totalExpenses' ? 'Utgifter' : 'Inkomst'}:
          </span>
          <span className="font-medium">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function ReportHistoryChart({ data }: ReportHistoryChartProps) {
  // Format period labels to short month names
  const chartData = data.map(d => ({
    ...d,
    label: d.displayName.split(' ')[0]?.substring(0, 3) || d.period,
  }))

  if (chartData.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">12-månaders historik</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Inte tillräckligt med data</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">12-månaders historik</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F3C3B2" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#F3C3B2" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatCompact(v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="totalExpenses"
                stroke="#F3C3B2"
                strokeWidth={2}
                fill="url(#expenseGradient)"
                name="totalExpenses"
              />
              <Line
                type="monotone"
                dataKey="totalIncome"
                stroke="#4A5D41"
                strokeWidth={2}
                dot={false}
                name="totalIncome"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-1 rounded-full bg-[#F3C3B2]" />
            Utgifter
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-1 rounded-full bg-[#4A5D41]" />
            Inkomst
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
