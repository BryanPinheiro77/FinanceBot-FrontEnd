import { createServerFn } from '@tanstack/react-start'

export const getSessionStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { handleWebApi, runtimeOptions } =
      await import('@/server/web-api.server')
    const response = await handleWebApi(
      getRequest(),
      '/users/me',
      runtimeOptions(),
    )
    if (response.status === 401)
      return { authenticated: false, onboardingCompleted: false }
    if (!response.ok)
      throw new Error('Não foi possível verificar sua sessão. Tente novamente.')
    const user = (await response.json()) as { onboardingCompleted: boolean }
    return {
      authenticated: true,
      onboardingCompleted: user.onboardingCompleted,
    }
  },
)
