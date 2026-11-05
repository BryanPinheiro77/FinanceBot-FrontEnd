import { useEffect, useRef, useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api'
import { deleteTransaction } from '@/lib/transactions-api'
import {
  formatTransactionAmount,
  formatTransactionDate,
} from '@/lib/transaction-model'
import type { Transaction } from '@/lib/transaction-model'

export function DeleteTransactionDialog({
  transaction,
  onClose,
  onComplete,
}: {
  transaction: Transaction
  onClose: () => void
  onComplete: (message: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reconcile, setReconcile] = useState(false)
  const saving = useRef(false)
  const active = useRef(true)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !saving.current) onClose()
      }}
    >
      <AlertDialogContent
        className="transaction-delete-dialog"
        overlayClassName="transaction-delete-overlay"
      >
        <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
        <AlertDialogDescription>
          Você vai excluir “{transaction.description}”, de{' '}
          {formatTransactionDate(transaction.date)}, no valor de{' '}
          {formatTransactionAmount(transaction.amount)}. Esta ação não pode ser
          desfeita.
          {transaction.installment
            ? ' Somente esta parcela será excluída; as demais parcelas permanecem.'
            : ''}
        </AlertDialogDescription>
        {error ? <p role="alert">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy} onClick={onClose}>
            Cancelar
          </AlertDialogCancel>
          <Button
            className={reconcile ? undefined : 'transaction-confirm-delete'}
            variant={reconcile ? 'outline' : 'destructive'}
            disabled={busy}
            onClick={async () => {
              if (saving.current) return
              if (reconcile) {
                onComplete(
                  'Confira a lista atualizada antes de tentar outra exclusão.',
                )
                return
              }
              saving.current = true
              setBusy(true)
              setError('')
              try {
                await deleteTransaction(transaction.id)
                if (active.current)
                  onComplete('Transação excluída. A lista foi atualizada.')
              } catch (failure) {
                if (
                  !active.current ||
                  (failure instanceof ApiError && failure.status === 401)
                )
                  return
                if (failure instanceof ApiError && failure.status === 404) {
                  onComplete(
                    'A transação não está mais disponível. A lista foi atualizada.',
                  )
                  return
                }
                setError(
                  'Não foi possível confirmar a exclusão. Confira a lista antes de tentar novamente.',
                )
                setReconcile(true)
              } finally {
                saving.current = false
                if (active.current) setBusy(false)
              }
            }}
          >
            {busy
              ? 'Excluindo…'
              : reconcile
                ? 'Conferir lista'
                : 'Confirmar exclusão'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
