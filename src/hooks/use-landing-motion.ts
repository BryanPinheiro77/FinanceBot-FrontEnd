import { useEffect, useRef } from 'react'

const clamp = (value: number) => Math.max(0, Math.min(1, value))

// Mantém o HTML visível sem JavaScript e mede o layout sem os transforms visuais.
export function useLandingMotion() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const elements = [...root.querySelectorAll<HTMLElement>('[data-reveal]')]
    let frame = 0
    let disposed = false
    const layoutTop = (element: HTMLElement) => {
      let top = 0
      let node: HTMLElement | null = element
      while (node) {
        top += node.offsetTop
        node = node.offsetParent as HTMLElement | null
      }
      return top
    }
    const clear = (element: HTMLElement) => {
      element.style.removeProperty('transform')
      element.style.removeProperty('opacity')
      element.style.removeProperty('clip-path')
      element.style.removeProperty('--scroll-reveal')
      element.style.removeProperty('--card-tilt-x')
      element.style.removeProperty('--card-tilt-y')
    }
    const render = () => {
      frame = 0
      if (disposed) return
      const viewport = window.innerHeight
      const measurements = elements.map((element) => ({
        element,
        top: layoutTop(element) - window.scrollY,
        height: element.offsetHeight,
      }))
      for (const { element, top, height } of measurements) {
        if (preference.matches) {
          clear(element)
          element.dataset.motionState = 'reduced'
          continue
        }
        if (element.querySelector(':focus-visible')) {
          element.style.opacity = '1'
          element.style.removeProperty('clip-path')
          continue
        }
        const kind = element.dataset.reveal
        // A entrada ocupa boa parte da janela, em vez de terminar na borda.
        // Em blocos altos, o repouso começa mais acima para preservar a leitura.
        const restTop =
          kind === 'demo'
            ? Math.max(
                viewport * 0.12,
                Math.min(viewport * 0.3, (viewport - height) / 2),
              )
            : viewport * 0.48
        const entering = clamp(
          (viewport * 0.96 - top) / (viewport * 0.96 - restTop),
        )
        const leaving = clamp(
          (top + height - viewport * 0.04) / (viewport * 0.34),
        )
        const progress = Math.min(entering, leaving)
        const offset = (1 - progress) * (entering < leaving ? 1 : -1)
        element.dataset.motionState =
          progress === 1
            ? 'visible'
            : progress === 0
              ? 'outside'
              : 'transitioning'
        element.style.opacity = String(progress)
        element.style.setProperty('--scroll-reveal', String(progress))
        element.style.transform =
          kind === 'demo'
            ? `perspective(1200px) translateY(${offset * 88}px) rotateX(${offset * 9}deg) scale(${0.92 + progress * 0.08})`
            : kind === 'card'
              ? `perspective(1000px) translateY(${offset * 50}px) rotateX(calc(${offset * 14}deg + var(--card-tilt-x, 0deg))) rotateY(var(--card-tilt-y, 0deg)) scale(${0.95 + progress * 0.05})`
              : `translateY(${offset * (kind === 'step' ? 18 : 26)}px)`
        if (kind === 'closing')
          element.style.clipPath = `inset(0 ${(1 - progress) * 5}% round 16px)`
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render)
    }
    // Um alvo focado deve permanecer legível mesmo na borda da janela.
    const revealFocused = () => {
      for (const element of elements) {
        if (element.querySelector(':focus-visible')) {
          element.style.opacity = '1'
          element.style.removeProperty('clip-path')
        }
      }
    }
    const tiltCard = (event: PointerEvent) => {
      if (preference.matches || event.pointerType !== 'mouse') return
      const card = (event.target as Element).closest<HTMLElement>(
        '.feature-card',
      )
      if (!card) return
      const box = card.getBoundingClientRect()
      card.style.setProperty(
        '--card-tilt-x',
        `${((event.clientY - box.top) / box.height - 0.5) * -6}deg`,
      )
      card.style.setProperty(
        '--card-tilt-y',
        `${((event.clientX - box.left) / box.width - 0.5) * 6}deg`,
      )
    }
    const resetTilt = (event: PointerEvent) => {
      const card = (event.target as Element).closest<HTMLElement>(
        '.feature-card',
      )
      if (!card) return
      if (
        event.relatedTarget instanceof Node &&
        card.contains(event.relatedTarget)
      )
        return
      card.style.removeProperty('--card-tilt-x')
      card.style.removeProperty('--card-tilt-y')
    }
    const onScroll = () => {
      schedule()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    preference.addEventListener('change', schedule)
    root.addEventListener('pointermove', tiltCard)
    root.addEventListener('pointerout', resetTilt)
    root.addEventListener('focusin', revealFocused)
    root.addEventListener('focusout', schedule)
    const observer = new ResizeObserver(schedule)
    observer.observe(root)
    schedule()
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', schedule)
      preference.removeEventListener('change', schedule)
      root.removeEventListener('pointermove', tiltCard)
      root.removeEventListener('pointerout', resetTilt)
      root.removeEventListener('focusin', revealFocused)
      root.removeEventListener('focusout', schedule)
      elements.forEach(clear)
    }
  }, [])
  return ref
}
