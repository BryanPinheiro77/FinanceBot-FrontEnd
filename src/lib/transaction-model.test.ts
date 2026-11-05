import { describe, expect, it } from 'vitest'
import {
  decodeTransactionJson,
  formatTransactionAmount,
  isDate,
  isResourceId,
  monthPeriod,
  normalizeAmount,
  normalizeTransactionSearch,
  serializeTransaction,
  transactionQuery,
} from './transaction-model'
import type { TransactionInput } from './transaction-model'

describe('valores e contratos de transações', () => {
  it.each([
    ['0,29', '0.29'],
    ['035.9', '35.90'],
    ['100', '100.00'],
    ['99999999999999999,99', '99999999999999999.99'],
  ])('preserva centavos de %s sem arredondar', (value, expected) =>
    expect(normalizeAmount(value)).toBe(expected),
  )
  it.each([
    '0',
    '-1',
    '1,001',
    '1.234,56',
    '1e3',
    'Infinity',
    'NaN',
    '1.2.3',
    '1,"description":"injetado"',
    '100000000000000000',
  ])('recusa valor inválido %s', (value) =>
    expect(normalizeAmount(value)).toBeNull(),
  )
  it('decodifica literais monetários sem perda e não modifica conteúdo textual', () => {
    const description = 'Texto com "amount":42 e barra \\ restante'
    const raw = JSON.stringify({
      content: [{ id: 5, amount: 0, description }],
      totalElements: 1,
    }).replace('"amount":0', '"amount":99999999999999999.99')
    const decoded = decodeTransactionJson<{
      content: { id: number; amount: string; description: string }[]
      totalElements: number
    }>(raw)
    expect(decoded.content[0].amount).toBe('99999999999999999.99')
    expect(decoded.content[0].description).toBe(description)
    expect(decoded.content[0].id).toBe(5)
    expect(decoded.totalElements).toBe(1)
    for (const invalid of ['01', '+1', '.1', '1.']) {
      expect(() => decodeTransactionJson(`{"amount":${invalid}}`)).toThrow()
    }
    expect(formatTransactionAmount(decoded.content[0].amount)).toBe(
      'R$ 99.999.999.999.999.999,99',
    )
  })
  it('envia um número JSON exato e mantém descrições escapadas', () => {
    const input: TransactionInput = {
      amount: '99999999999999999.99',
      description: 'Conta "A"\nlinha',
      date: '2026-11-05',
      type: 'EXPENSE',
      sourceType: 'BOT_AUDIO',
      accountId: 3,
      categoryId: 7,
    }
    const body = serializeTransaction(input)
    expect(body).toContain('"amount":99999999999999999.99,')
    expect(body).not.toContain('"amount":"')
    expect(decodeTransactionJson(body)).toEqual(input)
    expect(() =>
      serializeTransaction({ ...input, amount: '1.00,"id":8' }),
    ).toThrow()
    expect(() =>
      serializeTransaction({
        ...input,
        accountId: Number.MAX_SAFE_INTEGER + 1,
      }),
    ).toThrow()
  })
  it('valida calendário, inclusive ano bissexto e ano menor que 100', () => {
    expect(isDate('2024-02-29')).toBe(true)
    expect(isDate('2025-02-29')).toBe(false)
    expect(isDate('0001-01-01')).toBe(true)
    expect(isDate('0000-01-01')).toBe(false)
    expect(isDate('2026-04-31')).toBe(false)
    expect(monthPeriod('2024-02')).toEqual({
      startDate: '2024-02-01',
      endDate: '2024-02-29',
    })
    expect(monthPeriod('0001-01').endDate).toBe('0001-01-31')
    expect(monthPeriod('9999-12').endDate).toBe('9999-12-31')
  })
  it('normaliza parâmetros não confiáveis e limita tamanho de página', () => {
    const search = normalizeTransactionSearch({
      page: -1,
      size: 5000,
      type: 'UNKNOWN',
      startDate: '2025-02-29',
      endDate: '2026-11-05',
      categoryId: '../../users',
      accountId: {},
    })
    expect(search).toEqual({
      page: 0,
      size: 20,
      type: '',
      startDate: '',
      endDate: '2026-11-05',
      categoryId: '',
      accountId: '',
    })
    expect(isResourceId('9223372036854775807')).toBe(true)
    expect(isResourceId('9223372036854775808')).toBe(false)
    expect(isResourceId('01')).toBe(false)
  })
  it('encaminha filtros e duas chaves estáveis de ordenação', () => {
    const search = normalizeTransactionSearch({
      page: '2',
      size: '10',
      startDate: '2026-11-01',
      type: 'INCOME',
      accountId: '7',
    })
    const params = new URLSearchParams(transactionQuery(search))
    expect(params.get('page')).toBe('2')
    expect(params.get('size')).toBe('10')
    expect(params.get('startDate')).toBe('2026-11-01')
    expect(params.get('type')).toBe('INCOME')
    expect(params.get('accountId')).toBe('7')
    expect(params.getAll('sort')).toEqual(['date,desc', 'id,desc'])
    expect(params.has('categoryId')).toBe(false)
  })
})
