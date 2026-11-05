export type TransactionType = 'INCOME' | 'EXPENSE'
export type SourceType =
  'WEB' | 'BOT_TEXT' | 'BOT_AUDIO' | 'BOT_IMAGE' | 'BOT_PDF'

export interface Transaction {
  id: number
  amount: string
  description: string
  date: string
  type: TransactionType
  sourceType: SourceType
  installment: boolean
  installmentNumber: number | null
  totalInstallments: number | null
  installmentGroupId: string | null
  accountId: number
  accountName: string
  categoryId: number
  categoryName: string
  createdAt: string
}

export interface TransactionPage {
  content: Transaction[]
  number: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface TransactionSearch {
  startDate: string
  endDate: string
  type: '' | TransactionType
  accountId: string
  categoryId: string
  page: number
  size: number
}

export const EMPTY_SEARCH: TransactionSearch = {
  startDate: '',
  endDate: '',
  type: '',
  accountId: '',
  categoryId: '',
  page: 0,
  size: 20,
}

export function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  const date = new Date(`${value}T12:00:00Z`)
  return (
    Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value
  )
}

export function isResourceId(value: unknown): boolean {
  if (typeof value !== 'string' && typeof value !== 'number') return false
  const text = String(value)
  return /^[1-9]\d{0,18}$/.test(text) && BigInt(text) <= 9223372036854775807n
}

export function normalizeTransactionSearch(
  raw: Record<string, unknown>,
): TransactionSearch {
  const page = Number(raw.page ?? 0)
  const size = Number(raw.size ?? 20)
  return {
    startDate: isDate(raw.startDate) ? raw.startDate : '',
    endDate: isDate(raw.endDate) ? raw.endDate : '',
    type: raw.type === 'INCOME' || raw.type === 'EXPENSE' ? raw.type : '',
    accountId: isResourceId(raw.accountId) ? String(raw.accountId) : '',
    categoryId: isResourceId(raw.categoryId) ? String(raw.categoryId) : '',
    page:
      Number.isSafeInteger(page) && page >= 0 && page <= 2147483647 ? page : 0,
    size: [10, 20, 50].includes(size) ? size : 20,
  }
}

export function transactionQuery(search: TransactionSearch) {
  const params = new URLSearchParams({
    page: String(search.page),
    size: String(search.size),
  })
  for (const name of [
    'startDate',
    'endDate',
    'type',
    'accountId',
    'categoryId',
  ] as const) {
    if (search[name]) params.set(name, search[name])
  }
  params.append('sort', 'date,desc')
  params.append('sort', 'id,desc')
  return params.toString()
}

export function today() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function formatTransactionDate(date: string) {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`
}

// Mantém o decimal como texto até a serialização; a API recebe um número JSON exato.
export function normalizeAmount(input: string): string | null {
  const value = input.trim()
  if (!/^\d{1,17}([.,]\d{1,2})?$/.test(value)) return null
  const [whole, fraction = ''] = value.replace(',', '.').split('.')
  const integer = whole.replace(/^0+(?=\d)/, '')
  const cents = fraction.padEnd(2, '0')
  return BigInt(integer + cents) > 0n ? `${integer}.${cents}` : null
}

export interface TransactionInput {
  amount: string
  description: string
  date: string
  type: TransactionType
  sourceType: SourceType
  accountId: number
  categoryId: number
}

export function serializeTransaction(input: TransactionInput) {
  if (normalizeAmount(input.amount) !== input.amount)
    throw new Error('Valor monetário inválido.')
  if (
    ![input.accountId, input.categoryId].every(
      (id) => Number.isSafeInteger(id) && id > 0,
    )
  )
    throw new Error('Referência inválida.')
  const { amount, ...fields } = input
  return `{"amount":${amount},${JSON.stringify(fields).slice(1)}`
}

export const sourceLabels: Partial<Record<SourceType, string>> = {
  WEB: 'Site',
  BOT_TEXT: 'Telegram · texto',
  BOT_AUDIO: 'Telegram · áudio',
  BOT_IMAGE: 'Telegram · imagem',
  BOT_PDF: 'Telegram · PDF',
}

// Preserva o literal decimal da API, inclusive acima da precisão de Number.
// Cada string JSON é consumida inteira para não modificar descrições escapadas.
export function decodeTransactionJson<T>(text: string): T {
  const protectedAmounts = text.replace(
    /("(?:\\.|[^"\\])*")(?:\s*:\s*(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?))?/g,
    (match, key: string, amount: string | undefined) =>
      amount !== undefined && JSON.parse(key) === 'amount'
        ? `${key}:${JSON.stringify(amount)}`
        : match,
  )
  return JSON.parse(protectedAmounts) as T
}

export function formatTransactionAmount(value: string) {
  const amount = normalizeAmount(value)
  if (!amount) return 'Valor indisponível'
  const [integer, cents] = amount.split('.')
  return `R$ ${BigInt(integer).toLocaleString('pt-BR')},${cents}`
}

export function monthPeriod(month: string) {
  const startDate = `${month}-01`
  if (!isDate(startDate)) throw new Error('Período inválido.')
  const end = new Date(`${startDate}T12:00:00Z`)
  end.setUTCMonth(end.getUTCMonth() + 1, 0)
  return { startDate, endDate: end.toISOString().slice(0, 10) }
}
