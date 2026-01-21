'use client'

import { useState } from 'react'
import { useStatementAnalyses } from '@/hooks/use-statement-analyzer'
import { StatementUploadForm } from '@/components/statement/statement-upload-form'
import { TransactionReviewList } from '@/components/statement/transaction-review-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import { FileText, Upload, History } from 'lucide-react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'

export default function StatementAnalyzerPage() {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null)
  const { data: analyses } = useStatementAnalyses()

  return (
    <div className="p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-stacka-olive">
          Statement Analyzer
        </h1>
        <p className="text-sm text-muted-foreground">
          Ladda upp kontoutdrag och importera transaktioner
        </p>
      </motion.div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="w-4 h-4" />
            Ladda upp
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            Historik
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <StatementUploadForm
            onSuccess={(id) => setSelectedAnalysisId(id)}
          />

          {selectedAnalysisId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <TransactionReviewList analysisId={selectedAnalysisId} />
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Tidigare analyser</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {analyses?.map(analysis => (
                <button
                  key={analysis.id}
                  onClick={() => setSelectedAnalysisId(analysis.id)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
                >
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{analysis.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {analysis.bank_name} • {analysis.transaction_count} transaktioner
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(analysis.created_at), 'd MMM yyyy', { locale: sv })}
                  </span>
                </button>
              ))}
              {analyses?.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  Inga analyser ännu
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
