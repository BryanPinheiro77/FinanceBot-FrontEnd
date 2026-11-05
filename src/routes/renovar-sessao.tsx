import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/renovar-sessao')({
  component: RenewSession,
})

function RenewSession() {
  const { refreshUser, isLoading } = useAuth()
  const navigate = useNavigate()
  const started = useRef(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (isLoading || started.current) return
    started.current = true
    void refreshUser()
      .then((user) =>
        navigate({
          to: user
            ? user.onboardingCompleted
              ? '/dashboard'
              : '/onboarding'
            : '/login',
        }),
      )
      .catch(() => setFailed(true))
  }, [isLoading, navigate, refreshUser])
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm space-y-4 text-center">
        <p role="status">
          {failed
            ? 'Não foi possível renovar sua sessão.'
            : 'Restaurando sua sessão…'}
        </p>
        {failed && (
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        )}
      </div>
    </main>
  )
}
