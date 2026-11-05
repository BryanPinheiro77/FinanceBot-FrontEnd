import { Button } from '@/components/ui/button'
import {
  formatTransactionAmount,
  formatTransactionDate,
  sourceLabels,
} from '@/lib/transaction-model'
import type { Transaction } from '@/lib/transaction-model'

interface Props {
  records: Transaction[]
  disabled: boolean
  onEdit: (record: Transaction) => void
  onDelete: (record: Transaction) => void
}

function Actions({
  record,
  ...props
}: Omit<Props, 'records'> & { record: Transaction }) {
  return (
    <div className="transaction-row-actions">
      <Button
        variant="ghost"
        size="sm"
        disabled={props.disabled}
        aria-label={`Editar ${record.description}`}
        onClick={() => props.onEdit(record)}
      >
        Editar
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={props.disabled}
        aria-label={`Excluir ${record.description}`}
        onClick={() => props.onDelete(record)}
      >
        Excluir
      </Button>
    </div>
  )
}

function Origin({ record }: { record: Transaction }) {
  return (
    <span className="transaction-origin">
      {sourceLabels[record.sourceType] ?? 'Origem não informada'}
      {record.installment
        ? ` · Parcela ${record.installmentNumber}/${record.totalInstallments}`
        : ''}
    </span>
  )
}

export function TransactionList({ records, ...actions }: Props) {
  return (
    <div className="transaction-records">
      <table className="transaction-desktop-table">
        <caption className="sr-only">
          Transações do usuário autenticado, da mais recente para a mais antiga
        </caption>
        <thead>
          <tr>
            <th scope="col">Data</th>
            <th scope="col">Descrição</th>
            <th scope="col">Categoria</th>
            <th scope="col">Conta</th>
            <th scope="col" className="transaction-value">
              Valor
            </th>
            <th scope="col">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td className="transaction-date">
                {formatTransactionDate(record.date)}
              </td>
              <th scope="row">
                <span className="transaction-description">
                  {record.description}
                </span>
                <Origin record={record} />
              </th>
              <td>{record.categoryName}</td>
              <td>{record.accountName}</td>
              <td className="transaction-value">
                <span className="transaction-type">
                  {record.type === 'INCOME' ? 'Receita' : 'Despesa'}
                </span>
                <strong>{formatTransactionAmount(record.amount)}</strong>
              </td>
              <td>
                <Actions record={record} {...actions} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="transaction-mobile-list" aria-label="Transações">
        {records.map((record) => (
          <li key={record.id}>
            <div className="transaction-mobile-heading">
              <h2>{record.description}</h2>
              <span>{record.type === 'INCOME' ? 'Receita' : 'Despesa'}</span>
            </div>
            <strong className="transaction-mobile-amount">
              {formatTransactionAmount(record.amount)}
            </strong>
            <dl>
              <div>
                <dt>Data</dt>
                <dd>{formatTransactionDate(record.date)}</dd>
              </div>
              <div>
                <dt>Categoria</dt>
                <dd>{record.categoryName}</dd>
              </div>
              <div>
                <dt>Conta</dt>
                <dd>{record.accountName}</dd>
              </div>
            </dl>
            <Origin record={record} />
            <Actions record={record} {...actions} />
          </li>
        ))}
      </ul>
    </div>
  )
}
