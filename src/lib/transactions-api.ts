import { apiRequest } from '@/lib/api'
import {
  decodeTransactionJson,
  normalizeAmount,
  serializeTransaction,
  transactionQuery,
} from './transaction-model'
import type {
  Transaction,
  TransactionInput,
  TransactionPage,
  TransactionSearch,
} from './transaction-model'

function transactionPath(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0)
    throw new Error('Identificador inválido.')
  return `/transactions/${id}`
}

function validateTransaction(record: Transaction | null | undefined) {
  if (
    !record ||
    ![record.id, record.accountId, record.categoryId].every(
      (id) => Number.isSafeInteger(id) && id > 0,
    ) ||
    typeof record.amount !== 'string' ||
    !normalizeAmount(record.amount) ||
    typeof record.description !== 'string'
  ) {
    throw new Error('Resposta de transação inválida.')
  }
  return record
}

export async function getTransactions(
  search: TransactionSearch,
  signal?: AbortSignal,
) {
  const page = await apiRequest<TransactionPage | null>(
    `/transactions?${transactionQuery(search)}`,
    { signal },
    decodeTransactionJson<TransactionPage | null>,
  )
  if (
    !page ||
    !Array.isArray(page.content) ||
    ![page.number, page.totalPages, page.totalElements].every(
      (value) => Number.isSafeInteger(value) && value >= 0,
    )
  ) {
    throw new Error('Resposta de paginação inválida.')
  }
  page.content.forEach(validateTransaction)
  return page
}

export async function getTransaction(id: number, signal?: AbortSignal) {
  return validateTransaction(
    await apiRequest<Transaction>(
      transactionPath(id),
      { signal },
      decodeTransactionJson<Transaction>,
    ),
  )
}

export async function createTransaction(input: TransactionInput, key: string) {
  const result = await apiRequest<{ transaction: Transaction }>(
    '/transactions',
    {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: serializeTransaction(input),
    },
    decodeTransactionJson<{ transaction: Transaction }>,
  )
  return validateTransaction(result.transaction)
}

export async function updateTransaction(id: number, input: TransactionInput) {
  return validateTransaction(
    await apiRequest<Transaction>(
      transactionPath(id),
      {
        method: 'PUT',
        body: serializeTransaction(input),
      },
      decodeTransactionJson<Transaction>,
    ),
  )
}

export async function deleteTransaction(id: number) {
  return apiRequest<void>(transactionPath(id), { method: 'DELETE' })
}
