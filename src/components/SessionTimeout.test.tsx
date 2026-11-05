// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionTimeout } from './SessionTimeout'

const state = vi.hoisted(() => ({
  logout: vi.fn(),
  report: vi.fn(),
  get: vi.fn(),
  renew: vi.fn(),
}))
vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({ user: { id: 1 }, logout: state.logout }),
}))
vi.mock('@/lib/auth-api', () => ({
  getSessionActivity: state.get,
  reportSessionActivity: state.report,
}))
vi.mock('@/lib/session-renewal', () => ({ renewSession: state.renew }))
const start = new Date('2026-11-05T12:00:00Z').getTime()
function activity(at = start) {
  return {
    lastActivityAt: new Date(at).toISOString(),
    idleWarningAt: new Date(at + 3600_000).toISOString(),
    idleExpiresAt: new Date(at + 3660_000).toISOString(),
    sessionExpiresAt: new Date(start + 8 * 3600_000).toISOString(),
  }
}
async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms)
    await Promise.resolve()
  })
}

describe('aviso de ociosidade', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(start)
    const buses = new Set<EventTarget & { name: string }>()
    vi.stubGlobal(
      'BroadcastChannel',
      class extends EventTarget {
        constructor(public name: string) {
          super()
          buses.add(this)
        }
        postMessage(data: unknown) {
          for (const bus of buses)
            if (bus !== this && bus.name === this.name)
              bus.dispatchEvent(new MessageEvent('message', { data }))
        }
        close() {
          buses.delete(this)
        }
      },
    )
    state.get.mockResolvedValue(activity())
    state.logout.mockResolvedValue(undefined)
    state.renew.mockResolvedValue(true)
    state.report.mockImplementation(async () => activity(Date.now()))
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })
  it('mostra 60 segundos após uma hora e revoga ao chegar a zero', async () => {
    await act(async () => {
      render(<SessionTimeout />)
    })
    await advance(3600_000)
    expect(screen.getByRole('alertdialog').textContent).toContain(
      'Você será desconectado',
    )
    expect(screen.getByRole('timer').textContent).toBe('1:00')
    await advance(59_000)
    expect(state.logout).not.toHaveBeenCalled()
    await advance(1_000)
    expect(state.logout).toHaveBeenCalledOnce()
  })
  it('continuar conectado exige clique, confirma atividade no servidor e fecha aviso', async () => {
    await act(async () => {
      render(<SessionTimeout />)
    })
    await advance(3600_000)
    fireEvent.pointerMove(window)
    expect(state.report).not.toHaveBeenCalled()
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Continuar conectado' }),
      )
    })
    expect(state.report).toHaveBeenCalledOnce()
    expect(screen.queryByRole('alertdialog')).toBeNull()
    await advance(61_000)
    expect(state.logout).not.toHaveBeenCalled()
  })
  it('considera o relógio real ao voltar de suspensão e não renova por simples foco', async () => {
    await act(async () => {
      render(<SessionTimeout />)
    })
    await act(async () => {
      vi.setSystemTime(start + 3661_000)
      fireEvent(window, new Event('focus'))
    })
    expect(state.logout).toHaveBeenCalledOnce()
    expect(state.report).not.toHaveBeenCalled()
  })
  it('mantém o aviso se continuar conectado falhar', async () => {
    state.report.mockRejectedValueOnce(new Error('offline'))
    await act(async () => {
      render(<SessionTimeout />)
    })
    await advance(3600_000)
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Continuar conectado' }),
      )
    })
    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível continuar',
    )
    expect(screen.getByRole('alertdialog')).toBeTruthy()
  })
  it('atividade confirmada em outra aba fecha o aviso sem renovar credenciais no storage', async () => {
    await act(async () => {
      render(<SessionTimeout />)
    })
    await advance(3600_000)
    const bus = new BroadcastChannel('financebot:session')
    await act(async () => {
      bus.postMessage({ type: 'activity', value: activity(Date.now()) })
      await Promise.resolve()
    })
    expect(screen.queryByRole('alertdialog')).toBeNull()
    bus.close()
  })
})
