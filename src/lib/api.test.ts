// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './api'
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
