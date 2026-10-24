import { FinanceStory } from '@/components/FinanceStory'
import type { MouseEvent } from 'react'
import { useThemeTransition } from '@/hooks/use-theme-transition'
import { LandingCapabilities, LandingFAQ } from '@/components/LandingDetails'
import { useLandingMotion } from '@/hooks/use-landing-motion'
import { useHydrated } from '@/hooks/use-hydrated'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check as CheckIcon,
  Github,
  Moon,
  MessageSquare,
  Wallet,
  Zap,
  Sun,
} from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { MessageDemo } from '@/components/LandingExperience'
import '../landing.css'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): { animacao?: 'off' } => ({
    animacao: search.animacao === 'off' ? 'off' : undefined,
  }),
  head: () => ({
    meta: [
      { title: 'Finance Bot — Uma conversa. Mais controle.' },
      {
        name: 'description',
        content:
          'Registre gastos e organize suas finanças pelo Telegram. Conheça o Finance Bot e experimente uma demonstração interativa.',
      },
      {
        property: 'og:title',
        content: 'Finance Bot — Uma conversa. Mais controle.',
      },
      {
        property: 'og:description',
        content: 'Suas finanças começam com uma mensagem no Telegram.',
      },
    ],
  }),
  component: LandingPage,
})

function LandingPage() {
  const { animacao } = Route.useSearch()
  const motionRef = useLandingMotion()
  const hydrated = useHydrated()
  const { theme, toggleTheme } = useTheme()
  const themeTransition = useThemeTransition(toggleTheme)
  const centerDemo = (event: MouseEvent<HTMLAnchorElement>) => {
    const demo = motionRef.current?.querySelector<HTMLElement>(
      animacao === 'off' ? '.hero-demo' : '.story-stage',
    )
    if (!demo) return
    event.preventDefault()
    let top = 0
    let node: HTMLElement | null = demo
    while (node) {
      top += node.offsetTop
      node = node.offsetParent as HTMLElement | null
    }
    const padding =
      animacao === 'off'
        ? Math.max(24, (window.innerHeight - demo.offsetHeight) / 2)
        : 0
    window.scrollTo({
      top: top - padding,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    })
  }
  return (
    <div className="landing" ref={motionRef}>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="landing-header">
        <Link
          to="/"
          className="landing-brand"
          aria-label="Finance Bot — início"
        >
          <Bot aria-hidden="true" />
          Finance Bot
          <span className="brand-dot" />
        </Link>
        <nav aria-label="Navegação principal">
          <a className="nav-explore" href="#comecar">
            Como funciona
          </a>
          <button
            className="theme-button"
            disabled={!hydrated || themeTransition.changing}
            onClick={themeTransition.toggle}
            aria-label={
              theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'
            }
          >
            {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
          </button>
          <Link to="/login" className="nav-login">
            Entrar <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </nav>
      </header>
      <main id="conteudo">
        <section className="landing-hero">
          <div className="hero-copy">
            <h1 data-reveal="title">
              Suas finanças no <span>controle,</span>
              <br />
              direto do Telegram.
            </h1>
            <div className="hero-description">
              <p>
                Registre gastos, consulte saldos e organize suas finanças
                pessoais com linguagem natural. Sem planilhas, sem complicação.
              </p>
              <div className="hero-actions">
                <Link to="/cadastro" className="landing-button">
                  Criar minha conta <ArrowRight size={19} aria-hidden="true" />
                </Link>
                <Link to="/login" className="secondary-button">
                  Já tenho conta <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              </div>
              <a
                href={
                  animacao === 'off' ? '#como-funciona' : '#historia-financebot'
                }
                className="text-link demo-anchor"
                onClick={centerDemo}
              >
                <MessageSquare size={16} aria-hidden="true" />
                {animacao === 'off'
                  ? 'Experimente uma conversa abaixo'
                  : 'Veja a história em movimento'}
                <ArrowDown size={15} aria-hidden="true" />
              </a>
            </div>
          </div>
          {animacao !== 'off' ? (
            <FinanceStory />
          ) : (
            <>
              <div className="hero-demo" id="como-funciona" data-reveal="demo">
                <MessageDemo />
              </div>
              <div className="hero-bottom">
                <span>
                  Menos trabalho para registrar.
                  <br />
                  <strong>Mais clareza para seguir.</strong>
                </span>
                <span>
                  Explore os exemplos acima.
                  <br />
                  Nenhum dado real é enviado.
                </span>
              </div>
            </>
          )}
        </section>
        <section
          id="recursos"
          className="features-section"
          aria-labelledby="features-title"
        >
          <div className="section-heading">
            <h2 id="features-title">
              Menos complicação.
              <br />
              Mais controle no dia a dia.
            </h2>
            <p>
              Da mensagem ao registro, um jeito simples de cuidar das suas
              finanças.
            </p>
          </div>
          <div className="feature-grid">
            <article
              className="feature-card feature-natural"
              data-reveal="card"
            >
              <MessageSquare aria-hidden="true" />
              <h3>Linguagem natural</h3>
              <p>
                Envie mensagens como “gastei 50 no mercado” e registre o que
                aconteceu sem preencher uma planilha.
              </p>
              <div className="feature-message">
                <span>Você</span>
                <p>Gastei 50 no mercado</p>
                <CheckIcon />
              </div>
            </article>
            <article
              className="feature-card"
              data-reveal="card"
              data-delay="80"
            >
              <Wallet aria-hidden="true" />
              <h3>Seus registros organizados</h3>
              <p>
                Entradas e saídas em um só lugar, para consultar seus registros
                e acompanhar suas finanças.
              </p>
              <span className="feature-caption">
                Uma conta. Sua rotina financeira.
              </span>
            </article>
            <article
              className="feature-card"
              data-reveal="card"
              data-delay="160"
            >
              <Zap aria-hidden="true" />
              <h3>Setup simples</h3>
              <p>
                Cadastre-se, conecte o Telegram e comece a registrar. Um passo
                de cada vez.
              </p>
              <a className="text-link" href="#comecar">
                Veja como começar <ArrowRight size={16} aria-hidden="true" />
              </a>
            </article>
          </div>
        </section>
        <LandingCapabilities />
        <section
          className="start-section"
          id="comecar"
          aria-labelledby="start-title"
        >
          <div>
            <h2 id="start-title">Como funciona</h2>
            <p>Da criação da conta à primeira mensagem.</p>
          </div>
          <ol>
            <li data-reveal="step" data-delay="0">
              <span>1</span>
              <div>
                <h3>Crie sua conta</h3>
                <p>
                  Faça seu cadastro para começar a organizar seus registros.
                </p>
              </div>
            </li>
            <li data-reveal="step" data-delay="110">
              <span>2</span>
              <div>
                <h3>Conecte o Telegram</h3>
                <p>Use o código gerado na sua conta para vincular o bot.</p>
              </div>
            </li>
            <li data-reveal="step" data-delay="220">
              <span>3</span>
              <div>
                <h3>Comece a registrar</h3>
                <p>Envie mensagens e acompanhe suas entradas e saídas.</p>
              </div>
            </li>
          </ol>
        </section>
        <section className="open-section">
          <Github size={28} aria-hidden="true" />
          <div>
            <h2>Um projeto aberto para evoluir com você.</h2>
            <p>
              O Finance Bot é um assistente de finanças pessoais de código
              aberto. Conheça o desenvolvimento, sugira melhorias ou execute sua
              própria instalação seguindo a documentação do projeto.
            </p>
          </div>
          <a
            href="https://github.com/BryanPinheiro77/FinanceBot-BackEnd"
            target="_blank"
            rel="noreferrer"
          >
            Conhecer o projeto <ArrowUpRight size={18} aria-hidden="true" />
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        </section>
        <LandingFAQ />
        <section className="closing-section" data-reveal="closing">
          <Wallet size={30} aria-hidden="true" />
          <h2>
            Pronto para organizar
            <br />
            suas finanças?
          </h2>
          <p>Comece com uma conta. Continue com uma conversa.</p>
          <Link to="/cadastro" className="landing-button">
            Criar minha conta <ArrowRight size={20} aria-hidden="true" />
          </Link>
          <Link to="/login" className="text-link">
            Já tenho uma conta <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </main>
      <footer className="landing-footer">
        <Link to="/" className="landing-brand">
          <Bot aria-hidden="true" />
          Finance Bot
        </Link>
        <p>Finanças pessoais. Conversas simples.</p>
        <span>© 2026 Finance Bot</span>
      </footer>
    </div>
  )
}
