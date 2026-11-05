import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { AccountResponse, CategoryResponse } from '@/lib/auth-api'
import { EMPTY_SEARCH } from '@/lib/transaction-model'
import type { TransactionSearch } from '@/lib/transaction-model'

export function TransactionFilters({
  value,
  accounts,
  categories,
  onApply,
}: {
  value: TransactionSearch
  accounts: AccountResponse[]
  categories: CategoryResponse[]
  onApply: (search: TransactionSearch) => void
}) {
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState('')
  const choices = categories.filter(
    (category) => !draft.type || category.type === draft.type,
  )
  return (
    <form
      className="transaction-filters"
      aria-label="Filtros de transações"
      onSubmit={(event) => {
        event.preventDefault()
        if (
          draft.startDate &&
          draft.endDate &&
          draft.startDate > draft.endDate
        ) {
          setError('A data inicial deve ser anterior ou igual à data final.')
          return
        }
        setError('')
        onApply({ ...draft, page: 0 })
      }}
    >
      <div className="transaction-filter-fields">
        <label htmlFor="filter-start">
          Data inicial
          <input
            id="filter-start"
            type="date"
            min="0001-01-01"
            max="9999-12-31"
            value={draft.startDate}
            onChange={(event) =>
              setDraft({ ...draft, startDate: event.target.value })
            }
          />
        </label>
        <label htmlFor="filter-end">
          Data final
          <input
            id="filter-end"
            type="date"
            min="0001-01-01"
            max="9999-12-31"
            value={draft.endDate}
            onChange={(event) =>
              setDraft({ ...draft, endDate: event.target.value })
            }
          />
        </label>
        <label htmlFor="filter-type">
          Tipo de transação
          <select
            id="filter-type"
            value={draft.type}
            onChange={(event) =>
              setDraft({
                ...draft,
                type: event.target.value as TransactionSearch['type'],
                categoryId: '',
              })
            }
          >
            <option value="">Todos os tipos</option>
            <option value="EXPENSE">Despesas</option>
            <option value="INCOME">Receitas</option>
          </select>
        </label>
        <label htmlFor="filter-account">
          Filtrar por conta
          <select
            id="filter-account"
            value={draft.accountId}
            onChange={(event) =>
              setDraft({ ...draft, accountId: event.target.value })
            }
          >
            <option value="">Todas as contas</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="filter-category">
          Filtrar por categoria
          <select
            id="filter-category"
            value={draft.categoryId}
            onChange={(event) =>
              setDraft({ ...draft, categoryId: event.target.value })
            }
          >
            <option value="">Todas as categorias</option>
            {choices.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="transaction-filter-actions">
        <Button type="submit">Aplicar filtros</Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setError('')
            onApply({ ...EMPTY_SEARCH, size: value.size })
          }}
        >
          Limpar filtros
        </Button>
      </div>
      {error ? (
        <p className="transaction-form-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
