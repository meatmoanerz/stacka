import { create } from 'zustand'

interface UIState {
  isSidebarOpen: boolean
  isAddExpenseOpen: boolean
  selectedPeriod: string | null
  
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openAddExpense: () => void
  closeAddExpense: () => void
  setSelectedPeriod: (period: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  isAddExpenseOpen: false,
  selectedPeriod: null,
  
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  openAddExpense: () => set({ isAddExpenseOpen: true }),
  closeAddExpense: () => set({ isAddExpenseOpen: false }),
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),
}))

