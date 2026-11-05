// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api'
import { AuthProvider, useAuth } from './auth-context'

const state = vi.hoisted(() => ({ navigate: vi.fn(), get: vi.fn() }))
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => state.navigate }))
vi.mock('@/lib/auth-api', () => ({ getCurrentUser: state.get, loginRequest: vi.fn(), logoutRequest: vi.fn(), registerRequest: vi.fn() }))
function Probe() {
  const { user, isLoading } = useAuth()
  return <p>{isLoading ? 'carregando' : user ? user.name : 'anônimo'}</p>
}
describe('expiração da sessão e visitantes anônimos', () => {
  beforeEach(() => { vi.clearAllMocks() })
  afterEach(cleanup)
  it('401 no bootstrap não redireciona visitante anônimo da landing', async () => {
    state.get.mockRejectedValue(new ApiError('Entre novamente', 401))
    render(<AuthProvider><Probe /></AuthProvider>)
    await screen.findByText('anônimo')
    act(() => { window.dispatchEvent(new Event('financebot:session-expired')) })
    expect(state.navigate).not.toHaveBeenCalled()
  })
  it('expiração de uma sessão autenticada redireciona e remove o usuário', async () => {
    state.get.mockResolvedValue({ id: 1, name: 'Pessoa de teste' })
    render(<AuthProvider><Probe /></AuthProvider>)
    await screen.findByText('Pessoa de teste')
    act(() => { window.dispatchEvent(new Event('financebot:session-expired')) })
    expect(state.navigate).toHaveBeenCalledWith({ to: '/login' })
    expect(screen.getByText('anônimo')).toBeTruthy()
  })
})
