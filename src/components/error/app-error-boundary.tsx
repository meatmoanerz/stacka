'use client'

import { ReactNode } from 'react'
import { ErrorBoundary } from './error-boundary'
import { PageErrorFallback } from './page-error-fallback'

interface AppErrorBoundaryProps {
  children: ReactNode
}

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={({ error, resetErrorBoundary }) => (
        <PageErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
          title="Ett fel uppstod"
        />
      )}
      onError={(error, errorInfo) => {
        // Log to console in development, could be sent to error tracking service in production
        if (process.env.NODE_ENV === 'development') {
          console.error('App Error Boundary:', error)
          console.error('Component stack:', errorInfo.componentStack)
        }
        // In production, you could send this to an error tracking service like Sentry
        // logErrorToService(error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export default AppErrorBoundary
