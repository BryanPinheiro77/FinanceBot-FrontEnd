import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api'
import type { AccountResponse, CategoryResponse } from '@/lib/auth-api'
import {
  createTransaction,
  getTransaction,
  updateTransaction,
} from '@/lib/transactions-api'
import {
  formatTransactionAmount,
  isDate,
  normalizeAmount,
  today,
} from '@/lib/transaction-model'
import type {
  Transaction,
  TransactionInput,
  TransactionType,
} from '@/lib/transaction-model'

interface Props {
  accounts: AccountResponse[]
  categories: CategoryResponse[]
  id: number | null
  onClose: (reconcile?: boolean) => void
  onSaved: () => void
}

export function TransactionEditor(props: Props) {
  const [loaded, setLoaded] = useState<{ record: Transaction | null } | null>(
    props.id === null ? { record: null } : null,
  )
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (props.id === null) return
    const controller = new AbortController()
    let active = true
    void getTransaction(props.id, controller.signal)
      .then((record) => {
        if (active) setLoaded({ record })
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [props.id, retry])
  if (!loaded)
    return (
      <section className="transaction-editor" aria-label="Editar transação">
        {error ? (
          <div role="alert">
            <h2>Não foi possível abrir a transação</h2>
            <p>
              Ela pode ter sido removida ou estar indisponível. Atualize antes
              de editar.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setError(false)
                setRetry((value) => value + 1)
              }}
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <p role="status">Carregando transação…</p>
        )}
        <Button variant="ghost" onClick={() => props.onClose()}>
          Voltar para a lista
        </Button>
      </section>
    )
  return <EditorForm {...props} record={loaded.record} />
}

function EditorForm({
  accounts,
  categories,
  record,
  onClose,
  onSaved,
}: Props & { record: Transaction | null }) {
  const [type, setType] = useState<TransactionType>(record?.type ?? 'EXPENSE')
  const [description, setDescription] = useState(record?.description ?? '')
  const [amount, setAmount] = useState(record?.amount.replace('.', ',') ?? '')
  const [date, setDate] = useState(record?.date ?? today())
  const [accountId, setAccountId] = useState(
    record
      ? String(record.accountId)
      : accounts.length === 1
        ? String(accounts[0].id)
        : '',
  )
  const [categoryId, setCategoryId] = useState(
    record ? String(record.categoryId) : '',
  )
  const [phase, setPhase] = useState<'editing' | 'saving' | 'uncertain'>(
    'editing',
  )
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [expired, setExpired] = useState(false)
  const saving = useRef(false)
  const active = useRef(true)
  const attempt = useRef<{
    input: TransactionInput
    key: string
    startedAt: number
  } | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    active.current = true
    heading.current?.focus()
    return () => {
      active.current = false
    }
  }, [])
  useEffect(() => {
    if (phase !== 'uncertain' || record || !attempt.current) return
    // A menor retenção configurável da API é 60s; nunca repetir após esta janela conservadora.
    const timer = setTimeout(
      () => setExpired(true),
      Math.max(0, attempt.current.startedAt + 45_000 - Date.now()),
    )
    return () => clearTimeout(timer)
  }, [phase, record])
  useEffect(() => {
    if (phase !== 'uncertain') return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [phase])
  const available = categories.filter((category) => category.type === type)
  const uncertain = phase === 'uncertain'
  const canRetry = uncertain && !record && !conflict && !expired

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving.current) return
    if (
      uncertain &&
      (!canRetry ||
        !attempt.current ||
        Date.now() - attempt.current.startedAt >= 45_000)
    ) {
      setExpired(true)
      return
    }
    if (!attempt.current) {
      const normalized = normalizeAmount(amount)
      if (!normalized) {
        setError(
          'Informe um valor maior que zero, com até duas casas decimais, sem separador de milhares.',
        )
        return
      }
      if (
        !description.trim() ||
        description.trim().length > 255 ||
        !isDate(date)
      ) {
        setError('Confira a descrição e a data do lançamento.')
        return
      }
      if (
        !accounts.some((account) => String(account.id) === accountId) ||
        !available.some((category) => String(category.id) === categoryId)
      ) {
        setError(
          'Selecione uma conta e uma categoria do mesmo tipo da transação.',
        )
        return
      }
      attempt.current = {
        key: crypto.randomUUID(),
        startedAt: Date.now(),
        input: {
          amount: normalized,
          description: description.trim(),
          date,
          type,
          accountId: Number(accountId),
          categoryId: Number(categoryId),
          sourceType: record?.sourceType ?? 'WEB',
        },
      }
    }
    const current = attempt.current
    saving.current = true
    setPhase('saving')
    setError('')
    try {
      if (record) await updateTransaction(record.id, current.input)
      else await createTransaction(current.input, current.key)
      if (active.current) onSaved()
    } catch (failure) {
      if (!active.current) return
      if (failure instanceof ApiError && failure.status === 401) return
      if (
        failure instanceof ApiError &&
        [400, 403, 404].includes(failure.status)
      ) {
        attempt.current = null
        setPhase('editing')
        setError(
          failure.status === 404
            ? 'O lançamento, a conta ou a categoria não está mais disponível. Confira os dados ou atualize a lista.'
            : 'Não foi possível salvar. Confira os campos, a conta e a categoria selecionada.',
        )
      } else {
        setPhase('uncertain')
        setConflict(failure instanceof ApiError && failure.status === 409)
        setError(
          record
            ? 'Não confirmamos se a alteração foi salva. Confira a lista antes de tentar editar novamente.'
            : 'Não confirmamos se o lançamento foi criado. Os dados foram preservados para evitar uma nova criação sem conferência.',
        )
      }
    } finally {
      saving.current = false
    }
  }

  return (
    <section className="transaction-editor" aria-labelledby="editor-title">
      <h2 id="editor-title" tabIndex={-1} ref={heading}>
        {record ? 'Editar transação' : 'Nova transação'}
      </h2>
      <p className="dashboard-description">
        {record
          ? 'Confira os dados antes de salvar a alteração.'
          : 'Registre uma receita ou despesa na sua conta.'}
      </p>
      {record?.installment ? (
        <p className="transaction-notice">
          Parcela {record.installmentNumber} de {record.totalInstallments}. A
          edição afeta somente este lançamento, no valor atual de{' '}
          {formatTransactionAmount(record.amount)}.
        </p>
      ) : null}
      <form onSubmit={submit}>
        <fieldset
          className="transaction-form-grid"
          disabled={phase !== 'editing'}
        >
          <legend className="sr-only">Dados da transação</legend>
          <label className="transaction-wide" htmlFor="transaction-description">
            Descrição
            <input
              id="transaction-description"
              value={description}
              maxLength={255}
              required
              onChange={(event) => setDescription(event.target.value)}
              autoComplete="off"
            />
          </label>
          <label htmlFor="transaction-type">
            Tipo
            <select
              id="transaction-type"
              value={type}
              onChange={(event) => {
                setType(event.target.value as TransactionType)
                setCategoryId('')
              }}
            >
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </select>
          </label>
          <label htmlFor="transaction-amount">
            <span id="transaction-amount-label">Valor (R$)</span>
            <input
              aria-labelledby="transaction-amount-label"
              id="transaction-amount"
              inputMode="decimal"
              value={amount}
              maxLength={20}
              required
              onChange={(event) => setAmount(event.target.value)}
              aria-describedby="transaction-amount-help"
              autoComplete="off"
            />
            <span id="transaction-amount-help">
              Ex.: 35,90. Sem separador de milhares.
            </span>
          </label>
          <label htmlFor="transaction-date">
            Data do lançamento
            <input
              id="transaction-date"
              type="date"
              value={date}
              min="0001-01-01"
              max="9999-12-31"
              required
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <label htmlFor="transaction-account">
            Conta
            <select
              id="transaction-account"
              value={accountId}
              required
              onChange={(event) => setAccountId(event.target.value)}
            >
              <option value="">Selecione uma conta</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          <label className="transaction-wide" htmlFor="transaction-category">
            Categoria
            <select
              id="transaction-category"
              value={categoryId}
              required
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Selecione uma categoria</option>
              {available.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {available.length === 0 ? (
              <span>
                É necessário cadastrar uma categoria deste tipo para continuar.
              </span>
            ) : null}
            {record &&
            !available.some(
              (category) => String(category.id) === categoryId,
            ) ? (
              <span>
                Escolha uma categoria disponível para este tipo de lançamento.
              </span>
            ) : null}
          </label>
        </fieldset>
        {error ? (
          <div role="alert" className="transaction-form-error">
            <p>{error}</p>
            {uncertain && !record ? (
              <p>
                {expired
                  ? 'A janela segura de reenvio terminou. Confira os lançamentos antes de cadastrar outra vez.'
                  : conflict
                    ? 'Houve um conflito de confirmação. Confira os lançamentos antes de continuar.'
                    : 'Você pode tentar confirmar novamente, com os mesmos dados e a mesma chave, por até 45 segundos após a primeira tentativa.'}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="transaction-editor-actions">
          <Button
            type="submit"
            disabled={phase === 'saving' || (uncertain && !canRetry)}
          >
            {phase === 'saving'
              ? 'Salvando…'
              : canRetry
                ? 'Tentar confirmar novamente'
                : 'Salvar transação'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={phase === 'saving'}
            onClick={() => onClose(uncertain)}
          >
            {uncertain ? 'Conferir lançamentos' : 'Cancelar'}
          </Button>
        </div>
      </form>
    </section>
  )
}
