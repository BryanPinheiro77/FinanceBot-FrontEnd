// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './api'
import { decodeTransactionJson } from './transaction-model'
const state = vi.hoisted(() => ({ renew: vi.fn() }))
vi.mock('./session-renewal', () => ({ renewSession: state.renew }))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})
describe('renovação apenas quando há sessão renovável', () => {
  it('não envia refresh no bootstrap de visitante sem sessão', async () => {
    const request = vi
      .fn()
      .mockResolvedValue(Response.json({}, { status: 401 }))
    vi.stubGlobal('fetch', request)
    await expect(apiRequest('/users/me')).rejects.toMatchObject({ status: 401 })
    expect(request).toHaveBeenCalledOnce()
    expect(state.renew).not.toHaveBeenCalled()
  })
  it('renova e repete a consulta quando o servidor confirma presença do cookie refresh', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          {},
          { status: 401, headers: { 'X-FinanceBot-Session-Renewable': '1' } },
        ),
      )
      .mockResolvedValueOnce(Response.json({ id: 1 }))
    vi.stubGlobal('fetch', request)
    state.renew.mockResolvedValueOnce(true)
    await expect(apiRequest('/users/me')).resolves.toEqual({ id: 1 })
    expect(state.renew).toHaveBeenCalledOnce()
    expect(request).toHaveBeenCalledTimes(2)
  })
})

it('preserva decimal, corpo e chave de criação ao renovar a sessão', async () => {
  const body = '{"amount":99999999999999999.99,"description":"Teste"}'
  const request = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json(
        {},
        {
          status: 401,
          headers: { 'X-FinanceBot-Session-Renewable': '1' },
        },
      ),
    )
    .mockResolvedValueOnce(new Response('{"amount":99999999999999999.99}'))
  vi.stubGlobal('fetch', request)
  state.renew.mockResolvedValueOnce(true)
  await expect(
    apiRequest(
      '/transactions',
      {
        method: 'POST',
        body,
        headers: { 'Idempotency-Key': 'fixture-key' },
      },
      decodeTransactionJson,
    ),
  ).resolves.toEqual({ amount: '99999999999999999.99' })
  expect(state.renew).toHaveBeenCalledOnce()
  expect(request).toHaveBeenCalledTimes(2)
  for (const [, init] of request.mock.calls) {
    expect(init.body).toBe(body)
    expect(init.headers.get('Idempotency-Key')).toBe('fixture-key')
    expect(init.headers.get('X-FinanceBot-CSRF')).toBe('1')
  }
})
