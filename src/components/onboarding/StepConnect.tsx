import { Send, Copy, Check, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } };
const item = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } } };

interface Props { code: string; copied: boolean; onCopy: () => void; }

const TELEGRAM_BOT_URL = "http://t.me/YourFinanceAssistence_Bot";

export function StepConnect({ code, copied, onCopy }: Props) {
  const steps = [
    { n: "1", text: "Abra o Telegram e procure por @YourFinanceAssistence_Bot", link: TELEGRAM_BOT_URL },
    { n: "2", text: "Inicie uma conversa com o bot" },
    { n: "3", text: `Envie o comando: /connect ${code}` },
    { n: "4", text: "Pronto! O bot confirmará a conexão." },
  ];

  return (
    <div className="max-w-md mx-auto text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="w-14 h-14 rounded-2xl bg-telegram/10 flex items-center justify-center mx-auto mb-6">
        <Send className="w-7 h-7 text-telegram" />
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
        Conecte no Telegram
      </motion.h2>
      <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-muted-foreground text-sm mb-8">
        Siga os passos abaixo para vincular ao nosso bot.
      </motion.p>
      <motion.div variants={container} initial="hidden" animate="visible" className="space-y-3 text-left">
        {steps.map((s) => (
          <motion.div key={s.n} variants={item} whileHover={{ x: 4 }} className="flex items-start gap-4 bg-card rounded-xl border border-border p-4">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">{s.n}</div>
            <div className="flex-1">
              {s.link ? (
                <a href={s.link} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground leading-relaxed flex items-center gap-1 hover:text-primary transition-colors">
                  {s.text}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <p className="text-sm text-foreground leading-relaxed pt-1">{s.text}</p>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-6 bg-muted rounded-xl p-4">
        <p className="text-xs text-muted-foreground mb-2">Comando para copiar:</p>
        <div className="flex items-center justify-center gap-2">
          <code className="font-mono text-sm font-semibold text-primary">/connect {code}</code>
          <button onClick={onCopy} className="text-muted-foreground hover:text-foreground transition-colors">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
