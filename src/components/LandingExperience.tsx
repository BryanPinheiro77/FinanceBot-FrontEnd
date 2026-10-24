import { useHydrated } from '@/hooks/use-hydrated'
import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bot,
  Check,
  GripVertical,
  RotateCcw,
  Send,
} from 'lucide-react'

const examples = [
  {
    label: 'Mercado',
    value: 85,
    message: (value: number) => `Gastei ${value} no mercado`,
    category: 'Alimentação',
    icon: ArrowDownLeft,
  },
  {
    label: 'Transporte',
    value: 24,
    message: (value: number) => `Gastei ${value} de transporte`,
    category: 'Transporte',
    icon: ArrowDownLeft,
  },
  {
    label: 'Recebimento',
    value: 500,
    message: (value: number) => `Recebi ${value} de um trabalho`,
    category: 'Receita',
    icon: ArrowUpRight,
  },
]
const currency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    value,
  )

export function MessageDemo() {
  const hydrated = useHydrated()
  const valueId = useId()
  const [selected, setSelected] = useState(0)
  const [value, setValue] = useState(85)
  const [sent, setSent] = useState(false)
  const [replay, setReplay] = useState(0)
  const reduce = useReducedMotion()
  const example = examples[selected]
  const send = () => {
    setSent(true)
    setReplay((previous) => previous + 1)
  }
  const choose = (index: number) => {
    setSelected(index)
    setValue(examples[index].value)
    setSent(false)
  }
  return (
    <div className="message-demo">
      <div className="demo-heading">
        <span className="bot-avatar">
          <Bot aria-hidden="true" />
        </span>
        <div>
          <strong>Finance Bot</strong>
          <span>Demonstração · dados fictícios</span>
        </div>
        <Send size={18} aria-hidden="true" />
      </div>
      <div className="conversation">
        <p className="bot-message">
          Experimente: ajuste o valor e envie sua mensagem.
        </p>
        <div className="message-result-flow">
          <div className="message-origin">
            <span>No Telegram</span>
            <motion.button
              type="button"
              className="user-message draggable-message"
              disabled={!hydrated}
              aria-label={`Enviar exemplo: ${example.message(value)}`}
              drag={hydrated && !reduce ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.45}
              dragSnapToOrigin
              onDragEnd={(_, info) => {
                if (info.offset.x > 60) send()
              }}
              onClick={send}
              whileDrag={{ scale: 1.04, rotate: 2, cursor: 'grabbing' }}
            >
              <GripVertical size={17} aria-hidden="true" />
              <span>{example.message(value)}</span>
              <Send size={16} aria-hidden="true" />
            </motion.button>
            <span className="message-timestamp">
              Arraste para a direita ou clique para enviar.
            </span>
            <div className="demo-value">
              <label htmlFor={valueId}>
                Valor do exemplo{' '}
                <output htmlFor={valueId}>{value} reais</output>
              </label>
              <input
                id={valueId}
                type="range"
                min="5"
                max="500"
                step="1"
                value={value}
                aria-valuetext={currency(value)}
                disabled={!hydrated}
                onChange={(event) => {
                  setValue(Number(event.target.value))
                  setSent(false)
                }}
              />
            </div>
          </div>
          <ArrowUpRight className="flow-arrow" aria-hidden="true" />
          <div
            className={`receipt-area ${sent ? 'has-receipt' : ''}`}
            aria-live="polite"
            aria-atomic="true"
          >
            <AnimatePresence mode="wait" initial={false}>
              {sent ? (
                <motion.div
                  key={`receipt-${replay}`}
                  className="receipt"
                  initial={{
                    opacity: 0,
                    y: reduce ? 0 : 24,
                    scale: reduce ? 1 : 0.94,
                  }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: reduce ? 0 : 0.45,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <span>
                    <example.icon size={20} aria-hidden="true" />
                    Registro ilustrativo
                  </span>
                  <strong>{currency(value)}</strong>
                  <div>
                    {example.category}
                    <Check size={16} aria-hidden="true" />
                  </div>
                  <p className="receipt-confirmation">
                    <Check size={13} aria-hidden="true" />
                    Exemplo organizado. Nada foi salvo.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  className="receipt-placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.15 }}
                >
                  <span className="receipt-target">
                    <ArrowDownLeft size={25} aria-hidden="true" />
                  </span>
                  <strong>Da conversa ao controle.</strong>
                  <p>Envie a mensagem e veja seu registro aparecer aqui.</p>
                  <span>Simulação local · sem salvar dados</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="demo-send-actions">
          <button
            type="button"
            className="demo-send"
            onClick={send}
            disabled={!hydrated}
          >
            <Send size={15} aria-hidden="true" />
            {sent ? 'Enviar novamente' : 'Enviar exemplo'}
          </button>
          <button
            type="button"
            className="demo-reset"
            onClick={() => choose(0)}
            disabled={!hydrated}
          >
            <RotateCcw size={14} aria-hidden="true" />
            Limpar simulação
          </button>
        </div>
      </div>
      <fieldset className="demo-choices">
        <legend>Escolha uma situação do seu dia</legend>
        {examples.map((item, index) => (
          <button
            key={item.label}
            type="button"
            disabled={!hydrated}
            aria-pressed={selected === index}
            onClick={() => choose(index)}
          >
            {item.label}
          </button>
        ))}
      </fieldset>
    </div>
  )
}
