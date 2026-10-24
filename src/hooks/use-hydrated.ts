import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false

// Evita perder cliques enquanto o HTML do servidor aguarda hidratação.
export function useHydrated() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot)
}
