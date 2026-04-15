import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/AuthLayout";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Finance Bot" },
      { name: "description", content: "Acesse sua conta no Finance Bot." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/onboarding" });
  };

  return (
    <AuthLayout title="Bem-vindo de volta" subtitle="Entre na sua conta para continuar.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">E-mail</label>
          <Input
            type="email"
            placeholder="joao@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Senha</label>
            <button type="button" className="text-xs text-primary hover:underline">Esqueceu a senha?</button>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" variant="hero" size="lg" className="w-full h-12 rounded-xl">
          Entrar
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link to="/cadastro" className="text-primary font-medium hover:underline">
            Criar conta grátis
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
