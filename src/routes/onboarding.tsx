import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingStepper } from "@/components/OnboardingStepper";
import { StepIncome } from "@/components/onboarding/StepIncome";
import { StepAccount } from "@/components/onboarding/StepAccount";
import { StepCategories } from "@/components/onboarding/StepCategories";
import { StepCode } from "@/components/onboarding/StepCode";
import { StepConnect } from "@/components/onboarding/StepConnect";
import { useAuth } from "@/context/auth-context";
import { requireAuth } from "@/lib/auth-guards";
import {
  createAccount,
  createCategory,
  createTelegramLinkCode,
  getAccounts,
  getCategories,
  updateMonthlyBaseIncome,
  type AccountResponse,
  type CategoryResponse,
  type CategoryType,
} from "@/lib/auth-api";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: "Configuração — Finance Bot" },
      { name: "description", content: "Configure sua conta no Finance Bot." },
    ],
  }),
  component: OnboardingPage,
});

const TOTAL_STEPS = 4;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, isLoading, setUser, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [income, setIncome] = useState("");
  const [accountName, setAccountName] = useState("");
  const [copied, setCopied] = useState(false);
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [telegramCode, setTelegramCode] = useState("");
  const [telegramCodeExpiresAt, setTelegramCodeExpiresAt] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = () => {
    setDirection(1);
    setStep((currentStep) => Math.min(currentStep + 1, TOTAL_STEPS - 1));
  };

  const prev = () => {
    setDirection(-1);
    setStep((currentStep) => Math.max(currentStep - 1, 0));
  };

  const copyCode = () => {
    navigator.clipboard.writeText(telegramCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const skipTelegramSetup = async () => {
    await navigate({ to: "/dashboard" });
  };

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      void navigate({ to: "/login" });
    }
  }, [isLoading, navigate, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    const loadOnboardingData = async () => {
      setIsPreparing(true);
      setError(null);

      try {
        const [accountList, categoryList] = await Promise.all([
          getAccounts(),
          getCategories(),
        ]);

        if (!active) {
          return;
        }

        setAccounts(accountList);
        setCategories(categoryList);
        setIncome(user.monthlyBaseIncome ? String(user.monthlyBaseIncome) : "");
        setAccountName(accountList[0]?.name ?? "");

        const hasActiveTelegramCode =
          !!user.telegramLinkCode &&
          !!user.telegramLinkCodeExpiresAt &&
          new Date(user.telegramLinkCodeExpiresAt).getTime() > Date.now();

        if (hasActiveTelegramCode) {
          setTelegramCode(user.telegramLinkCode ?? "");
          setTelegramCodeExpiresAt(user.telegramLinkCodeExpiresAt);
        } else {
          const linkCode = await createTelegramLinkCode();

          if (!active) {
            return;
          }

          setTelegramCode(linkCode.telegramLinkCode);
          setTelegramCodeExpiresAt(linkCode.expiresAt);
          setUser((currentUser) => currentUser ? ({
            ...currentUser,
            telegramLinkCode: linkCode.telegramLinkCode,
            telegramLinkCodeExpiresAt: linkCode.expiresAt,
          }) : currentUser);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof ApiError ? loadError.message : "Não foi possível carregar a configuração inicial.");
        }
      } finally {
        if (active) {
          setIsPreparing(false);
        }
      }
    };

    void loadOnboardingData();

    return () => {
      active = false;
    };
  }, [setUser, user]);

  const handleAddCategory = async (name: string, type: CategoryType) => {
    setError(null);
    setIsCreatingCategory(true);

    try {
      const createdCategory = await createCategory(name, type);
      setCategories((currentCategories) => [...currentCategories, createdCategory].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (createError) {
      setError(createError instanceof ApiError ? createError.message : "Não foi possível criar a categoria.");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleContinue = async () => {
    setError(null);

    if (step === 0) {
      if (!income.trim() || Number(income) <= 0) {
        setError("Informe uma renda mensal válida.");
        return;
      }

      next();
      return;
    }

    if (step === 1) {
      if (!accountName.trim()) {
        setError("Informe o nome da sua conta principal.");
        return;
      }

      next();
      return;
    }

    if (step === 2) {
      setIsSaving(true);

      try {
        const normalizedIncome = Number(income);

        if (!user?.monthlyBaseIncome || Number(user.monthlyBaseIncome) !== normalizedIncome) {
          await updateMonthlyBaseIncome(normalizedIncome);
        }

        const hasAccountWithSameName = accounts.some(
          (account) => account.name.trim().toLowerCase() === accountName.trim().toLowerCase(),
        );

        let nextAccounts = accounts;

        if (!hasAccountWithSameName) {
          const createdAccount = await createAccount(accountName.trim());
          nextAccounts = [createdAccount, ...accounts];
          setAccounts(nextAccounts);
        }

        const refreshedUser = await refreshUser();

        if (refreshedUser) {
          setUser(refreshedUser);
        }

        if (!telegramCode) {
          const linkCode = await createTelegramLinkCode();
          setTelegramCode(linkCode.telegramLinkCode);
          setTelegramCodeExpiresAt(linkCode.expiresAt);
          setUser((currentUser) => currentUser ? ({
            ...currentUser,
            telegramLinkCode: linkCode.telegramLinkCode,
            telegramLinkCodeExpiresAt: linkCode.expiresAt,
          }) : currentUser);
        }

        next();
      } catch (saveError) {
        setError(saveError instanceof ApiError ? saveError.message : "Não foi possível salvar sua configuração.");
      } finally {
        setIsSaving(false);
      }

      return;
    }

    await navigate({ to: "/dashboard" });
  };

  const expiresAtLabel = useMemo(() => {
    if (!telegramCodeExpiresAt) {
      return null;
    }

    const date = new Date(telegramCodeExpiresAt);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [telegramCodeExpiresAt]);

  const stepContent = [
    <StepIncome key="income" income={income} setIncome={setIncome} />,
    <StepAccount key="account" accountName={accountName} setAccountName={setAccountName} />,
    <StepCategories
      key="categories"
      categories={categories}
      onAddCategory={handleAddCategory}
      isCreating={isCreatingCategory}
    />,
    <div key="telegram" className="space-y-8">
      <StepCode code={telegramCode} copied={copied} onCopy={copyCode} expiresAtLabel={expiresAtLabel} />
      <StepConnect code={telegramCode} copied={copied} onCopy={copyCode} />
    </div>,
  ];

  const isLast = step === TOTAL_STEPS - 1;

  if (isLoading || isPreparing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Carregando sua configuração...</p>
          <p className="text-sm text-muted-foreground mt-2">Aguarde um instante.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center py-6 px-4">
        <div className="flex items-center gap-2 text-primary font-bold text-lg" style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}>
          <Bot className="w-6 h-6" />
          Finance Bot
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col items-center px-4 sm:px-8 pb-8">
        <OnboardingStepper currentStep={step} />

        <div className="flex-1 flex items-center w-full max-w-xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full"
            >
              {stepContent[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        {error ? (
          <div className="w-full max-w-md mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center justify-between w-full max-w-md mt-8 gap-4">
          {step > 0 ? (
            <Button variant="ghost" onClick={prev} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          ) : (
            <div />
          )}

          {!isLast ? (
            <Button variant="hero" onClick={() => void handleContinue()} className="gap-2 h-11 px-6 rounded-xl" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Continuar"} <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => void skipTelegramSetup()} className="h-11 px-6 rounded-xl">
                Pular por agora
              </Button>
              <Button
                variant="success"
                onClick={() => void handleContinue()}
                className="gap-2 h-11 px-6 rounded-xl"
              >
                Ir para o painel <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
