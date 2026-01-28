'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useCreateExpense } from '@/hooks/use-expenses'
import { useCategoriesByType } from '@/hooks/use-categories'
import { useUser, usePartner } from '@/hooks/use-user'
import { toast } from 'sonner'
import { Loader2, CreditCard, ChevronDown, Check, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import type { Category } from '@/types'

const expenseSchema = z.object({
  amount: z.number().positive('Belopp måste vara positivt'),
  description: z.string().min(1, 'Beskrivning krävs'),
  category_id: z.string().uuid('Välj en kategori'),
  date: z.string(),
  is_ccm: z.boolean(),
  cost_assignment: z.enum(['personal', 'shared', 'partner']),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface ExpenseFormCompactProps {
  onSuccess?: () => void
}

export function ExpenseFormCompact({ onSuccess }: ExpenseFormCompactProps) {
  const { data: user } = useUser()
  const { data: partner } = usePartner()
  const { fixed, variable, savings } = useCategoriesByType()
  const createExpense = useCreateExpense()
  const hasPartner = !!partner
  const [amountDisplay, setAmountDisplay] = useState('')
  const [categoryOpen, setCategoryOpen] = useState(false)
  const amountInputRef = useRef<HTMLInputElement>(null)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const isCCMEnabled = user?.ccm_enabled || false

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      description: '',
      category_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      is_ccm: isCCMEnabled,
      cost_assignment: 'shared',
    },
  })

  const allCategories = useMemo(() => [...variable, ...fixed, ...savings], [variable, fixed, savings])
  const selectedCategory = allCategories.find(c => c.id === form.watch('category_id'))

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '') {
      setAmountDisplay('')
      form.setValue('amount', 0)
      return
    }
    const numValue = parseInt(value.replace(/\D/g, ''), 10)
    if (!isNaN(numValue)) {
      setAmountDisplay(numValue.toString())
      form.setValue('amount', numValue)
    }
  }

  const handleCategorySelect = (category: Category) => {
    form.setValue('category_id', category.id)
    setCategoryOpen(false)
  }

  const formatDisplayDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return format(date, 'd MMM', { locale: sv })
    } catch {
      return dateStr
    }
  }

  async function onSubmit(data: ExpenseFormData) {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    try {
      await createExpense.mutateAsync({
        ...data,
        user_id: user?.id || '',
      })
      toast.success('Utgift sparad! 💰')
      setAmountDisplay('')
      form.reset({
        amount: 0,
        description: '',
        category_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        is_ccm: isCCMEnabled,
        cost_assignment: 'shared',
      })
      onSuccess?.()
    } catch {
      toast.error('Kunde inte spara utgift')
    }
  }

  // Category groups for chips
  const categoryGroups = [
    { label: 'Rörligt', items: variable },
    { label: 'Fast', items: fixed },
    { label: 'Spar', items: savings },
  ]

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      {/* Row 1: Amount + Description (side by side) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Amount - Compact */}
        <div className="rounded-xl bg-stacka-sage/20 p-3">
          <div className="flex items-baseline gap-1">
            <input
              ref={amountInputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={amountDisplay}
              onChange={handleAmountChange}
              className="text-2xl font-bold bg-transparent placeholder:text-muted-foreground/30 caret-stacka-olive tabular-nums text-right w-full"
              style={{ outline: 'none', boxShadow: 'none', border: 'none' }}
              autoFocus
            />
            <span className="text-sm text-muted-foreground font-medium shrink-0">kr</span>
          </div>
          {form.formState.errors.amount && (
            <p className="text-destructive text-[10px] mt-1">{form.formState.errors.amount.message}</p>
          )}
        </div>

        {/* Description - Compact */}
        <div className="flex flex-col justify-center">
          <input
            placeholder="Beskrivning"
            {...form.register('description')}
            className="w-full h-full px-3 rounded-xl bg-muted text-sm placeholder:text-muted-foreground/50"
            style={{ outline: 'none', boxShadow: 'none' }}
          />
        </div>
      </div>

      {/* Row 2: Category chips (scrollable) */}
      <div ref={categoryDropdownRef} className="relative">
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {categoryGroups.map((group) => (
            group.items.slice(0, 4).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  form.watch('category_id') === cat.id
                    ? "bg-stacka-olive text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {cat.name}
              </button>
            ))
          ))}
          <button
            type="button"
            onClick={() => setCategoryOpen(!categoryOpen)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 flex items-center gap-1"
          >
            Fler
            <ChevronDown className={cn("w-3 h-3 transition-transform", categoryOpen && "rotate-180")} />
          </button>
        </div>

        {/* Dropdown for all categories */}
        {categoryOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-card rounded-xl shadow-lg border border-border max-h-48 overflow-y-auto">
            {categoryGroups.map((group) => (
              group.items.length > 0 && (
                <div key={group.label}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground bg-muted/50 uppercase">
                    {group.label}
                  </div>
                  <div className="grid grid-cols-2 gap-0.5 p-1">
                    {group.items.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategorySelect(cat)}
                        className={cn(
                          "px-2 py-1.5 text-left text-xs rounded hover:bg-muted/50 flex items-center justify-between",
                          form.watch('category_id') === cat.id && "bg-stacka-sage/30"
                        )}
                      >
                        <span>{cat.name}</span>
                        {form.watch('category_id') === cat.id && (
                          <Check className="w-3 h-3 text-stacka-olive" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
        {form.formState.errors.category_id && (
          <p className="text-destructive text-[10px] mt-1">{form.formState.errors.category_id.message}</p>
        )}
      </div>

      {/* Row 3: Date + Cost Assignment + CCM (horizontal) */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Date - Compact button */}
        <button
          type="button"
          onClick={() => dateInputRef.current?.showPicker?.()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs"
        >
          <Calendar className="w-3 h-3 text-muted-foreground" />
          {formatDisplayDate(form.watch('date'))}
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={form.watch('date')}
          onChange={(e) => form.setValue('date', e.target.value)}
          className="sr-only"
        />

        {/* Cost Assignment - Radio-style buttons */}
        {hasPartner && (
          <div className="flex rounded-lg bg-muted p-0.5">
            <button
              type="button"
              onClick={() => form.setValue('cost_assignment', 'personal')}
              className={cn(
                "px-2 py-1 rounded text-[10px] font-medium transition-all",
                form.watch('cost_assignment') === 'personal'
                  ? "bg-white dark:bg-card shadow-sm text-stacka-olive"
                  : "text-muted-foreground"
              )}
            >
              {user?.first_name?.slice(0, 3) || 'Jag'}
            </button>
            <button
              type="button"
              onClick={() => form.setValue('cost_assignment', 'shared')}
              className={cn(
                "px-2 py-1 rounded text-[10px] font-medium transition-all",
                form.watch('cost_assignment') === 'shared'
                  ? "bg-white dark:bg-card shadow-sm text-stacka-olive"
                  : "text-muted-foreground"
              )}
            >
              50/50
            </button>
            <button
              type="button"
              onClick={() => form.setValue('cost_assignment', 'partner')}
              className={cn(
                "px-2 py-1 rounded text-[10px] font-medium transition-all",
                form.watch('cost_assignment') === 'partner'
                  ? "bg-white dark:bg-card shadow-sm text-stacka-olive"
                  : "text-muted-foreground"
              )}
            >
              {partner?.first_name?.slice(0, 3) || 'P'}
            </button>
          </div>
        )}

        {/* CCM Toggle - Compact */}
        {isCCMEnabled && (
          <button
            type="button"
            onClick={() => form.setValue('is_ccm', !form.watch('is_ccm'))}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all",
              form.watch('is_ccm')
                ? "bg-stacka-coral/20 text-stacka-coral"
                : "bg-muted text-muted-foreground"
            )}
          >
            <CreditCard className="w-3 h-3" />
            CCM
          </button>
        )}

        {/* Submit - Compact but prominent */}
        <Button
          type="submit"
          size="sm"
          className="ml-auto h-8 px-4"
          disabled={createExpense.isPending}
        >
          {createExpense.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            'Spara'
          )}
        </Button>
      </div>
    </form>
  )
}
