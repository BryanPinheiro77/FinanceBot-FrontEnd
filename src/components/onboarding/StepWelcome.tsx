import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const iconPop = { hidden: { scale: 0, rotate: -20 }, visible: { scale: 1, rotate: 0, transition: { type: "spring" as const, stiffness: 260, damping: 20, delay: 0.1 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.2 + i * 0.1, duration: 0.5 } }) };

export function StepWelcome() {
  return (
    <div className="text-center max-w-md mx-auto">
      <motion.div variants={iconPop} initial="hidden" animate="visible" className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-8 h-8 text-primary" />
      </motion.div>
      <motion.h2 variants={fadeUp} custom={0} initial="hidden" animate="visible" className="text-2xl font-bold text-foreground mb-3" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
        Bem-vindo ao Finance Bot! 🎉
      </motion.h2>
      <motion.p variants={fadeUp} custom={1} initial="hidden" animate="visible" className="text-muted-foreground leading-relaxed mb-2">
        Vamos configurar tudo em poucos minutos. Você vai poder registrar gastos, ver saldos e receber insights — tudo pelo Telegram.
      </motion.p>
      <motion.p variants={fadeUp} custom={2} initial="hidden" animate="visible" className="text-sm text-muted-foreground">
        Vamos começar?
      </motion.p>
    </div>
  );
}
