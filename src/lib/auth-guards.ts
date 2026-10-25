import { redirect } from '@tanstack/react-router'
import { getSessionStatus } from '@/lib/session-status'

export async function requireAnonymous() {
  const session = await getSessionStatus()
  if (session.authenticated)
    throw redirect({
      to: session.onboardingCompleted ? '/dashboard' : '/onboarding',
    })
}

export async function requireAuth() {
  const session = await getSessionStatus()
  if (!session.authenticated) throw redirect({ to: '/login' })
}
