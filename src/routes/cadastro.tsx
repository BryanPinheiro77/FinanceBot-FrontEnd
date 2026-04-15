import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/AuthLayout";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";
import { requireAnonymous } from "@/lib/auth-guards";
import { getAccounts } from "@/lib/auth-api";
import { hasCompletedOnboarding } from "@/lib/onboarding";

export const Route = createFileRoute("/cadastro")({
  beforeLoad: requireAnonymous,
  head: () => ({
    meta: [
      { title: "Cadastro — Finance Bot" },
      { name: "description", content: "Crie sua conta gratuita no Finance Bot." },
    ],
  }),
  component: CadastroPage,
});

function CadastroPage() {
  const navigate = useNavigate();
  const { register, isLoading: isAuthLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (form.password !== form.confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      const accounts = await getAccounts();
      const nextPath = hasCompletedOnboarding(user, accounts) ? "/dashboard" : "/onboarding";
      await navigate({ to: nextPath });
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Não foi possível criar sua conta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Crie sua conta" subtitle="É rápido e gratuito. Comece a organizar suas finanças.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Nome completo</label>
          <Input
            placeholder="João Silva"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
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
          <label className="text-sm font-medium text-foreground">Senha</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
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
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Confirmar senha</label>
          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              placeholder="Repita sua senha"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="w-full h-12 rounded-xl"
          disabled={isSubmitting || isAuthLoading}
        >
          {isSubmitting ? "Criando conta..." : "Criar minha conta"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
