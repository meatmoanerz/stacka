/**
 * Centralized error handling utility for mutations
 * Provides Swedish error messages for different contexts and actions
 */

export type ErrorContext = 'expense' | 'budget' | 'recurring' | 'savings' | 'auth' | 'network'

export type ErrorAction = 'create' | 'delete' | 'update' | 'toggle'

/**
 * Swedish error messages mapping for each context and action
 */
const errorMessages: Record<ErrorContext, Record<ErrorAction, string>> = {
  expense: {
    create: 'Kunde inte spara utgiften. Försök igen.',
    delete: 'Kunde inte ta bort utgiften. Försök igen.',
    update: 'Kunde inte uppdatera utgiften. Försök igen.',
    toggle: 'Kunde inte ändra utgiften. Försök igen.',
  },
  budget: {
    create: 'Kunde inte skapa budgeten. Försök igen.',
    delete: 'Kunde inte ta bort budgeten. Försök igen.',
    update: 'Kunde inte uppdatera budgeten. Försök igen.',
    toggle: 'Kunde inte ändra budgeten. Försök igen.',
  },
  recurring: {
    create: 'Kunde inte skapa den återkommande utgiften. Försök igen.',
    delete: 'Kunde inte ta bort den återkommande utgiften. Försök igen.',
    update: 'Kunde inte uppdatera den återkommande utgiften. Försök igen.',
    toggle: 'Kunde inte ändra status på den återkommande utgiften. Försök igen.',
  },
  savings: {
    create: 'Kunde inte skapa sparmålet. Försök igen.',
    delete: 'Kunde inte ta bort sparmålet. Försök igen.',
    update: 'Kunde inte uppdatera sparmålet. Försök igen.',
    toggle: 'Kunde inte ändra sparmålet. Försök igen.',
  },
  auth: {
    create: 'Du måste vara inloggad för att utföra denna åtgärd.',
    delete: 'Du måste vara inloggad för att utföra denna åtgärd.',
    update: 'Du måste vara inloggad för att utföra denna åtgärd.',
    toggle: 'Du måste vara inloggad för att utföra denna åtgärd.',
  },
  network: {
    create: 'Nätverksfel. Kontrollera din internetanslutning.',
    delete: 'Nätverksfel. Kontrollera din internetanslutning.',
    update: 'Nätverksfel. Kontrollera din internetanslutning.',
    toggle: 'Nätverksfel. Kontrollera din internetanslutning.',
  },
}

/**
 * Network error messages
 */
const networkErrorMessages = [
  'Failed to fetch',
  'Network request failed',
  'NetworkError',
  'net::ERR_',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
]

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false

  const errorMessage = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : ''

  return networkErrorMessages.some(msg =>
    errorMessage.toLowerCase().includes(msg.toLowerCase())
  )
}

/**
 * Get the appropriate error message based on context, action, and error type
 */
export function getErrorMessage(
  context: ErrorContext,
  action: ErrorAction,
  error?: unknown
): string {
  // Check for network errors first
  if (isNetworkError(error)) {
    return errorMessages.network[action]
  }

  // Check for auth errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (message.includes('not authenticated') || message.includes('unauthorized') || message.includes('auth')) {
      return errorMessages.auth[action]
    }
  }

  // Return context-specific error message
  return errorMessages[context][action]
}

/**
 * Handle mutation error with toast notification
 * Returns the error message for optional additional handling
 */
export function handleMutationError(
  context: ErrorContext,
  action: ErrorAction,
  error: unknown,
  toastFn: (message: string) => void
): string {
  const message = getErrorMessage(context, action, error)
  toastFn(message)

  // Log the actual error for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}/${action}] Error:`, error)
  }

  return message
}

/**
 * Generate a temporary ID for optimistic updates
 * Uses a prefix to easily identify optimistic items
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Check if an ID is a temporary/optimistic ID
 */
export function isTempId(id: string): boolean {
  return id.startsWith('temp_')
}
