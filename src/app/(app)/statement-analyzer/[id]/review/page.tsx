'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useStatementTransactions, useUpdateTransactionCategory, useUpdateTransactionCostAssignment, useUpdateTransactionAmount, useUpdateAnalysisInvoiceTotal, useImportTransactions, useBulkUpdateTransactionCategories, type StatementTransactionWithCategory } from '@/hooks/use-statement-analyzer'
import { useStatementAnalysis } from '@/hooks/use-statement-analyzer'
import { useCategories } from '@/hooks/use-categories'
import { useUser, usePartner } from '@/hooks/use-user'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency } from '@/lib/utils/formatters'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { Loader2, Check, User, ArrowLeft, FileText, AlertCircle, CheckCircle2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

type CostAssignment = 'personal' | 'shared' | 'partner'

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const analysisId = params.id as string

  const { data: user } = useUser()
  const { data: partner } = usePartner()
  const { data: analysis } = useStatementAnalysis(analysisId)
  const { data: transactions, isLoading } = useStatementTransactions(analysisId)
  const { data: categories } = useCategories()
  const updateCategory = useUpdateTransactionCategory()
  const updateCostAssignment = useUpdateTransactionCostAssignment()
  const updateAmount = useUpdateTransactionAmount()
  const updateInvoiceTotal = useUpdateAnalysisInvoiceTotal()
  const importTransactions = useImportTransactions()
  const bulkUpdateCategories = useBulkUpdateTransactionCategories()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingInvoiceTotal, setEditingInvoiceTotal] = useState(false)
  const [invoiceTotalInput, setInvoiceTotalInput] = useState('')
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('')
  const hasPartner = !!partner

  // Filter pending transactions (not saved, is expense)
  const pendingTransactions = useMemo(() =>
    transactions?.filter(t => !t.is_saved && t.is_expense) || [],
    [transactions]
  )

  // Calculate totals
  const calculatedTotal = useMemo(() =>
    pendingTransactions.reduce((sum, t) => sum + t.amount, 0),
    [pendingTransactions]
  )

  const selectedTotal = useMemo(() =>
    pendingTransactions
      .filter(t => selectedIds.has(t.id))
      .reduce((sum, t) => sum + t.amount, 0),
    [pendingTransactions, selectedIds]
  )

  // Check if all selected transactions have categories
  const allSelectedHaveCategories = useMemo(() => {
    if (selectedIds.size === 0) return false
    return pendingTransactions
      .filter(t => selectedIds.has(t.id))
      .every(t => t.confirmed_category_id !== null)
  }, [pendingTransactions, selectedIds])

  // Count selected transactions without category
  const selectedWithoutCategory = useMemo(() => {
    return pendingTransactions
      .filter(t => selectedIds.has(t.id) && !t.confirmed_category_id)
      .length
  }, [pendingTransactions, selectedIds])

  const invoiceTotal = analysis?.invoice_total || 0
  const totalDiff = Math.abs(invoiceTotal - calculatedTotal)
  const totalsMatch = totalDiff < 1 // Within 1 kr tolerance

  function toggleSelect(id: string) {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  function selectAll() {
    const allIds = pendingTransactions.map(t => t.id)
    setSelectedIds(new Set(allIds))
  }

  function deselectAll() {
    setSelectedIds(new Set())
  }

  async function handleBulkAssign() {
    if (!bulkCategoryId || selectedIds.size === 0) return

    try {
      await bulkUpdateCategories.mutateAsync({
        transactionIds: Array.from(selectedIds),
        categoryId: bulkCategoryId
      })
      toast.success(`Kategori tilldelad till ${selectedIds.size} transaktioner`)
      setBulkCategoryId('')
    } catch {
      toast.error('Kunde inte tilldela kategori')
    }
  }

  async function handleImport() {
    const toImport = pendingTransactions.filter(t => selectedIds.has(t.id)) as StatementTransactionWithCategory[]
    if (toImport.length === 0) {
      toast.error('Välj transaktioner att importera')
      return
    }

    const withoutCategory = toImport.filter(t => !t.confirmed_category_id)
    if (withoutCategory.length > 0) {
      toast.error('Alla valda transaktioner måste ha en kategori')
      return
    }

    try {
      await importTransactions.mutateAsync({
        transactions: toImport,
        userId: user!.id
      })
      toast.success(`${toImport.length} utgifter importerade!`)
      setSelectedIds(new Set())

      // Navigate back to expenses list
      router.push('/expenses/list')
    } catch {
      toast.error('Kunde inte importera')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-stacka-olive" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/statement-analyzer')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-stacka-olive">
            Granska transaktioner
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {analysis?.file_name}
          </p>
        </div>
      </motion.div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={cn(
          "border-2",
          totalsMatch ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              {totalsMatch ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <AlertCircle className="w-5 h-5 text-warning" />
              )}
              <span className="font-medium">
                {totalsMatch ? 'Beloppen stämmer' : 'Kontrollera beloppen'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground flex items-center gap-1">
                  Fakturatotal
                  <button
                    type="button"
                    onClick={() => {
                      setEditingInvoiceTotal(true)
                      setInvoiceTotalInput(invoiceTotal.toString())
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </p>
                {editingInvoiceTotal ? (
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      value={invoiceTotalInput}
                      onChange={(e) => setInvoiceTotalInput(e.target.value)}
                      className="w-24 h-8 px-2 text-base font-semibold rounded border bg-background"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newTotal = parseFloat(invoiceTotalInput)
                          if (!isNaN(newTotal) && newTotal >= 0) {
                            updateInvoiceTotal.mutate({ analysisId, invoiceTotal: newTotal })
                          }
                          setEditingInvoiceTotal(false)
                        } else if (e.key === 'Escape') {
                          setEditingInvoiceTotal(false)
                        }
                      }}
                      onBlur={() => {
                        const newTotal = parseFloat(invoiceTotalInput)
                        if (!isNaN(newTotal) && newTotal >= 0) {
                          updateInvoiceTotal.mutate({ analysisId, invoiceTotal: newTotal })
                        }
                        setEditingInvoiceTotal(false)
                      }}
                    />
                    <span className="text-base font-semibold">kr</span>
                  </div>
                ) : (
                  <p className="text-lg font-semibold">{formatCurrency(invoiceTotal)}</p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground">Summa transaktioner</p>
                <p className="text-lg font-semibold">{formatCurrency(calculatedTotal)}</p>
              </div>
            </div>
            {!totalsMatch && (
              <p className="text-xs text-warning mt-2">
                Differens: {formatCurrency(totalDiff)}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {pendingTransactions.length} transaktioner
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Välj alla
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="ghost" size="sm" onClick={deselectAll}>
              Avmarkera
            </Button>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-0 divide-y">
            {pendingTransactions.map((transaction, index) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                categories={categories || []}
                isSelected={selectedIds.has(transaction.id)}
                onToggleSelect={() => toggleSelect(transaction.id)}
                onUpdateCategory={(categoryId) => {
                  updateCategory.mutate({
                    transactionId: transaction.id,
                    categoryId
                  })
                }}
                onUpdateCostAssignment={(costAssignment) => {
                  updateCostAssignment.mutate({
                    transactionId: transaction.id,
                    costAssignment
                  })
                }}
                onUpdateAmount={(amount) => {
                  updateAmount.mutate({
                    transactionId: transaction.id,
                    amount
                  })
                }}
                index={index}
                userName={user?.first_name || 'Mig'}
                partnerName={partner?.first_name || 'Partner'}
                hasPartner={hasPartner}
              />
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Fixed bottom bar with bulk panel */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-20 left-0 right-0 bg-background border-t shadow-lg z-10"
        >
          <div className="max-w-lg mx-auto p-4 space-y-3">
            {/* Row 1: Selection info */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{selectedIds.size} valda</p>
                <p className="text-xs text-muted-foreground">
                  Summa: {formatCurrency(selectedTotal)}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={deselectAll}>
                Avmarkera alla
              </Button>
            </div>

            {/* Row 2: Bulk category assignment */}
            <div className="flex items-center gap-2">
              <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Välj kategori..." />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={handleBulkAssign}
                disabled={!bulkCategoryId || bulkUpdateCategories.isPending}
              >
                {bulkUpdateCategories.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Tilldela"
                )}
              </Button>
            </div>

            {/* Row 3: Save button */}
            <Button
              onClick={handleImport}
              disabled={!allSelectedHaveCategories || importTransactions.isPending}
              className="w-full bg-stacka-olive hover:bg-stacka-olive/90"
            >
              {importTransactions.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Spara som utgifter
              {selectedWithoutCategory > 0 && (
                <span className="ml-2 text-xs opacity-70">
                  ({selectedWithoutCategory} saknar kategori)
                </span>
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

interface TransactionRowProps {
  transaction: StatementTransactionWithCategory
  categories: { id: string; name: string }[]
  isSelected: boolean
  onToggleSelect: () => void
  onUpdateCategory: (categoryId: string) => void
  onUpdateCostAssignment: (costAssignment: CostAssignment) => void
  onUpdateAmount: (amount: number) => void
  index: number
  userName: string
  partnerName: string
  hasPartner: boolean
}

function TransactionRow({
  transaction,
  categories,
  isSelected,
  onToggleSelect,
  onUpdateCategory,
  onUpdateCostAssignment,
  onUpdateAmount,
  index,
  userName,
  partnerName,
  hasPartner
}: TransactionRowProps) {
  const costAssignment = transaction.cost_assignment || 'shared'
  const [editingAmount, setEditingAmount] = useState(false)
  const [amountInput, setAmountInput] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        "p-4 transition-colors",
        isSelected && "bg-stacka-sage/10"
      )}
    >
      {/* Row 1: Checkbox, Description, Amount */}
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium leading-tight">{transaction.description}</p>
            {!transaction.confirmed_category_id && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                <AlertCircle className="w-3 h-3" />
                Saknar kategori
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{format(new Date(transaction.date), 'd MMM yyyy', { locale: sv })}</span>
            {transaction.cardholder && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {transaction.cardholder.split(' ')[0]}
                </span>
              </>
            )}
          </div>
        </div>
        {/* Editable Amount */}
        {editingAmount ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-20 h-7 px-2 text-sm font-semibold tabular-nums rounded border bg-background text-right"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const newAmount = parseFloat(amountInput)
                  if (!isNaN(newAmount) && newAmount >= 0) {
                    onUpdateAmount(newAmount)
                  }
                  setEditingAmount(false)
                } else if (e.key === 'Escape') {
                  setEditingAmount(false)
                }
              }}
              onBlur={() => {
                const newAmount = parseFloat(amountInput)
                if (!isNaN(newAmount) && newAmount >= 0) {
                  onUpdateAmount(newAmount)
                }
                setEditingAmount(false)
              }}
            />
            <span className="text-sm">kr</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditingAmount(true)
              setAmountInput(transaction.amount.toString())
            }}
            className="font-semibold tabular-nums whitespace-nowrap hover:text-stacka-olive flex items-center gap-1 group"
          >
            {formatCurrency(transaction.amount)}
            <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50" />
          </button>
        )}
      </div>

      {/* Row 2: Cost Assignment & Category Dropdown */}
      <div className="flex items-center gap-3 mt-3 ml-7">
        {/* Cost Assignment - Two buttons like expense form */}
        {hasPartner && (
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onUpdateCostAssignment(costAssignment === 'personal' ? 'shared' : 'personal')}
              className={cn(
                "py-1.5 px-3 rounded-lg text-xs font-medium transition-all",
                costAssignment === 'personal'
                  ? "bg-stacka-olive text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {userName}
            </button>
            <button
              type="button"
              onClick={() => onUpdateCostAssignment(costAssignment === 'partner' ? 'shared' : 'partner')}
              className={cn(
                "py-1.5 px-3 rounded-lg text-xs font-medium transition-all",
                costAssignment === 'partner'
                  ? "bg-stacka-olive text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {partnerName}
            </button>
          </div>
        )}

        {/* Category Dropdown */}
        <Select
          value={transaction.confirmed_category_id || ''}
          onValueChange={onUpdateCategory}
        >
          <SelectTrigger className="h-9 flex-1">
            <SelectValue placeholder="Välj kategori..." />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Show "Delad 50/50" hint when no button is selected */}
      {hasPartner && costAssignment === 'shared' && (
        <p className="text-[10px] text-muted-foreground mt-1 ml-7">
          Delad 50/50
        </p>
      )}
    </motion.div>
  )
}
