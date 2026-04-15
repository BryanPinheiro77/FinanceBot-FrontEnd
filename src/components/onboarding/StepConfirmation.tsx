import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Category } from "./StepCategories";

const fadeUp = { hidden: { opacity: 0, y: 15 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.15 + i * 0.1, duration: 0.4 } }) };

interface Props { income: string; accountName: string; categories: Category[]; }

export function StepConfirmation({ income, accountName, categories }: Props) {
  return (
    <div className="max-w-md mx-auto">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-7 h-7 text-primary" />
      </motion.div>
      <motion.h2 variants={fadeUp} custom={0} initial="hidden" animate="visible" className="text-xl font-bold text-foreground text-center mb-2" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
        Confirme seus dados
      </motion.h2>
      <motion.p variants={fadeUp} custom={1} initial="hidden" animate="visible" className="text-muted-foreground text-center text-sm mb-8">
        Revise as informações antes de continuar.
      </motion.p>
      <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible" className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Renda mensal</span>
          <span className="font-semibold text-foreground">R$ {income || "—"}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Conta principal</span>
          <span className="font-semibold text-foreground">{accountName || "—"}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex justify-between items-start">
          <span className="text-sm text-muted-foreground">Categorias</span>
          <div className="flex flex-wrap justify-end gap-1.5 max-w-[200px]">
            {categories.slice(0, 6).map((c) => (
              <span key={c.id} className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{c.emoji} {c.name}</span>
            ))}
            {categories.length > 6 && <span className="text-xs text-muted-foreground">+{categories.length - 6}</span>}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
