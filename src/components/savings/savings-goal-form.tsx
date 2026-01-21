'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useCreateSavingsGoal } from '@/hooks/use-savings-goals'
import { useCategoriesByType } from '@/hooks/use-categories'
import { usePartner } from '@/hooks/use-user'
import { toast } from 'sonner'
import { Loader2, ChevronDown, Check, Target, Wallet, Calendar, PiggyBank } from 'lucide-react'
import { format, addMonths } from 'date-fns'
import { sv } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import type { Category, GoalCategory } from '@/types'

const goalCategoryIcons: Record<GoalCategory, string> = {
  emergency: '🛡️',
  vacation: '✈️',
  home: '🏠',
  car: '🚗',
  education: '📚',
  retirement: '👴',
  other: '🎯',
}

const goalCategoryLabels: Record<GoalCategory, string> = {
  emergency: 'Buffert',
  vacation: 'Semester',
  home: 'Boende',
  car: 'Bil',
  education: 'Utbildning',
  retirement: 'Pension',
  other: 'Övrigt',
}

const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Namn krävs'),
  description: z.string().optional(),
  target_amount: z.number().positive('Målbelopp måste vara positivt'),
  target_date: z.string().optional(),
  starting_balance: z.number().min(0, 'Kan inte vara negativt'),
  monthly_savings_enabled: z.boolean(),
  monthly_savings_amount: z.number().min(0),
  goal_category: z.enum(['emergency', 'vacation', 'home', 'car', 'education', 'retirement', 'other']),
  is_shared: z.boolean(),
  category_id: z.string().uuid('Välj en kategori'),
})

type SavingsGoalFormData = z.infer<typeof savingsGoalSchema>

interface SavingsGoalFormProps {
  onSuccess?: () => void
}

export function SavingsGoalForm({ onSuccess }: SavingsGoalFormProps) {
  const { data: partner } = usePartner()
  const { savings: savingsCategories } = useCategoriesByType()
  const createGoal = useCreateSavingsGoal()
  const hasPartner = !!partner

  const [amountDisplay, setAmountDisplay] = useState('')
  const [startingDisplay, setStartingDisplay] = useState('')
  const [monthlyDisplay, setMonthlyDisplay] = useState('')
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [goalTypeOpen, setGoalTypeOpen] = useState(false)

  const amountInputRef = useRef<HTMLInputElement>(null)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)
  const goalTypeDropdownRef = useRef<HTMLDivElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<SavingsGoalFormData>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: {
      name: '',
      description: '',
      target_amount: 0,
      target_date: format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
      starting_balance: 0,
      monthly_savings_enabled: false,
      monthly_savings_amount: 0,
      goal_category: 'other',
      is_shared: false,
      category_id: savingsCategories[0]?.id || '',
    },
  })

  // Set default category when categories load
  useEffect(() => {
    if (savingsCategories.length > 0 && !form.getValues('category_id')) {
      form.setValue('category_id', savingsCategories[0].id)
    }
  }, [savingsCategories, form])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryOpen(false)
      }
      if (goalTypeDropdownRef.current && !goalTypeDropdownRef.current.contains(event.target as Node)) {
        setGoalTypeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedCategory = savingsCategories.find(c => c.id === form.watch('category_id'))
  const selectedGoalCategory = form.watch('goal_category')

  const handleAmountChange = (setter: (val: string) => void, field: keyof SavingsGoalFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '') {
      setter('')
      form.setValue(field, 0 as never)
      return
    }
    const numValue = parseInt(value.replace(/\D/g, ''), 10)
    if (!isNaN(numValue)) {
      setter(numValue.toString())
      form.setValue(field, numValue as never)
    }
  }

  const handleCategorySelect = (category: Category) => {
    form.setValue('category_id', category.id)
    setCategoryOpen(false)
  }

  const handleGoalCategorySelect = (goalCategory: GoalCategory) => {
    form.setValue('goal_category', goalCategory)
    setGoalTypeOpen(false)
  }

  const formatDisplayDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return format(date, 'd MMMM yyyy', { locale: sv })
    } catch {
      return dateStr
    }
  }

  async function onSubmit(data: SavingsGoalFormData) {
    try {
      await createGoal.mutateAsync({
        ...data,
        user_id: '', // Will be set by hook
      })
      toast.success('Sparmål skapat!')

      // Reset form
      setAmountDisplay('')
      setStartingDisplay('')
      setMonthlyDisplay('')
      form.reset({
        name: '',
        description: '',
        target_amount: 0,
        target_date: format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
        starting_balance: 0,
        monthly_savings_enabled: false,
        monthly_savings_amount: 0,
        goal_category: 'other',
        is_shared: false,
        category_id: savingsCategories[0]?.id || '',
      })

      onSuccess?.()
    } catch {
      toast.error('Kunde inte skapa sparmål')
    }
  }

  const inputStyles = "w-full h-11 px-4 rounded-xl bg-muted text-sm transition-colors focus:outline-none focus:ring-0 focus:border-0"

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Target Amount - Large centered input */}
      <div className="rounded-xl bg-stacka-sage/20 py-5 px-6">
        <p className="text-muted-foreground text-xs text-center mb-2">Målbelopp</p>
        <div className="flex items-baseline justify-center gap-1">
          <input
            ref={amountInputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
            value={amountDisplay}
            onChange={handleAmountChange(setAmountDisplay, 'target_amount')}
            className="text-4xl font-bold bg-transparent placeholder:text-muted-foreground/30 caret-stacka-olive tabular-nums text-right"
            style={{
              outline: 'none',
              boxShadow: 'none',
              border: 'none',
              width: `${Math.max((amountDisplay || '0').length, 1) * 1.5}rem`,
              minWidth: '1.5rem',
              maxWidth: '12rem',
              padding: 0,
            }}
            autoFocus
          />
          <span className="text-xl text-muted-foreground font-medium shrink-0">kr</span>
        </div>
        {form.formState.errors.target_amount && (
          <p className="text-destructive text-xs mt-2 text-center">
            {form.formState.errors.target_amount.message}
          </p>
        )}
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-muted-foreground text-sm">Namn på sparmål</Label>
        <input
          id="name"
          placeholder="T.ex. Semesterresa, Buffert, Ny bil..."
          {...form.register('name')}
          className={cn(inputStyles, "placeholder:text-muted-foreground/50")}
          style={{ outline: 'none', boxShadow: 'none' }}
        />
        {form.formState.errors.name && (
          <p className="text-destructive text-xs">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* Goal Type Selector */}
      <div className="space-y-2" ref={goalTypeDropdownRef}>
        <Label className="text-muted-foreground text-sm">Typ av sparmål</Label>
        <div className="relative">
          <div
            className={cn(inputStyles, "flex items-center justify-between cursor-pointer")}
            onClick={() => setGoalTypeOpen(!goalTypeOpen)}
          >
            <div className="flex items-center gap-2">
              <span>{goalCategoryIcons[selectedGoalCategory]}</span>
              <span>{goalCategoryLabels[selectedGoalCategory]}</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", goalTypeOpen && "rotate-180")} />
          </div>

          {goalTypeOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-border max-h-64 overflow-y-auto">
              {(Object.keys(goalCategoryLabels) as GoalCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleGoalCategorySelect(cat)}
                  className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>{goalCategoryIcons[cat]}</span>
                    <span>{goalCategoryLabels[cat]}</span>
                  </div>
                  {selectedGoalCategory === cat && (
                    <Check className="w-4 h-4 text-stacka-olive" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category (Savings category from database) */}
      {savingsCategories.length > 0 && (
        <div className="space-y-2" ref={categoryDropdownRef}>
          <Label className="text-muted-foreground text-sm">Budgetkategori</Label>
          <div className="relative">
            <div
              className={cn(inputStyles, "flex items-center justify-between cursor-pointer")}
              onClick={() => setCategoryOpen(!categoryOpen)}
            >
              <span className={cn(!selectedCategory && "text-muted-foreground/50")}>
                {selectedCategory?.name || 'Välj kategori'}
              </span>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", categoryOpen && "rotate-180")} />
            </div>

            {categoryOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-border max-h-48 overflow-y-auto">
                {savingsCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center justify-between transition-colors"
                  >
                    <span>{cat.name}</span>
                    {form.watch('category_id') === cat.id && (
                      <Check className="w-4 h-4 text-stacka-olive" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Target Date */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-sm">Måldatum (valfritt)</Label>
        <button
          type="button"
          onClick={() => dateInputRef.current?.showPicker?.()}
          className={cn(inputStyles, "text-left cursor-pointer flex items-center gap-2")}
        >
          <Calendar className="w-4 h-4 text-muted-foreground" />
          {form.watch('target_date') ? formatDisplayDate(form.watch('target_date')!) : 'Välj datum'}
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={form.watch('target_date') || ''}
          onChange={(e) => form.setValue('target_date', e.target.value)}
          className="sr-only"
        />
      </div>

      {/* Starting Balance */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-sm">Redan sparat</Label>
        <div className="relative">
          <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
            value={startingDisplay}
            onChange={handleAmountChange(setStartingDisplay, 'starting_balance')}
            className={cn(inputStyles, "pl-10")}
            style={{ outline: 'none', boxShadow: 'none' }}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
        </div>
      </div>

      {/* Monthly Savings Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-stacka-peach/20">
        <div className="flex items-center gap-3">
          <PiggyBank className="w-5 h-5 text-stacka-coral" />
          <div>
            <Label htmlFor="monthly_savings" className="text-sm font-medium">
              Månadssparande
            </Label>
            <p className="text-xs text-muted-foreground">
              Spara automatiskt varje månad
            </p>
          </div>
        </div>
        <Switch
          id="monthly_savings"
          checked={form.watch('monthly_savings_enabled')}
          onCheckedChange={(checked) => form.setValue('monthly_savings_enabled', checked)}
        />
      </div>

      {/* Monthly Amount (if enabled) */}
      {form.watch('monthly_savings_enabled') && (
        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm">Belopp per månad</Label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={monthlyDisplay}
              onChange={handleAmountChange(setMonthlyDisplay, 'monthly_savings_amount')}
              className={inputStyles}
              style={{ outline: 'none', boxShadow: 'none' }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr/mån</span>
          </div>
        </div>
      )}

      {/* Shared with Partner */}
      {hasPartner && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-stacka-blue/10">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-stacka-blue" />
            <div>
              <Label htmlFor="is_shared" className="text-sm font-medium">
                Dela med partner
              </Label>
              <p className="text-xs text-muted-foreground">
                Spara tillsammans mot samma mål
              </p>
            </div>
          </div>
          <Switch
            id="is_shared"
            checked={form.watch('is_shared')}
            onCheckedChange={(checked) => form.setValue('is_shared', checked)}
          />
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-11"
        disabled={createGoal.isPending}
      >
        {createGoal.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sparar...
          </>
        ) : (
          'Skapa sparmål'
        )}
      </Button>
    </form>
  )
}
