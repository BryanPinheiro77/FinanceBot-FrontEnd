import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'
import { MonthlyCharts } from '@/components/dashboard/MonthlyCharts'
import { useAuth } from '@/context/auth-context'
import { requireAuth } from '@/lib/auth-guards'
import { getAccounts } from '@/lib/auth-api'
import type { AccountResponse } from '@/lib/auth-api'
import {
  currentMonth,
  formatCurrency,
  getMonthlySummary,
  monthLabel,
  shiftMonth,
} from '@/lib/dashboard-api'
import type { MonthlySummary } from '@/lib/dashboard-api'
import { ApiError } from '@/lib/api'
import '../components/dashboard/dashboard.css'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: 'Painel — Finance Bot' },
      {
        name: 'description',
        content: 'Resumo mensal das suas receitas e despesas no Finance Bot.',
      },
    ],
  }),
  component: DashboardPage,
})

type DashboardState = {
  key: string
  summary: MonthlySummary | null
  accounts: AccountResponse[]
  error: string | null
}

function DashboardPage() {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const { user, isLoading, logout } = useAuth()
  const [month, setMonth] = useState(currentMonth)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<DashboardState | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const userId = user?.id
  const onboarded = user?.onboardingCompleted
  const key = `${userId}:${month}:${attempt}`

  useEffect(() => {
    if (isLoading) return
    if (!userId) void navigate({ to: '/login' })
    else if (!onboarded) void navigate({ to: '/onboarding' })
  }, [isLoading, navigate, onboarded, userId])

  useEffect(() => {
    if (!userId || !onboarded) return
    const controller = new AbortController()
    let active = true
    // Consultas independentes; a chave impede exibir dados de outro mês ou usuário.
    void Promise.all([
      getMonthlySummary(month, controller.signal),
      getAccounts(),
    ])
      .then(([summary, accounts]) => {
        if (active) setState({ key, summary, accounts, error: null })
      })
      .catch((error: unknown) => {
        if (active && !(error instanceof ApiError && error.status === 401)) {
          setState({
            key,
            summary: null,
            accounts: [],
            error:
              'Não foi possível carregar os dados deste mês. Tente novamente.',
          })
        }
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [key, month, onboarded, userId])

  const visible = state?.key === key ? state : null
  const summary = visible?.summary
  const loading = !visible

  if (!user || isLoading || !onboarded) {
    return (
      <main className="dashboard-shell">
        <p role="status">Carregando seu painel…</p>
      </main>
    )
  }

  return (
    <div className="dashboard">
      <a className="dashboard-skip" href="#dashboard-main">
        Pular para o conteúdo
      </a>
      <header className="dashboard-header">
        <div className="dashboard-shell dashboard-header-inner">
          <a href="/" className="dashboard-brand">
            <Bot aria-hidden="true" />
            Finance Bot
          </a>
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
      <main
        id="dashboard-main"
        tabIndex={-1}
        className="dashboard-shell dashboard-main"
      >
        <div className="dashboard-heading">
          <div>
            <h1>Seu mês em perspectiva</h1>
            <p>Olá, {user.name}. Acompanhe suas movimentações registradas.</p>
          </div>
          <div
            className="dashboard-period"
            role="group"
            aria-label="Selecionar período"
          >
            <Button
              variant="outline"
              size="icon"
              aria-label="Mês anterior"
              disabled={month === '0001-01'}
              onClick={() => setMonth((value) => shiftMonth(value, -1))}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <div>
              <label htmlFor="dashboard-month">Mês de referência</label>
              <input
                id="dashboard-month"
                type="month"
                min="0001-01"
                max="9999-12"
                value={month}
                onChange={(event) => {
                  const value = event.target.value
                  if (/^(?!0000)[0-9]{4}-(0[1-9]|1[0-2])$/.test(value))
                    setMonth(value)
                }}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              aria-label="Próximo mês"
              disabled={month === '9999-12'}
              onClick={() => setMonth((value) => shiftMonth(value, 1))}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>
        <p className="dashboard-period-label" aria-live="polite">
          {monthLabel(month)}
        </p>
        <div aria-busy={loading}>
          {loading ? (
            <div className="dashboard-loading" role="status">
              <p>Carregando dados de {monthLabel(month)}…</p>
              <div className="dashboard-loading-lines" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : null}
          {visible?.error ? (
            <div className="dashboard-error" role="alert">
              <h2>Não conseguimos atualizar o painel</h2>
              <p>{visible.error}</p>
              <Button
                variant="outline"
                onClick={() => setAttempt((value) => value + 1)}
              >
                Tentar novamente
              </Button>
            </div>
          ) : null}
          {summary ? (
            <>
              <dl className="dashboard-metrics">
                <div>
                  <dt>Receitas do mês</dt>
                  <dd>{formatCurrency(summary.totalIncome)}</dd>
                  <p>Entradas registradas</p>
                </div>
                <div>
                  <dt>Despesas do mês</dt>
                  <dd>{formatCurrency(summary.totalExpense)}</dd>
                  <p>Saídas registradas</p>
                </div>
                <div>
                  <dt>Resultado do mês</dt>
                  <dd
                    className={summary.balance < 0 ? 'dashboard-negative' : ''}
                  >
                    {formatCurrency(summary.balance)}
                  </dd>
                  <p>Receitas menos despesas</p>
                </div>
              </dl>
              <p className="dashboard-data-note">
                {summary.transactionCount}{' '}
                {summary.transactionCount === 1
                  ? 'lançamento no período'
                  : 'lançamentos no período'}
                . Inclui parcelas pela data de cada lançamento; não representa
                saldo bancário nem projeção.
              </p>
              {summary.transactionCount === 0 ? (
                <section
                  className="dashboard-empty"
                  aria-labelledby="empty-title"
                >
                  <h2 id="empty-title">Nenhum lançamento neste mês</h2>
                  <p>
                    Escolha outro período ou registre uma receita ou despesa
                    pelo Telegram.
                  </p>
                  <a
                    href="https://t.me/YourFinanceAssistence_Bot"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir o bot no Telegram <ExternalLink aria-hidden="true" />
                  </a>
                </section>
              ) : (
                <MonthlyCharts summary={summary} />
              )}
            </>
          ) : null}
        </div>
        <section
          className="dashboard-connections"
          aria-labelledby="connections-title"
        >
          <h2 id="connections-title">Sua configuração</h2>
          <dl>
            <div>
              <dt>Renda mensal cadastrada</dt>
              <dd>
                {user.monthlyBaseIncome == null
                  ? 'Não informada'
                  : formatCurrency(user.monthlyBaseIncome)}
              </dd>
              <p>Referência do cadastro; não é receita registrada.</p>
            </div>
            <div>
              <dt>Contas cadastradas</dt>
              <dd>
                {visible?.summary
                  ? visible.accounts
                      .map((account) => account.name)
                      .join(', ') || 'Nenhuma conta cadastrada'
                  : 'Disponíveis após carregar o painel'}
              </dd>
            </div>
            <div>
              <dt>Telegram</dt>
              <dd>{user.telegramLinked ? 'Conectado' : 'Vínculo pendente'}</dd>
              <a
                href="https://t.me/YourFinanceAssistence_Bot"
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir Telegram <ExternalLink aria-hidden="true" />
              </a>
              {!user.telegramLinked && user.telegramLinkCode ? (
                <p>
                  Para concluir o vínculo, envie{' '}
                  <code>/connect {user.telegramLinkCode}</code> ao bot.
                </p>
              ) : null}
            </div>
          </dl>
        </section>
      </main>
    </div>
  )
}
