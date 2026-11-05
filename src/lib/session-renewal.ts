// Nenhuma credencial ou identificador de sessão é acessível ao JavaScript.
let pending: Promise<boolean> | undefined

export function renewSession(): Promise<boolean> {
  if (pending) return pending
  const renew = async () => {
    const response = await fetch('/api/financebot/auth/refresh', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'X-FinanceBot-CSRF': '1' },
    })
    if (response.status === 401) return false
    if (!response.ok)
      throw new Error('Não foi possível renovar sua sessão. Tente novamente.')
    return true
  }
  pending = (
    navigator.locks
      ? navigator.locks.request('financebot:session-renewal', renew)
      : renew()
  ).finally(() => {
    pending = undefined
  })
  return pending
}
