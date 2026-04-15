import { Link } from "@tanstack/react-router";
import { Bot } from "lucide-react";

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_oklch(0.55_0.14_180_/_0.3),_transparent_60%),radial-gradient(ellipse_at_bottom_left,_oklch(0.35_0.1_200_/_0.4),_transparent_60%)]" />
        <div className="relative z-10 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm mb-8">
            <Bot className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-4" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
            Finance Bot
          </h1>
          <p className="text-primary-foreground/80 text-lg leading-relaxed">
            Organize suas finanças de forma prática usando o Telegram. Registre gastos, consulte saldos e muito mais — tudo por mensagem.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 text-primary font-bold text-xl mb-8" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
            <Bot className="w-6 h-6" />
            Finance Bot
          </Link>
          <h2 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
            {title}
          </h2>
          <p className="text-muted-foreground mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
