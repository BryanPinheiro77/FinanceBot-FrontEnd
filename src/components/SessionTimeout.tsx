import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { getSessionActivity, reportSessionActivity } from '@/lib/auth-api'
import type { SessionActivity } from '@/lib/auth-api'
import { renewSession } from '@/lib/session-renewal'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const ACTIVITY_INTERVAL = 30_000
const RENEWAL_INTERVAL = 15 * 60_000

export function SessionTimeout() {
  const { user, logout } = useAuth()
  const logoutRef = useRef(logout)
  logoutRef.current = logout
  const [seconds, setSeconds] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const session = useRef<SessionActivity | null>(null)
  const warning = useRef(false)
  const channel = useRef<BroadcastChannel | null>(null)
  const ending = useRef(false)
  const continueButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!user) return
    let alive = true
    let lastSent = Date.now()
    let trailing: ReturnType<typeof setTimeout> | undefined
    let reporting = false
    let retryLogoutAt = 0
    session.current = null
    warning.current = false
    ending.current = false
    setSeconds(null)
    setError(null)
    const bus =
      typeof BroadcastChannel === 'undefined'
        ? null
        : new BroadcastChannel('financebot:session')
    channel.current = bus
    const update = (value: SessionActivity) => {
      if (!alive) return
      if (
        !session.current ||
        Date.parse(value.lastActivityAt) >=
          Date.parse(session.current.lastActivityAt)
      )
        session.current = value
    }
    const end = async () => {
      if (ending.current || Date.now() < retryLogoutAt) return
      ending.current = true
      try {
        await logoutRef.current()
        bus?.postMessage({ type: 'logout' })
        window.dispatchEvent(new Event('financebot:session-expired'))
      } catch {
        if (alive) {
          setError(
            'Não foi possível encerrar a sessão. Tentaremos novamente em instantes.',
          )
          retryLogoutAt = Date.now() + 5_000
          ending.current = false
        }
      }
    }
    const tick = () => {
      if (!session.current) return
      const now = Date.now()
      const expiry = Math.min(
        Date.parse(session.current.idleExpiresAt),
        Date.parse(session.current.sessionExpiresAt),
      )
      const warnAt = Math.min(
        Date.parse(session.current.idleWarningAt),
        expiry - 60_000,
      )
      warning.current = now >= warnAt
      setSeconds(
        warning.current ? Math.max(0, Math.ceil((expiry - now) / 1000)) : null,
      )
      if (now >= expiry) void end()
    }
    const report = async () => {
      trailing = undefined
      if (reporting || warning.current || ending.current) return
      reporting = true
      lastSent = Date.now()
      try {
        const value = await reportSessionActivity()
        update(value)
        bus?.postMessage({ type: 'activity', value })
      } catch {
        /* Falha transitória não estende o prazo confirmado pelo servidor. */
      } finally {
        reporting = false
      }
    }
    const onActivity = () => {
      // O aviso exige confirmação explícita. Movimentar o mouse não o dispensa.
      tick()
      if (
        warning.current ||
        ending.current ||
        document.visibilityState === 'hidden'
      )
        return
      if (Date.now() - lastSent >= ACTIVITY_INTERVAL) void report()
      else if (!trailing)
        trailing = setTimeout(
          () => void report(),
          ACTIVITY_INTERVAL - (Date.now() - lastSent),
        )
    }
    const sync = () => {
      tick()
      if (document.visibilityState !== 'hidden')
        void getSessionActivity()
          .then((value) => {
            update(value)
            tick()
          })
          .catch(() => {})
    }
    bus?.addEventListener('message', (event: MessageEvent) => {
      if (event.data?.type === 'logout')
        window.dispatchEvent(new Event('financebot:session-expired'))
      if (event.data?.type === 'activity') {
        update(event.data.value as SessionActivity)
        tick()
      }
    })
    void getSessionActivity()
      .then((value) => {
        update(value)
        tick()
      })
      .catch(() => {})
    const timer = setInterval(tick, 1000)
    const renewal = setInterval(() => {
      if (!warning.current && document.visibilityState !== 'hidden')
        void renewSession()
          .then((ok) => {
            if (!ok)
              window.dispatchEvent(new Event('financebot:session-expired'))
          })
          .catch(() => {})
    }, RENEWAL_INTERVAL)
    const events = [
      'pointerdown',
      'pointermove',
      'keydown',
      'scroll',
      'touchstart',
    ] as const
    events.forEach((name) =>
      window.addEventListener(name, onActivity, { passive: true }),
    )
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('focus', sync)
    return () => {
      alive = false
      clearInterval(timer)
      clearInterval(renewal)
      clearTimeout(trailing)
      events.forEach((name) => window.removeEventListener(name, onActivity))
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('focus', sync)
      bus?.close()
      channel.current = null
    }
  }, [user?.id])

  const continueSession = async () => {
    if (busy || ending.current) return
    setBusy(true)
    setError(null)
    try {
      const value = await reportSessionActivity()
      session.current = value
      warning.current = false
      setSeconds(null)
      channel.current?.postMessage({ type: 'activity', value })
    } catch {
      setError(
        'Não foi possível continuar conectado. Tente novamente antes de a contagem terminar.',
      )
    } finally {
      setBusy(false)
    }
  }
  const leave = async () => {
    if (busy || ending.current) return
    setBusy(true)
    setError(null)
    try {
      await logoutRef.current()
      channel.current?.postMessage({ type: 'logout' })
      window.dispatchEvent(new Event('financebot:session-expired'))
    } catch {
      setError('Não foi possível sair agora. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <AlertDialog open={!!user && seconds !== null}>
      <AlertDialogContent
        className="w-[calc(100%_-_2rem)] max-w-md rounded-xl"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          continueButton.current?.focus()
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Você será desconectado</AlertDialogTitle>
          <AlertDialogDescription>
            Sua sessão está prestes a encerrar. Para proteger seus dados,
            confirme se deseja continuar conectado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p
          role="timer"
          aria-label="Tempo restante para desconexão"
          aria-live="off"
          className="text-center text-3xl font-semibold tabular-nums text-foreground"
        >
          {Math.floor((seconds ?? 0) / 60)}:
          {String((seconds ?? 0) % 60).padStart(2, '0')}
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => void leave()}
            disabled={busy || seconds === 0}
          >
            Sair agora
          </Button>
          <Button
            ref={continueButton}
            onClick={() => void continueSession()}
            disabled={busy || seconds === 0}
          >
            {busy ? 'Aguarde…' : 'Continuar conectado'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
