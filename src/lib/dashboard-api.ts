import { apiRequest } from '@/lib/api'

export interface DailySummary {
  date: string
  totalIncome: number
  totalExpense: number
}

export interface MonthlySummary {
  month: string
  startDate: string
  endDate: string
  totalIncome: number
  totalExpense: number
  balance: number
  transactionCount: number
  daily: DailySummary[]
  expensesByCategory: {
    categoryId: number
    categoryName: string
    totalExpense: number
  }[]
}

export async function getMonthlySummary(month: string, signal?: AbortSignal) {
  const summary = await apiRequest<MonthlySummary>(
    `/dashboard/monthly-summary?${new URLSearchParams({ month })}`,
    { signal },
  )
  if (summary.month !== month) {
    throw new Error('O período recebido não corresponde ao solicitado.')
  }
  return summary
}

export const formatCurrency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format

export function currentMonth() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function shiftMonth(month: string, offset: number) {
  const [year, number] = month.split('-').map(Number)
  const index = year * 12 + number - 1 + offset
  return `${String(Math.floor(index / 12)).padStart(4, '0')}-${String((index % 12) + 1).padStart(2, '0')}`
}

export function monthLabel(month: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-15T12:00:00Z`))
}
