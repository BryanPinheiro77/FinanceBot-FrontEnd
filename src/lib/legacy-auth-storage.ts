/** Remove somente o token antigo; novas sessões nunca entram em Web Storage. */
export function clearLegacyAuthToken() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem('financebot.auth.token')
  } catch {
    /* Storage pode estar indisponível. */
  }
}
