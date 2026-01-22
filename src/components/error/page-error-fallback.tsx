'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface PageErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
  title?: string
}

export function PageErrorFallback({
  error,
  resetErrorBoundary,
  title = 'Något gick fel',
}: PageErrorFallbackProps) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto p-3 rounded-full bg-destructive/10 w-fit mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground text-center">
            Ett oväntat fel uppstod när sidan skulle laddas. Försök igen eller gå tillbaka till startsidan.
          </p>

          {process.env.NODE_ENV === 'development' && error && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Felmeddelande:</p>
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-32 text-destructive">
                {error.message}
              </pre>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={resetErrorBoundary}
              variant="default"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Försök igen
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex-1"
            >
              <Link href="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Gå till startsidan
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PageErrorFallback
