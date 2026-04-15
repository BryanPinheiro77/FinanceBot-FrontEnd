import { DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.15 + i * 0.1, duration: 0.45 } }) };

interface Props { income: string; setIncome: (v: string) => void; }

export function StepIncome({ income, setIncome }: Props) {
  return (
    <div className="max-w-md mx-auto">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
        <DollarSign className="w-7 h-7 text-primary" />
      </motion.div>
      <motion.h2 variants={fadeUp} custom={0} initial="hidden" animate="visible" className="text-xl font-bold text-foreground text-center mb-2" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
        Qual sua renda mensal?
      </motion.h2>
      <motion.p variants={fadeUp} custom={1} initial="hidden" animate="visible" className="text-muted-foreground text-center text-sm mb-8">
        Esse valor ajuda a organizar suas metas financeiras. Você pode alterar depois.
      </motion.p>
      <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible" className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
        <Input type="number" placeholder="5.000,00" value={income} onChange={(e) => setIncome(e.target.value)} className="pl-11 text-lg h-14" />
      </motion.div>
    </div>
  );
}
