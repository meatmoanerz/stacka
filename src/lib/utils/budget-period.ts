import { format, addMonths, subMonths, setDate, isAfter, isBefore, startOfDay } from 'date-fns'
import { sv } from 'date-fns/locale'
import type { BudgetPeriod } from '@/types'

/**
 * Get the budget period for a given date based on salary day
 * If salary day is 25th, "May Budget" runs from April 25 to May 24
 */
export function getBudgetPeriod(date: Date, salaryDay: number): BudgetPeriod {
  const today = startOfDay(date)
  const dayOfMonth = today.getDate()
  
  let periodMonth: Date
  
  if (dayOfMonth >= salaryDay) {
    // We're in the current month's budget period
    periodMonth = today
  } else {
    // We're still in last month's budget period
    periodMonth = subMonths(today, 1)
  }
  
  const startDate = setDate(periodMonth, salaryDay)
  const endDate = setDate(addMonths(periodMonth, 1), salaryDay - 1)
  
  return {
    period: format(addMonths(periodMonth, 1), 'yyyy-MM'),
    startDate,
    endDate,
    displayName: format(addMonths(periodMonth, 1), 'MMMM yyyy', { locale: sv }),
  }
}

/**
 * Get the current budget period based on salary day
 */
export function getCurrentBudgetPeriod(salaryDay: number): BudgetPeriod {
  return getBudgetPeriod(new Date(), salaryDay)
}

/**
 * Get the previous budget period
 */
export function getPreviousBudgetPeriod(salaryDay: number): BudgetPeriod {
  return getBudgetPeriod(subMonths(new Date(), 1), salaryDay)
}

/**
 * Get the next budget period
 */
export function getNextBudgetPeriod(salaryDay: number): BudgetPeriod {
  return getBudgetPeriod(addMonths(new Date(), 1), salaryDay)
}

/**
 * Check if a date is within a budget period
 */
export function isDateInPeriod(date: Date, period: BudgetPeriod): boolean {
  const day = startOfDay(date)
  return !isBefore(day, period.startDate) && !isAfter(day, period.endDate)
}

/**
 * Get days remaining until next salary
 */
export function getDaysUntilSalary(salaryDay: number): number {
  const today = new Date()
  const dayOfMonth = today.getDate()
  
  if (dayOfMonth < salaryDay) {
    return salaryDay - dayOfMonth
  } else if (dayOfMonth === salaryDay) {
    return 0
  } else {
    // Days until next month's salary day
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    return daysInMonth - dayOfMonth + salaryDay
  }
}

/**
 * Get progress through current budget period (0-100)
 */
export function getPeriodProgress(salaryDay: number): number {
  const period = getCurrentBudgetPeriod(salaryDay)
  const today = new Date()
  const totalDays = Math.ceil((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysPassed = Math.ceil((today.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  return Math.min(100, Math.max(0, (daysPassed / totalDays) * 100))
}

/**
 * Format a period string (YYYY-MM) to display name
 */
export function formatPeriodDisplay(period: string): string {
  const [year, month] = period.split('-').map(Number)
  const date = new Date(year, month - 1)
  return format(date, 'MMMM yyyy', { locale: sv })
}

/**
 * Get the budget period dates from a period string (YYYY-MM)
 * The period "2025-12" means December budget, which runs from Nov 25 to Dec 24 (if salaryDay is 25)
 */
export function getPeriodDates(periodStr: string, salaryDay: number): { startDate: Date; endDate: Date } {
  const [year, month] = periodStr.split('-').map(Number)
  
  // The start is previous month on salary day
  const startMonth = month === 1 ? 12 : month - 1
  const startYear = month === 1 ? year - 1 : year
  const startDate = new Date(startYear, startMonth - 1, salaryDay)
  
  // The end is current month on salary day - 1
  const endDate = new Date(year, month - 1, salaryDay - 1)
  
  return { startDate, endDate }
}

/**
 * Get array of recent periods for selection
 */
export function getRecentPeriods(salaryDay: number, count: number = 6): BudgetPeriod[] {
  const periods: BudgetPeriod[] = []
  const current = getCurrentBudgetPeriod(salaryDay)
  
  for (let i = 0; i < count; i++) {
    const date = subMonths(new Date(), i)
    periods.push(getBudgetPeriod(date, salaryDay))
  }
  
  return periods
}

/**
 * Get array of upcoming periods for selection (current + future)
 */
export function getNextPeriods(salaryDay: number, count: number = 6): BudgetPeriod[] {
  const periods: BudgetPeriod[] = []
  
  for (let i = 0; i < count; i++) {
    const date = addMonths(new Date(), i)
    periods.push(getBudgetPeriod(date, salaryDay))
  }
  
  return periods
}

