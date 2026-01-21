'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useUser } from '@/hooks/use-user'
import { useAnalyzeStatement } from '@/hooks/use-statement-analyzer'
import { getAllBanks } from '@/lib/statement/bank-configs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

interface Props {
  onSuccess: (analysisId: string) => void
}

export function StatementUploadForm({ onSuccess }: Props) {
  const { data: user } = useUser()
  const [selectedBank, setSelectedBank] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const analyzeStatement = useAnalyzeStatement()
  const banks = getAllBanks()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  })

  async function handleSubmit() {
    if (!file || !selectedBank || !user?.id) {
      toast.error('Välj bank och fil')
      return
    }

    try {
      const result = await analyzeStatement.mutateAsync({
        file,
        bankId: selectedBank,
        userId: user.id,
      })

      toast.success(`${result.transactionCount} transaktioner hittades!`)
      onSuccess(result.analysisId)
    } catch (error) {
      toast.error('Kunde inte analysera filen')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ladda upp kontoutdrag</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Välj bank</label>
          <Select value={selectedBank} onValueChange={setSelectedBank}>
            <SelectTrigger>
              <SelectValue placeholder="Välj din bank..." />
            </SelectTrigger>
            <SelectContent>
              {banks.map(bank => (
                <SelectItem key={bank.id} value={bank.id}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
            isDragActive ? "border-stacka-olive bg-stacka-sage/20" : "border-border hover:border-stacka-sage",
            file && "border-success bg-success/10"
          )}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex items-center justify-center gap-2 text-success">
              <FileText className="w-6 h-6" />
              <span className="font-medium">{file.name}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? 'Släpp filen här...'
                  : 'Dra och släpp en fil, eller klicka för att välja'}
              </p>
              <p className="text-xs text-muted-foreground">
                Stöder CSV och PDF
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!file || !selectedBank || analyzeStatement.isPending}
          className="w-full"
        >
          {analyzeStatement.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyserar...
            </>
          ) : (
            'Analysera kontoutdrag'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
