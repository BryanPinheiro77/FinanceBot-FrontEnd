import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { flushSync } from 'react-dom'

export function useThemeTransition(toggleTheme: () => void) {
  const [changing, setChanging] = useState(false)
  const active = useRef<ViewTransition | null>(null)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      active.current?.skipTransition()
      document.documentElement.classList.remove(
        'theme-reveal-active',
        'theme-fade-active',
      )
    }
  }, [])

  const toggle = async (event: MouseEvent<HTMLButtonElement>) => {
    if (changing) return
    const root = document.documentElement
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      toggleTheme()
      return
    }
    const box = event.currentTarget.getBoundingClientRect()
    const x = box.left + box.width / 2
    const y = box.top + box.height / 2
    setChanging(true)
    try {
      const startViewTransition = Reflect.get(
        document,
        'startViewTransition',
      ) as Document['startViewTransition'] | undefined
      if (!startViewTransition) {
        root.classList.add('theme-fade-active')
        toggleTheme()
        await new Promise((resolve) => window.setTimeout(resolve, 400))
        return
      }
      root.classList.add('theme-reveal-active')
      const transition = startViewTransition.call(document, () =>
        flushSync(toggleTheme),
      )
      active.current = transition
      try {
        await transition.ready
        const radius = Math.hypot(
          Math.max(x, innerWidth - x),
          Math.max(y, innerHeight - y),
        )
        root.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 650,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        )
        await transition.finished
      } catch {
        // Uma captura cancelada não deve cancelar a troca de tema.
        await transition.updateCallbackDone.catch(() => {})
      }
    } finally {
      active.current = null
      root.classList.remove('theme-reveal-active', 'theme-fade-active')
      if (mounted.current) setChanging(false)
    }
  }
  return { toggle, changing }
}
