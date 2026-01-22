'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ComponentErrorBoundaryProps {
  children: ReactNode
  componentName?: string
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ComponentErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ComponentErrorBoundary extends Component<
  ComponentErrorBoundaryProps,
  ComponentErrorBoundaryState
> {
  constructor(props: ComponentErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ComponentErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for debugging
    const componentName = this.props.componentName || 'Unknown'
    console.error(`ComponentErrorBoundary [${componentName}] caught an error:`, error)
    console.error('Component stack:', errorInfo.componentStack)

    // Call optional onError callback
    this.props.onError?.(error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-destructive/10 shrink-0">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Kunde inte visa {this.props.componentName ? `"${this.props.componentName}"` : 'innehållet'}
                </p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <p className="text-xs text-destructive truncate">
                    {this.state.error.message}
                  </p>
                )}
                <Button
                  onClick={this.handleReset}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Försök igen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

export default ComponentErrorBoundary
