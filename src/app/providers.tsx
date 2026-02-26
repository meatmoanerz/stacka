'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { useState } from 'react'
import { useKeyboard } from '@/hooks/use-keyboard'
import { useCapacitorInit } from '@/hooks/use-capacitor'

// Component to initialize keyboard detection globally
function KeyboardDetector() {
  useKeyboard()
  return null
}

// Component to initialize Capacitor native plugins (no-op on web)
function CapacitorInit() {
  useCapacitorInit()
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={true}
        storageKey="stacka-theme"
      >
        <KeyboardDetector />
        <CapacitorInit />
        {children}
        <Toaster
          richColors
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              color: 'var(--foreground)',
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

