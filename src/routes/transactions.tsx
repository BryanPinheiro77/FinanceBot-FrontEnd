import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus, RefreshCw } from 'lucide-react'
import { FinanceHeader } from '@/components/FinanceHeader'
import { Button } from '@/components/ui/button'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { TransactionList } from '@/components/transactions/TransactionList'
import { TransactionEditor } from '@/components/transactions/TransactionEditor'
import { DeleteTransactionDialog } from '@/components/transactions/DeleteTransactionDialog'
import { useAuth } from '@/context/auth-context'
import { requireAuth } from '@/lib/auth-guards'
import { getAccounts, getCategories } from '@/lib/auth-api'
import type { AccountResponse, CategoryResponse } from '@/lib/auth-api'
import { getTransactions } from '@/lib/transactions-api'
import { normalizeTransactionSearch } from '@/lib/transaction-model'
import type { Transaction, TransactionPage } from '@/lib/transaction-model'
import { ApiError } from '@/lib/api'
import '../components/transactions/transactions.css'

export const Route = createFileRoute('/transactions')({
  beforeLoad: requireAuth,
  validateSearch: normalizeTransactionSearch,
  head: () => ({
    meta: [
      { title: 'Transações — Finance Bot' },
      {
        name: 'description',
        content: 'Consulte, registre e organize suas receitas e despesas.',
      },
    ],
  }),
  component: TransactionsRoute,
})

function TransactionsRoute() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (isLoading) return
    if (!user) void navigate({ to: '/login' })
    else if (!user.onboardingCompleted) void navigate({ to: '/onboarding' })
  }, [isLoading, navigate, user])
  if (isLoading || !user || !user.onboardingCompleted)
    return (
      <main className="dashboard-shell">
        <p role="status">Carregando suas transações…</p>
      </main>
    )
  return <TransactionsWorkspace key={user.id} userId={user.id} />
}

function TransactionsWorkspace({ userId }: { userId: number }) {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/transactions' })
  const [revision, setRevision] = useState(0)
  const [lookupRevision, setLookupRevision] = useState(0)
  const [lookups, setLookups] = useState<{
    accounts: AccountResponse[]
    categories: CategoryResponse[]
  } | null>(null)
  const [lookupError, setLookupError] = useState(false)
  const [result, setResult] = useState<{
    key: string
    data: TransactionPage | null
    error: string | null
  } | null>(null)
  const [editor, setEditor] = useState<{ id: number | null } | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)
  const [message, setMessage] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const queryKey = JSON.stringify(search)
  const key = `${userId}:${queryKey}:${revision}`
  const invalidRange =
    search.startDate && search.endDate && search.startDate > search.endDate
  const visible = result?.key === key ? result : null
  const error = invalidRange
    ? 'O período informado é inválido. Ajuste os filtros.'
    : visible?.error
  const loading = !visible && !invalidRange

  useEffect(() => {
    let active = true
    void Promise.all([getAccounts(), getCategories()])
      .then(([accounts, categories]) => {
        if (
          !accounts.every(
            (item) => Number.isSafeInteger(item.id) && item.id > 0,
          ) ||
          !categories.every(
            (item) => Number.isSafeInteger(item.id) && item.id > 0,
          )
        )
          throw new Error('Referência inválida.')
        if (active) {
          setLookups({ accounts, categories })
          setLookupError(false)
        }
      })
      .catch(() => {
        if (active) setLookupError(true)
      })
    return () => {
      active = false
    }
  }, [lookupRevision, userId])

  useEffect(() => {
    if (invalidRange) return
    let active = true
    const controller = new AbortController()
    void getTransactions(search, controller.signal)
      .then((data) => {
        if (!active) return
        const lastPage = Math.max(0, data.totalPages - 1)
        if (search.page > lastPage) {
          void navigate({
            search: { ...search, page: lastPage },
            replace: true,
          })
          return
        }
        setResult({ key, data, error: null })
      })
      .catch((failure: unknown) => {
        if (active && !(failure instanceof ApiError && failure.status === 401))
          setResult({
            key,
            data: null,
            error: 'Não foi possível carregar as transações. Tente novamente.',
          })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [invalidRange, key, navigate, search])

  const refresh = () => {
    setRevision((value) => value + 1)
    setLookupRevision((value) => value + 1)
  }
  const complete = (notice: string) => {
    setEditor(null)
    setDeleting(null)
    setMessage(notice)
    refresh()
    requestAnimationFrame(() => heading.current?.focus())
  }
  const data = visible?.data
  const canCreate = Boolean(
    lookups?.accounts.length && lookups.categories.length && !lookupError,
  )
  return (
    <div className="dashboard transactions">
      <a href="#transactions-main" className="dashboard-skip">
        Pular para o conteúdo
      </a>
      <FinanceHeader active="transactions" />
      <main
        id="transactions-main"
        tabIndex={-1}
        className="dashboard-shell dashboard-main"
      >
        <div className="transactions-heading">
          <div>
            <h1 tabIndex={-1} ref={heading}>
              Transações
            </h1>
            <p className="dashboard-description">
              Consulte e organize seus lançamentos. Da data mais recente para a
              mais antiga.
            </p>
          </div>
          <div className="transactions-heading-actions">
            <Button
              variant="outline"
              disabled={Boolean(editor) || Boolean(deleting)}
              onClick={refresh}
            >
              <RefreshCw aria-hidden="true" />
              Atualizar
            </Button>
            <Button
              disabled={!canCreate || Boolean(editor) || Boolean(deleting)}
              onClick={() => {
                setMessage('')
                setEditor({ id: null })
              }}
            >
              <Plus aria-hidden="true" />
              Nova transação
            </Button>
          </div>
        </div>
        <div className="transaction-status" role="status" aria-live="polite">
          {message}
        </div>
        {lookupError ? (
          <div className="transaction-form-error" role="alert">
            <p>
              Não foi possível carregar as contas e categorias. A consulta de
              transações continua disponível.
            </p>
            <Button
              variant="outline"
              onClick={() => setLookupRevision((value) => value + 1)}
            >
              Recarregar contas e categorias
            </Button>
          </div>
        ) : lookups && !canCreate ? (
          <p className="transaction-notice">
            Para criar uma transação, é necessário ter uma conta e uma categoria
            cadastradas.
          </p>
        ) : null}
        {editor && lookups ? (
          <TransactionEditor
            key={editor.id ?? 'create'}
            id={editor.id}
            accounts={lookups.accounts}
            categories={lookups.categories}
            onSaved={() =>
              complete(
                'Transação salva. A lista foi atualizada com os filtros selecionados.',
              )
            }
            onClose={(reconcile) => {
              if (reconcile)
                complete(
                  'Confira os lançamentos na lista antes de cadastrar ou editar novamente.',
                )
              else {
                setEditor(null)
                requestAnimationFrame(() => heading.current?.focus())
              }
            }}
          />
        ) : null}
        <TransactionFilters
          key={queryKey}
          value={search}
          accounts={lookups?.accounts ?? []}
          categories={lookups?.categories ?? []}
          onApply={(value) => {
            setMessage('')
            void navigate({ search: value })
          }}
        />
        <section
          aria-label="Resultado da consulta"
          aria-busy={loading}
          className="transaction-results"
        >
          {loading ? (
            <div className="dashboard-loading">
              <p role="status">Carregando transações…</p>
              <div className="dashboard-loading-lines" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : error ? (
            <div className="dashboard-error" role="alert">
              <h2>Não conseguimos carregar a lista</h2>
              <p>{error}</p>
              <Button
                variant="outline"
                onClick={() => setRevision((value) => value + 1)}
                disabled={Boolean(invalidRange)}
              >
                Tentar novamente
              </Button>
            </div>
          ) : data ? (
            <>
              <div className="transaction-list-meta">
                <p>
                  {data.totalElements}{' '}
                  {data.totalElements === 1
                    ? 'transação encontrada'
                    : 'transações encontradas'}
                </p>
                <label htmlFor="transaction-page-size">
                  Por página
                  <select
                    id="transaction-page-size"
                    value={search.size}
                    onChange={(event) => {
                      void navigate({
                        search: {
                          ...search,
                          page: 0,
                          size: Number(event.target.value),
                        },
                      })
                    }}
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </label>
              </div>
              {data.content.length ? (
                <TransactionList
                  records={data.content}
                  disabled={
                    Boolean(editor) ||
                    Boolean(deleting) ||
                    !lookups ||
                    lookupError
                  }
                  onEdit={(record) => {
                    setMessage('')
                    setEditor({ id: record.id })
                  }}
                  onDelete={setDeleting}
                />
              ) : (
                <div className="dashboard-empty">
                  <h2>Nenhuma transação encontrada</h2>
                  <p>
                    Experimente outro período ou limpe os filtros. Você também
                    pode registrar uma nova receita ou despesa.
                  </p>
                </div>
              )}
              <nav
                className="transaction-pagination"
                aria-label="Paginação de transações"
              >
                <Button
                  variant="outline"
                  disabled={search.page === 0}
                  onClick={() => {
                    void navigate({
                      search: { ...search, page: search.page - 1 },
                    })
                  }}
                >
                  Página anterior
                </Button>
                <span aria-live="polite">
                  Página {data.totalPages ? data.number + 1 : 1} de{' '}
                  {Math.max(1, data.totalPages)}
                </span>
                <Button
                  variant="outline"
                  disabled={data.last || data.totalPages === 0}
                  onClick={() => {
                    void navigate({
                      search: { ...search, page: search.page + 1 },
                    })
                  }}
                >
                  Próxima página
                </Button>
              </nav>
            </>
          ) : null}
        </section>
      </main>
      {deleting ? (
        <DeleteTransactionDialog
          transaction={deleting}
          onClose={() => setDeleting(null)}
          onComplete={complete}
        />
      ) : null}
    </div>
  )
}
