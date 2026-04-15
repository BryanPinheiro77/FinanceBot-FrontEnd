import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, DollarSign, Building2, CheckCircle, Send, LogOut, Sun, Moon, ExternalLink } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const TELEGRAM_BOT_URL = "http://t.me/YourFinanceAssistence_Bot";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — Finance Bot" },
      { name: "description", content: "Seu painel financeiro no Finance Bot." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 sm:px-12 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-primary font-bold text-lg" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
            <Bot className="w-6 h-6" />
            Finance Bot
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" asChild>
              <Link to="/">
                <LogOut className="w-4 h-4" /> Sair
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="px-6 sm:px-12 py-10 max-w-6xl mx-auto">
        {/* Success banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-accent border border-primary/20 rounded-2xl p-6 mb-8 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
              Sua conta foi configurada com sucesso! 🎉
            </h2>
            <p className="text-sm text-muted-foreground">
              Agora você pode começar a registrar suas finanças pelo Telegram.
            </p>
          </div>
        </motion.div>

        <h1 className="text-2xl font-bold text-foreground mb-6" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
          Visão Geral
        </h1>

        <div className="grid sm:grid-cols-3 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Renda mensal</span>
            </div>
            <p className="text-2xl font-bold text-foreground">R$ 5.000,00</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Conta principal</span>
            </div>
            <p className="text-2xl font-bold text-foreground">Nubank</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-telegram/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-telegram" />
              </div>
              <span className="text-sm text-muted-foreground">Telegram</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <p className="text-lg font-semibold text-foreground">Conectado</p>
            </div>
          </motion.div>
        </div>

        <div className="mt-10 bg-card rounded-2xl border border-border p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Envie uma mensagem para o bot no Telegram para começar a registrar suas finanças.
          </p>
          <div className="bg-muted rounded-xl p-4 inline-block mb-4">
            <code className="font-mono text-sm text-primary">
              "Gastei 35 reais no almoço"
            </code>
          </div>
          <div>
            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-telegram hover:underline"
            >
              Abrir @YourFinanceAssistence_Bot no Telegram
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
