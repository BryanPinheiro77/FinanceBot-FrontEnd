import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  Bot,
  Check,
  ChevronRight,
  Pause,
  Send,
  ShoppingBag,
  TramFront,
  Wallet,
} from 'lucide-react'
import { useHydrated } from '@/hooks/use-hydrated'
import './finance-story.css'

const clamp = (value: number) => Math.max(0, Math.min(1, value))
const between = (value: number, start: number, end: number) =>
  clamp((value - start) / (end - start))
const chapters = [
  {
    label: 'Mensagem',
    position: 0.18,
    title: 'Começa com uma conversa.',
    description:
      'Você conta o que aconteceu. A mensagem toma forma no Telegram, do seu jeito.',
  },
  {
    label: 'Registro',
    position: 0.44,
    title: 'A mensagem ganha forma.',
    description: 'O gasto vira um registro com valor, descrição e categoria.',
  },
  {
    label: 'Categorias',
    position: 0.68,
    title: 'Cada coisa no seu lugar.',
    description:
      'Os registros se encontram em categorias. Fica mais fácil enxergar o que entra e o que sai.',
  },
  {
    label: 'Visão do mês',
    position: 0.96,
    title: 'O dia a dia vira perspectiva.',
    description:
      'Veja suas entradas e saídas do mês em um só lugar e entenda para onde seu dinheiro está indo.',
  },
]

export function FinanceStory() {
  const track = useRef<HTMLElement>(null)
  const hydrated = useHydrated()
  const [progress, setProgress] = useState(0)
  const [manual, setManual] = useState(false)
  const [playing, setPlaying] = useState(false)
  const playbackFrame = useRef(0)
  const stopPlayback = useCallback(() => {
    cancelAnimationFrame(playbackFrame.current)
    playbackFrame.current = 0
    setPlaying(false)
  }, [])
  useEffect(() => {
    const element = track.current
    if (!element) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const shortWindow = window.matchMedia('(max-height: 600px)')
    let frame = 0
    const read = () => {
      frame = 0
      const isManual = preference.matches || shortWindow.matches
      setManual(isManual)
      if (isManual) {
        setProgress((previous) => (previous === 0 ? 0.18 : previous))
        return
      }
      let top = 0
      let node: HTMLElement | null = element
      while (node) {
        top += node.offsetTop
        node = node.offsetParent as HTMLElement | null
      }
      const distance = element.offsetHeight - window.innerHeight
      setProgress(distance > 0 ? clamp((window.scrollY - top) / distance) : 0)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read)
    }
    const stopAndSchedule = () => {
      stopPlayback()
      schedule()
    }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', stopAndSchedule, { passive: true })
    const cancelForKey = (event: KeyboardEvent) => {
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'PageUp',
          'PageDown',
          'Home',
          'End',
          ' ',
        ].includes(event.key)
      )
        stopPlayback()
    }
    window.addEventListener('wheel', stopPlayback, { passive: true })
    window.addEventListener('touchstart', stopPlayback, { passive: true })
    window.addEventListener('keydown', cancelForKey)
    preference.addEventListener('change', stopAndSchedule)
    shortWindow.addEventListener('change', stopAndSchedule)
    const observer = new ResizeObserver(schedule)
    observer.observe(element)
    schedule()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', stopAndSchedule)
      cancelAnimationFrame(playbackFrame.current)
      window.removeEventListener('wheel', stopPlayback)
      window.removeEventListener('touchstart', stopPlayback)
      window.removeEventListener('keydown', cancelForKey)
      preference.removeEventListener('change', stopAndSchedule)
      shortWindow.removeEventListener('change', stopAndSchedule)
    }
  }, [stopPlayback])

  const goTo = (position: number) => {
    stopPlayback()
    if (
      manual ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      window.matchMedia('(max-height: 600px)').matches
    ) {
      setProgress(position === chapters[0].position ? 0.18 : position)
      return
    }
    const element = track.current
    if (!element) return
    let top = 0
    let node: HTMLElement | null = element
    while (node) {
      top += node.offsetTop
      node = node.offsetParent as HTMLElement | null
    }
    const travel = element.offsetHeight - innerHeight
    const start = window.scrollY
    const target = top + travel * position
    const distance = target - start
    if (Math.abs(distance) < 2) return
    // Um percurso longo mostra as etapas intermediárias, como uma sequência de vídeo.
    const duration =
      2400 + Math.min(1, Math.abs(distance) / Math.max(1, travel)) * 6000
    const startedAt = performance.now()
    setPlaying(true)
    const play = (time: number) => {
      const elapsed = clamp((time - startedAt) / duration)
      const eased = (1 - Math.cos(Math.PI * elapsed)) / 2
      window.scrollTo({ top: start + distance * eased, behavior: 'instant' })
      if (elapsed < 1) playbackFrame.current = requestAnimationFrame(play)
      else {
        playbackFrame.current = 0
        setPlaying(false)
      }
    }
    playbackFrame.current = requestAnimationFrame(play)
  }
  const chapterIndex =
    progress < 0.26 ? 0 : progress < 0.54 ? 1 : progress < 0.79 ? 2 : 3
  const current = chapters[chapterIndex]
  const typing = between(progress, 0.015, 0.18)
  const flight = between(progress, 0.19, 0.35)
  const receipt = between(progress, 0.31, 0.43)
  const organize = between(progress, 0.5, 0.65)
  const overview = between(progress, 0.75, 0.94)
  const sent = progress >= 0.205
  const message = 'Gastei 85 no mercado'
  return (
    <section
      ref={track}
      id="historia-financebot"
      className={`finance-story ${manual ? 'story-manual' : ''}`}
      aria-label="Uma mensagem se transforma em organização financeira"
      data-chapter={chapterIndex}
      data-playing={playing}
    >
      <div className="story-stage">
        <div className="story-top">
          <span>
            <Bot size={19} aria-hidden="true" /> Finance Bot em movimento
          </span>
          <a href="#recursos">
            Explorar recursos <ChevronRight size={14} aria-hidden="true" />
          </a>
        </div>
        <div className="story-main">
          <div className="story-copy">
            <h2>{current.title}</h2>
            <p>{current.description}</p>
            <span className="story-scroll-hint">
              {manual
                ? 'Escolha uma etapa abaixo para explorar.'
                : 'Role para fazer a história acontecer.'}
              {!manual && <ArrowDown size={16} aria-hidden="true" />}
            </span>
          </div>
          <div className="story-scene" aria-hidden="true">
            <div className="story-ground" />
            <div
              className="story-world"
              style={{
                transform: manual
                  ? 'none'
                  : `rotateX(${7 - overview * 6}deg) rotateY(${-10 + organize * 8}deg) scale(${1 - overview * 0.12})`,
              }}
            >
              <div
                className="story-phone"
                style={{
                  transform: `translate3d(${-overview * 72}px,${overview * 24}px,${-overview * 80}px) rotateY(${-10 + organize * 7}deg) rotateZ(${-6 + overview * 3}deg)`,
                  opacity: 1,
                }}
              >
                <div className="story-phone-camera" />
                <div className="story-phone-top">
                  <span>9:41</span>
                  <span>•••</span>
                </div>
                <div className="story-chat-header">
                  <Bot size={21} />
                  <div>
                    <strong>Finance Bot</strong>
                    <span>Uma conversa mais organizada.</span>
                  </div>
                </div>
                <div className="story-chat-body">
                  <span className="story-chat-date">Demonstração</span>
                  <p className="story-bot-bubble">
                    O que vamos organizar hoje?
                  </p>
                  {sent && (
                    <div className="story-user-bubble">
                      {message}
                      <Check size={12} />
                    </div>
                  )}
                  <span
                    className="story-chat-confirm"
                    style={{ opacity: receipt }}
                  >
                    <Check size={12} /> Exemplo recebido.
                  </span>
                </div>
                <div className="story-composer">
                  <span>
                    {flight < 0.12
                      ? message.slice(0, Math.floor(typing * message.length))
                      : 'Mensagem enviada'}
                    {flight < 0.12 && <i className="story-caret" />}
                  </span>
                  <Send size={17} />
                </div>
              </div>
              {flight > 0 && flight < 1 && (
                <div
                  className="story-flying-message"
                  style={{
                    opacity: flight > 0 && flight < 1 ? 1 : 0,
                    transform: `translate3d(${flight * 185}px,${Math.sin(flight * Math.PI) * -110}px,70px) rotateZ(${-5 + flight * 10}deg) scale(${1 - flight * 0.18})`,
                  }}
                >
                  <Send size={17} />
                  {message}
                </div>
              )}
              <div
                className="story-paper"
                style={{
                  opacity: receipt * (1 - organize),
                  transform: `translate3d(${organize * -35}px,${(1 - receipt) * 60 - organize * 35}px,45px) rotateY(${-12 + receipt * 12}deg) rotateZ(${5 - receipt * 5}deg) scale(${0.84 + receipt * 0.16})`,
                }}
              >
                <span className="story-paper-brand">
                  <Bot size={18} /> Finance Bot
                </span>
                <span className="story-paper-check">
                  <Check size={21} />
                </span>
                <p>Seu registro ganhou forma.</p>
                <strong>R$ 85,00</strong>
                <dl>
                  <div>
                    <dt>Descrição</dt>
                    <dd>Mercado</dd>
                  </div>
                  <div>
                    <dt>Categoria</dt>
                    <dd>Alimentação</dd>
                  </div>
                  <div>
                    <dt>Tipo</dt>
                    <dd>Despesa</dd>
                  </div>
                </dl>
                <span className="story-paper-foot">
                  Registro ilustrativo · nada foi salvo
                </span>
              </div>
              <div
                className="story-categories"
                style={{
                  opacity: organize * (1 - overview),
                  transform: `translate3d(${-overview * 230}px,${(1 - organize) * 55 + overview * 75}px,${30 - overview * 60}px) rotateY(${-6 + overview * 8}deg) scale(${0.9 + organize * 0.1 - overview * 0.2})`,
                }}
              >
                <span className="story-object-title">
                  Tudo encontra seu lugar.
                </span>
                {[
                  { icon: ShoppingBag, name: 'Alimentação', value: 'R$ 85,00' },
                  { icon: TramFront, name: 'Transporte', value: 'R$ 24,00' },
                  { icon: Wallet, name: 'Receitas', value: 'R$ 500,00' },
                ].map((item, index) => (
                  <div
                    className="story-category"
                    key={item.name}
                    style={{
                      transform: `translateX(${(1 - organize) * (index + 1) * 20}px)`,
                    }}
                  >
                    <span>
                      <item.icon size={19} />
                    </span>
                    <div>
                      <strong>{item.name}</strong>
                      <small>Exemplo de categoria</small>
                    </div>
                    <b>{item.value}</b>
                  </div>
                ))}
              </div>
              <div
                className="story-overview"
                style={{
                  opacity: overview,
                  transform: `translate3d(${(1 - overview) * 80}px,${(1 - overview) * 40}px,65px) rotateY(${(1 - overview) * -12}deg) scale(${0.86 + overview * 0.14})`,
                }}
              >
                <div className="story-overview-top">
                  <Bot size={21} />
                  <span>
                    Sua visão do mês<small>Resumo ilustrativo</small>
                  </span>
                  <span className="story-mini-check">
                    <Check size={16} />
                  </span>
                </div>
                <p>Agora você vê o conjunto.</p>
                <div className="story-month-values">
                  <div>
                    <span>Entradas</span>
                    <strong>R$ 500,00</strong>
                  </div>
                  <div>
                    <span>Saídas</span>
                    <strong>R$ 109,00</strong>
                  </div>
                </div>
                <div className="story-month-chart">
                  <div>
                    <span>Alimentação</span>
                    <i style={{ transform: `scaleX(${overview})` }} />
                    <b>85</b>
                  </div>
                  <div>
                    <span>Transporte</span>
                    <i style={{ transform: `scaleX(${overview * 0.28})` }} />
                    <b>24</b>
                  </div>
                </div>
                <span className="story-summary-note">
                  Dados fictícios, só para contar esta história.
                </span>
              </div>
              <div
                className="story-coin story-coin-one"
                style={{
                  transform: `translate3d(${-organize * 90}px,${-overview * 20}px,30px) rotateX(52deg) rotateZ(${-16 + progress * 70}deg)`,
                  opacity: 0.45 + receipt * 0.55,
                }}
              >
                <span>R$</span>
              </div>
              <div
                className="story-coin story-coin-two"
                style={{
                  transform: `translate3d(${organize * 25}px,${-overview * 12}px,10px) rotateX(52deg) rotateZ(${18 - progress * 50}deg)`,
                }}
              >
                <span>R$</span>
              </div>
            </div>
          </div>
        </div>
        {playing && (
          <button type="button" className="story-pause" onClick={stopPlayback}>
            <Pause size={13} aria-hidden="true" />
            Pausar percurso
          </button>
        )}
        <div className="story-bottom">
          <div
            className="story-chapters"
            role="group"
            aria-label="Etapas da animação"
          >
            {chapters.map((chapter, index) => (
              <button
                key={chapter.label}
                type="button"
                disabled={!hydrated}
                onClick={() => goTo(chapter.position)}
                aria-pressed={chapterIndex === index}
              >
                <span>{index + 1}</span>
                {chapter.label}
              </button>
            ))}
          </div>
          <span className="story-disclaimer">
            Cena ilustrativa. Nenhum dado real.
          </span>
        </div>
        <div className="story-progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>
    </section>
  )
}
