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
import { Loader2, CreditCard, ChevronDown, Check } from 'lucide-react'
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

interface ExpenseFormProps {
  onSuccess?: () => void
}

export function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const { data: user } = useUser()
  const { data: partner } = usePartner()
  const { fixed, variable, savings } = useCategoriesByType()
  const createExpense = useCreateExpense()
  const hasPartner = !!partner
  const [amountDisplay, setAmountDisplay] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [categoryOpen, setCategoryOpen] = useState(false)
  const amountInputRef = useRef<HTMLInputElement>(null)
  const categoryInputRef = useRef<HTMLInputElement>(null)
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
      is_ccm: isCCMEnabled, // Default to true if CCM is enabled
      cost_assignment: 'shared', // Default: delad 50/50
    },
  })

  const allCategories = useMemo(() => [...variable, ...fixed, ...savings], [variable, fixed, savings])
  
  const selectedCategory = allCategories.find(c => c.id === form.watch('category_id'))

  const filteredCategories = useMemo(() => {
    if (!categorySearch) return { variable, fixed, savings }
    const search = categorySearch.toLowerCase()
    return {
      variable: variable.filter(c => c.name.toLowerCase().includes(search)),
      fixed: fixed.filter(c => c.name.toLowerCase().includes(search)),
      savings: savings.filter(c => c.name.toLowerCase().includes(search)),
    }
  }, [categorySearch, variable, fixed, savings])

  // Auto-focus amount input on mount
  useEffect(() => {
    if (amountInputRef.current) {
      amountInputRef.current.focus()
    }
  }, [])

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

  const handleAmountFocus = () => {
    if (amountInputRef.current && amountDisplay) {
      amountInputRef.current.select()
    }
  }

  const handleCategorySelect = (category: Category) => {
    form.setValue('category_id', category.id)
    setCategorySearch('')
    setCategoryOpen(false)
  }

  const formatDisplayDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return format(date, 'd MMMM yyyy', { locale: sv })
    } catch {
      return dateStr
    }
  }

  async function onSubmit(data: ExpenseFormData) {
    // Dismiss keyboard on mobile by blurring active element
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
      setCategorySearch('')
      form.reset({
        amount: 0,
        description: '',
        category_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        is_ccm: isCCMEnabled, // Default to true if CCM is enabled
        cost_assignment: 'shared', // Default: delad 50/50
      })
      if (amountInputRef.current) {
        amountInputRef.current.focus()
      }
      onSuccess?.()
    } catch {
      toast.error('Kunde inte spara utgift')
    }
  }

  const hasFilteredResults = filteredCategories.variable.length > 0 || 
    filteredCategories.fixed.length > 0 || 
    filteredCategories.savings.length > 0

  // Common input styles without focus ring - compact height
  const inputStyles = "w-full h-11 px-4 rounded-xl bg-muted text-sm transition-colors focus:outline-none focus:ring-0 focus:border-0"

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Amount - Compact centered input */}
      <div className="rounded-xl bg-stacka-sage/20 py-5 px-6">
        <p className="text-muted-foreground text-xs text-center mb-2">Belopp</p>
        <div className="flex items-baseline justify-center gap-1">
          <input
            ref={amountInputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
            value={amountDisplay}
            onChange={handleAmountChange}
            onFocus={handleAmountFocus}
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
        {form.formState.errors.amount && (
          <p className="text-destructive text-xs mt-2 text-center">
            {form.formState.errors.amount.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-muted-foreground text-sm">Beskrivning</Label>
        <input
          id="description"
          placeholder="Vad köpte du?"
          {...form.register('description')}
          className={cn(inputStyles, "placeholder:text-muted-foreground/50")}
          style={{ outline: 'none', boxShadow: 'none' }}
        />
        {form.formState.errors.description && (
          <p className="text-destructive text-xs">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      {/* Category - Searchable dropdown */}
      <div className="space-y-2" ref={categoryDropdownRef}>
        <Label className="text-muted-foreground text-sm">Kategori</Label>
        <div className="relative">
          <div
            className={cn(inputStyles, "flex items-center justify-between cursor-pointer")}
            onClick={() => {
              setCategoryOpen(true)
              setTimeout(() => categoryInputRef.current?.focus(), 0)
            }}
          >
            {categoryOpen ? (
              <input
                ref={categoryInputRef}
                type="text"
                placeholder="Sök kategori..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="flex-1 bg-transparent text-base placeholder:text-muted-foreground/50"
                style={{ outline: 'none', boxShadow: 'none', border: 'none' }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className={cn(!selectedCategory && "text-muted-foreground/50")}>
                {selectedCategory?.name || 'Välj kategori'}
              </span>
            )}
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", categoryOpen && "rotate-180")} />
          </div>
          
          {categoryOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-border max-h-64 overflow-y-auto">
              {!hasFilteredResults ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Ingen kategori hittades
                </div>
              ) : (
                <>
                  {filteredCategories.variable.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">
                        Rörliga kostnader
                      </div>
                      {filteredCategories.variable.map((cat) => (
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
                  {filteredCategories.fixed.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">
                        Fasta kostnader
                      </div>
                      {filteredCategories.fixed.map((cat) => (
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
                  {filteredCategories.savings.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">
                        Sparande
                      </div>
                      {filteredCategories.savings.map((cat) => (
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
                </>
              )}
            </div>
          )}
        </div>
        {form.formState.errors.category_id && (
          <p className="text-destructive text-xs">
            {form.formState.errors.category_id.message}
          </p>
        )}
      </div>

      {/* Date - Simple click to open */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-sm">Datum</Label>
        <button
          type="button"
          onClick={() => dateInputRef.current?.showPicker?.()}
          className={cn(inputStyles, "text-left cursor-pointer")}
        >
          {formatDisplayDate(form.watch('date'))}
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={form.watch('date')}
          onChange={(e) => form.setValue('date', e.target.value)}
          className="sr-only"
        />
      </div>

      {/* Cost Assignment - Only show if partner is connected */}
      {/* Default (no selection) = shared, selecting a name = that person pays */}
      {hasPartner && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground text-xs">Vems utgift?</Label>
            <span className="text-[10px] text-muted-foreground">
              {form.watch('cost_assignment') === 'shared' ? 'Delad 50/50' : ''}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => form.setValue('cost_assignment', form.watch('cost_assignment') === 'personal' ? 'shared' : 'personal')}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                form.watch('cost_assignment') === 'personal'
                  ? "bg-stacka-olive text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {user?.first_name || 'Mig'}
            </button>
            <button
              type="button"
              onClick={() => form.setValue('cost_assignment', form.watch('cost_assignment') === 'partner' ? 'shared' : 'partner')}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                form.watch('cost_assignment') === 'partner'
                  ? "bg-stacka-olive text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {partner?.first_name || 'Partner'}
            </button>
          </div>
        </div>
      )}

      {/* CCM Toggle */}
      {isCCMEnabled && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-stacka-peach/20">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-stacka-coral" />
            <div>
              <Label htmlFor="is_ccm" className="text-sm font-medium">
                Betald med kreditkort
              </Label>
              <p className="text-xs text-muted-foreground">
                Registreras som CCM-utgift
              </p>
            </div>
          </div>
          <Switch
            id="is_ccm"
            checked={form.watch('is_ccm')}
            onCheckedChange={(checked) => form.setValue('is_ccm', checked)}
          />
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-11"
        disabled={createExpense.isPending}
      >
        {createExpense.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sparar...
          </>
        ) : (
          'Spara utgift'
        )}
      </Button>
    </form>
  )
}
