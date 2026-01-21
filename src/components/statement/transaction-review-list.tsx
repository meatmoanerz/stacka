'use client'

import { useState } from 'react'
import { useStatementTransactions, useUpdateTransactionCategory, useImportTransactions, type StatementTransactionWithCategory } from '@/hooks/use-statement-analyzer'
import { useCategories } from '@/hooks/use-categories'
import { useUser } from '@/hooks/use-user'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency } from '@/lib/utils/formatters'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

interface Props {
  analysisId: string
}

export function TransactionReviewList({ analysisId }: Props) {
  const { data: user } = useUser()
  const { data: transactions, isLoading } = useStatementTransactions(analysisId)
  const { data: categories } = useCategories()
  const updateCategory = useUpdateTransactionCategory()
  const importTransactions = useImportTransactions()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
  }

  const pendingTransactions = transactions?.filter(t => !t.is_saved && t.is_expense) || []
  const savedTransactions = transactions?.filter(t => t.is_saved) || []

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
    const allWithCategory = pendingTransactions
      .filter(t => t.confirmed_category_id)
      .map(t => t.id)
    setSelectedIds(new Set(allWithCategory))
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
    } catch (error) {
      toast.error('Kunde inte importera')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {pendingTransactions.length} transaktioner att granska
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Välj alla med kategori
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={selectedIds.size === 0 || importTransactions.isPending}
          >
            {importTransactions.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Importera ({selectedIds.size})
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {pendingTransactions.map(transaction => (
            <div
              key={transaction.id}
              className={cn(
                "p-4 flex items-center gap-4",
                selectedIds.has(transaction.id) && "bg-stacka-sage/10"
              )}
            >
              <Checkbox
                checked={selectedIds.has(transaction.id)}
                onCheckedChange={() => toggleSelect(transaction.id)}
                disabled={!transaction.confirmed_category_id}
              />

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{transaction.description}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(transaction.date), 'd MMM yyyy', { locale: sv })}
                </p>
              </div>

              <div className="w-48">
                <Select
                  value={transaction.confirmed_category_id || ''}
                  onValueChange={(value) => {
                    updateCategory.mutate({
                      transactionId: transaction.id,
                      categoryId: value
                    })
                  }}
                >
                  <SelectTrigger className="h-9">
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
              </div>

              <div className="w-24 text-right font-medium">
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {savedTransactions.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Redan importerade ({savedTransactions.length})
          </h3>
          <Card className="opacity-60">
            <CardContent className="p-0 divide-y">
              {savedTransactions.slice(0, 5).map(t => (
                <div key={t.id} className="p-3 flex items-center gap-3">
                  <Check className="w-4 h-4 text-success" />
                  <span className="flex-1 truncate text-sm">{t.description}</span>
                  <span className="text-sm">{formatCurrency(t.amount)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
