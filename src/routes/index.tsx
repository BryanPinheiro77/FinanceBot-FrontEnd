import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, MessageSquare, Shield, Zap, ArrowRight, Wallet, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Finance Bot — Gerencie finanças pelo Telegram" },
      { name: "description", content: "Plataforma de gestão financeira pessoal integrada ao Telegram. Registre gastos, consulte saldos e organize suas finanças por mensagem." },
      { property: "og:title", content: "Finance Bot — Gerencie finanças pelo Telegram" },
      { property: "og:description", content: "Registre gastos, consulte saldos e organize suas finanças direto pelo Telegram." },
    ],
  }),
  component: LandingPage,
});

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-12 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-primary font-bold text-xl" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
          <Bot className="w-7 h-7" />
          Finance Bot
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Entrar</Link>
          </Button>
          <Button variant="hero" size="lg" asChild>
            <Link to="/cadastro">Começar grátis</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 sm:px-12 pt-16 pb-24 max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-6"
          >
            <MessageSquare className="w-4 h-4" />
            Integração com Telegram
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6"
            style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}
          >
            Suas finanças no{" "}
            <span className="text-primary">controle</span>,{" "}
            direto do Telegram
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="text-lg text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed"
          >
            Registre gastos, consulte saldos e organize suas finanças pessoais com linguagem natural. Sem planilhas, sem complicação.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={3}
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button variant="hero" size="lg" className="h-12 px-8 rounded-xl" asChild>
              <Link to="/cadastro">
                Criar conta gratuita
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="lg" className="h-12 px-8 rounded-xl" asChild>
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 sm:px-12 pb-24 max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: MessageSquare,
              title: "Linguagem natural",
              desc: "Envie mensagens como \"gastei 50 no mercado\" e o bot registra automaticamente.",
            },
            {
              icon: Shield,
              title: "Seguro e privado",
              desc: "Seus dados financeiros protegidos com criptografia e acesso exclusivo.",
            },
            {
              icon: Zap,
              title: "Setup em minutos",
              desc: "Cadastre-se, conecte o Telegram e comece a usar. Sem burocracia.",
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              custom={i}
              variants={fadeUp}
              className="bg-card rounded-2xl p-8 border border-border/60 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-5">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 sm:px-12 pb-24 max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-12" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
          Como funciona
        </h2>
        <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {[
            { step: "1", title: "Crie sua conta", desc: "Cadastro rápido e gratuito em poucos segundos." },
            { step: "2", title: "Conecte o Telegram", desc: "Use o código gerado para vincular ao nosso bot." },
            { step: "3", title: "Comece a registrar", desc: "Envie mensagens e gerencie suas finanças." },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-foreground mb-1" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 sm:px-12 pb-24 max-w-6xl mx-auto">
        <div className="bg-primary rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_oklch(0.55_0.14_180_/_0.3),_transparent_60%)]" />
          <div className="relative z-10">
            <Wallet className="w-10 h-10 text-primary-foreground/80 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-3" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
              Pronto para organizar suas finanças?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
              Comece agora gratuitamente e tenha controle total direto pelo Telegram.
            </p>
            <Button variant="secondary" size="lg" className="h-12 px-8 rounded-xl font-semibold" asChild>
              <Link to="/cadastro">
                Criar conta grátis
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 sm:px-12 py-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
            <Bot className="w-5 h-5 text-primary" />
            Finance Bot
          </div>
          <p>© 2026 Finance Bot. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
