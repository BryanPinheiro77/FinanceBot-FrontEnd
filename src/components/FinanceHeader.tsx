import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Bot, LogOut, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EMPTY_SEARCH } from '@/lib/transaction-model'
import { useAuth } from '@/context/auth-context'
import { useTheme } from '@/hooks/use-theme'
import './dashboard/dashboard.css'

export function FinanceHeader({
  active,
  period,
}: {
  active: 'dashboard' | 'transactions'
  period?: { startDate: string; endDate: string }
}) {
  const { theme, toggleTheme } = useTheme()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  return (
    <header className="dashboard-header">
      <div className="dashboard-shell dashboard-header-inner finance-header-inner">
        <Link to="/dashboard" className="dashboard-brand">
          <Bot aria-hidden="true" />
          Finance Bot
        </Link>
        <nav className="finance-nav" aria-label="Navegação financeira">
          <Link
            to="/dashboard"
            aria-current={active === 'dashboard' ? 'page' : undefined}
          >
            Visão geral
          </Link>
          <Link
            to="/transactions"
            search={{ ...EMPTY_SEARCH, ...period }}
            aria-current={active === 'transactions' ? 'page' : undefined}
          >
            Transações
          </Link>
        </nav>
        <div className="dashboard-header-actions">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'
            }
          >
            {theme === 'dark' ? (
              <Sun aria-hidden="true" />
            ) : (
              <Moon aria-hidden="true" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={loggingOut}
            onClick={async () => {
              setLoggingOut(true)
              try {
                await logout()
                await navigate({ to: '/login' })
              } catch {
                toast.error('Não foi possível sair agora. Tente novamente.')
                setLoggingOut(false)
              }
            }}
          >
            <LogOut aria-hidden="true" />
            {loggingOut ? 'Saindo…' : 'Sair'}
          </Button>
        </div>
      </div>
    </header>
  )
}
