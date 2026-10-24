import { useHydrated } from '@/hooks/use-hydrated'
import { useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  Plus,
} from 'lucide-react'

const capabilities = [
  {
    label: 'Consultas',
    icon: ChartNoAxesCombined,
    title: 'Entenda para onde seu dinheiro vai.',
    description:
      'Consulte suas finanças pelo Telegram e encontre a informação que precisa sem montar uma planilha.',
    message: 'Quanto gastei este mês?',
    items: [
      'Totais de despesas e receitas do mês',
      'Consultas por categoria',
      'Análise financeira mensal',
    ],
  },
  {
    label: 'Parcelas',
    icon: CalendarDays,
    title: 'Olhe além da compra de hoje.',
    description:
      'Registre compras parceladas e despesas recorrentes para acompanhar os compromissos dos próximos meses.',
    message: 'Quais são minhas parcelas ativas?',
    items: [
      'Registro de compras parceladas',
      'Consulta de parcelas ativas',
      'Transações recorrentes',
    ],
  },
  {
    label: 'Lembretes',
    icon: Bell,
    title: 'Sua rotina também merece um lembrete.',
    description:
      'Acompanhe lembretes financeiros e resumos pelo Telegram. As preferências dos alertas podem ser ajustadas na conversa.',
    message: 'Me lembre dia 10 de pagar a fatura do cartão.',
    items: [
      'Lembretes financeiros',
      'Resumos semanais e mensais',
      'Preferências de alertas no Telegram',
    ],
  },
]

export function LandingCapabilities() {
  const hydrated = useHydrated()
  const [selected, setSelected] = useState(0)
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const id = useId()
  const reduce = useReducedMotion()
  const current = capabilities[selected]
  return (
    <section className="capabilities-section" aria-labelledby={`${id}-title`}>
      <div className="capabilities-intro">
        <h2 id={`${id}-title`}>
          Vai além de
          <br />
          anotar um gasto.
        </h2>
        <p>
          O Finance Bot reúne registros, consultas e acompanhamento financeiro
          na mesma conversa. Explore o que ele pode fazer por você.
        </p>
        <div
          className="capability-tabs"
          role="tablist"
          aria-label="Recursos do Finance Bot"
        >
          {capabilities.map((item, index) => (
            <button
              key={item.label}
              ref={(element) => {
                tabs.current[index] = element
              }}
              id={`${id}-tab-${index}`}
              type="button"
              disabled={!hydrated}
              role="tab"
              aria-selected={selected === index}
              aria-controls={`${id}-panel`}
              tabIndex={selected === index ? 0 : -1}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => {
                const next =
                  event.key === 'ArrowRight'
                    ? (index + 1) % capabilities.length
                    : event.key === 'ArrowLeft'
                      ? (index + capabilities.length - 1) % capabilities.length
                      : event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? capabilities.length - 1
                          : null
                if (next !== null) {
                  event.preventDefault()
                  setSelected(next)
                  tabs.current[next]?.focus()
                }
              }}
            >
              <item.icon size={18} aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div
        className="capability-panel"
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${selected}`}
        tabIndex={0}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
          >
            <current.icon
              className="capability-icon"
              size={30}
              aria-hidden="true"
            />
            <h3>{current.title}</h3>
            <p>{current.description}</p>
            <ul>
              {current.items.map((item) => (
                <li key={item}>
                  <Check size={15} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <blockquote>
              <span>Exemplo de mensagem</span>
              {current.message}
            </blockquote>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

const questions = [
  {
    question: 'O que posso registrar no Finance Bot?',
    answer:
      'Despesas, receitas, compras parceladas e transações recorrentes. Você também pode organizar contas e categorias e consultar suas informações pelo Telegram.',
  },
  {
    question: 'Como o Telegram se conecta à minha conta?',
    answer:
      'Depois do cadastro, você gera um código temporário na sua conta e usa esse código para vincular o bot no Telegram. A partir daí, a conversa fica associada à sua conta do Finance Bot.',
  },
  {
    question: 'Como meus dados financeiros são protegidos?',
    answer:
      'O Finance Bot exige login e separa os registros por usuário. As senhas são protegidas e a renda mensal cadastrada usa criptografia no banco. A criptografia ainda não abrange todos os dados financeiros; essa proteção está sendo ampliada.',
  },
  {
    question: 'Posso executar minha própria instalação?',
    answer:
      'Sim. O Finance Bot é um projeto de código aberto com documentação para instalar a API, o bot e os serviços necessários na sua própria infraestrutura. O repositório explica os requisitos e o passo a passo.',
  },
]

export function LandingFAQ() {
  return (
    <section className="faq-section" aria-labelledby="faq-title">
      <div>
        <h2 id="faq-title">
          Antes da
          <br />
          primeira mensagem.
        </h2>
        <p>Algumas respostas para começar com mais clareza.</p>
      </div>
      <div className="faq-list">
        {questions.map((item) => (
          <details key={item.question}>
            <summary>
              {item.question}
              <Plus size={19} aria-hidden="true" />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
