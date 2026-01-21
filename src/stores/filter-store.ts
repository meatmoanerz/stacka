import { create } from 'zustand'
import type { CostType } from '@/types'

interface FilterState {
  // Expense filters
  expenseCategoryFilter: string | null
  expenseCostTypeFilter: CostType | null
  expenseDateRange: { from: Date | null; to: Date | null }
  expenseSearchQuery: string
  
  // Budget filters  
  budgetPeriodFilter: string | null
  
  // Actions
  setExpenseCategoryFilter: (categoryId: string | null) => void
  setExpenseCostTypeFilter: (costType: CostType | null) => void
  setExpenseDateRange: (range: { from: Date | null; to: Date | null }) => void
  setExpenseSearchQuery: (query: string) => void
  setBudgetPeriodFilter: (period: string | null) => void
  clearExpenseFilters: () => void
}

export const useFilterStore = create<FilterState>((set) => ({
  // Initial state
  expenseCategoryFilter: null,
  expenseCostTypeFilter: null,
  expenseDateRange: { from: null, to: null },
  expenseSearchQuery: '',
  budgetPeriodFilter: null,
  
  // Actions
  setExpenseCategoryFilter: (categoryId) => set({ expenseCategoryFilter: categoryId }),
  setExpenseCostTypeFilter: (costType) => set({ expenseCostTypeFilter: costType }),
  setExpenseDateRange: (range) => set({ expenseDateRange: range }),
  setExpenseSearchQuery: (query) => set({ expenseSearchQuery: query }),
  setBudgetPeriodFilter: (period) => set({ budgetPeriodFilter: period }),
  clearExpenseFilters: () => set({
    expenseCategoryFilter: null,
    expenseCostTypeFilter: null,
    expenseDateRange: { from: null, to: null },
    expenseSearchQuery: '',
  }),
}))

