import { Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } } };
const item = { hidden: { opacity: 0, scale: 0.85 }, visible: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

const accounts = ["Nubank", "Inter", "Banco do Brasil", "Bradesco", "Itaú", "Carteira"];

interface Props { accountName: string; setAccountName: (v: string) => void; }

export function StepAccount({ accountName, setAccountName }: Props) {
  return (
    <div className="max-w-md mx-auto">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
        <Building2 className="w-7 h-7 text-primary" />
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-xl font-bold text-foreground text-center mb-2" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
        Cadastre sua conta principal
      </motion.h2>
      <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-muted-foreground text-center text-sm mb-8">
        Escolha ou digite o nome da sua conta bancária principal.
      </motion.p>
      <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3 mb-4">
        {accounts.map((acc) => (
          <motion.button key={acc} variants={item} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} type="button" onClick={() => setAccountName(acc)}
            className={`p-3 rounded-xl border text-sm font-medium transition-colors ${accountName === acc ? "border-primary bg-accent text-primary" : "border-border bg-card text-foreground hover:border-primary/40"}`}
          >
            {acc}
          </motion.button>
        ))}
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <Input placeholder="Ou digite outro nome..." value={accountName} onChange={(e) => setAccountName(e.target.value)} />
      </motion.div>
    </div>
  );
}
