'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect if the mobile keyboard is open
 * Uses the Visual Viewport API for accurate detection
 */
export function useKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    // Only run on client and if Visual Viewport API is available
    if (typeof window === 'undefined' || !window.visualViewport) {
      return
    }

    const viewport = window.visualViewport
    const initialHeight = viewport.height

    const handleResize = () => {
      // Keyboard is considered open if viewport height decreased significantly (> 150px)
      // This accounts for address bar changes but catches keyboard opening
      const heightDiff = initialHeight - viewport.height
      const keyboardOpen = heightDiff > 150

      setIsKeyboardOpen(keyboardOpen)

      // Also toggle a class on the document for CSS-based solutions
      if (keyboardOpen) {
        document.documentElement.classList.add('keyboard-open')
      } else {
        document.documentElement.classList.remove('keyboard-open')
      }
    }

    viewport.addEventListener('resize', handleResize)

    return () => {
      viewport.removeEventListener('resize', handleResize)
      document.documentElement.classList.remove('keyboard-open')
    }
  }, [])

  return isKeyboardOpen
}
