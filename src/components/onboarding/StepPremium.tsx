import { Crown, Sparkles, Zap, BarChart3, Shield } from "lucide-react";
import { motion } from "framer-motion";

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } } };
const item = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } } };

const perks = [
  { icon: Zap, label: "Insights com IA ilimitados" },
  { icon: BarChart3, label: "Relatórios avançados e exportação" },
  { icon: Shield, label: "Backup automático dos dados" },
  { icon: Sparkles, label: "Categorização inteligente por IA" },
];

export function StepPremium() {
  return (
    <div className="max-w-md mx-auto text-center">
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring" as const, stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-3xl bg-premium/20 flex items-center justify-center mx-auto mb-6 shadow-lg"
      >
        <Crown className="w-10 h-10 text-premium" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <span className="inline-flex items-center gap-1.5 bg-premium/10 text-premium-foreground text-xs font-bold px-3 py-1 rounded-full mb-4">
          <Sparkles className="w-3.5 h-3.5" /> PRESENTE ESPECIAL
        </span>
      </motion.div>

      <motion.h2 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
        Você ganhou 7 dias grátis! 🎁
      </motion.h2>
      <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-muted-foreground text-sm mb-8">
        Aproveite o plano <span className="font-semibold text-premium-foreground">Premium</span> por 7 dias sem pagar nada. Cancele quando quiser.
      </motion.p>

      <motion.div variants={container} initial="hidden" animate="visible" className="bg-card rounded-2xl border border-border p-5 space-y-3 text-left mb-6">
        {perks.map((perk) => (
          <motion.div key={perk.label} variants={item} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-premium/10 flex items-center justify-center shrink-0">
              <perk.icon className="w-5 h-5 text-premium" />
            </div>
            <span className="text-sm font-medium text-foreground">{perk.label}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: "spring" as const, stiffness: 200 }} className="bg-premium/5 rounded-xl p-4 border border-premium/20">
        <p className="text-xs text-muted-foreground mb-1">Seu trial expira em</p>
        <p className="text-lg font-bold text-foreground">7 dias</p>
        <p className="text-xs text-muted-foreground mt-1">Sem cobrança automática. Relaxa. 😉</p>
      </motion.div>
    </div>
  );
}
