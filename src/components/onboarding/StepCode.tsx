import { Bot, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface Props {
  code: string;
  copied: boolean;
  onCopy: () => void;
  expiresAtLabel?: string | null;
}

export function StepCode({ code, copied, onCopy, expiresAtLabel }: Props) {
  return (
    <div className="max-w-md mx-auto text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="w-14 h-14 rounded-2xl bg-telegram/10 flex items-center justify-center mx-auto mb-6">
        <Bot className="w-7 h-7 text-telegram" />
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
        Seu código de conexão
      </motion.h2>
      <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-muted-foreground text-sm mb-8">
        Use este código para vincular sua conta ao bot do Telegram.
      </motion.p>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 20 }} className="bg-card rounded-2xl border border-border p-6 mb-4">
        <motion.div initial={{ opacity: 0, letterSpacing: "0.3em" }} animate={{ opacity: 1, letterSpacing: "0.15em" }} transition={{ delay: 0.5, duration: 0.6 }} className="font-mono text-3xl font-bold text-primary mb-4">
          {code}
        </motion.div>
        <Button variant="outline" size="sm" onClick={onCopy} className="gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copiado!" : "Copiar código"}
        </Button>
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-xs text-muted-foreground">
        {expiresAtLabel ? `Este código expira em ${expiresAtLabel}.` : "Este código expira em alguns minutos."}
      </motion.p>
    </div>
  );
}
