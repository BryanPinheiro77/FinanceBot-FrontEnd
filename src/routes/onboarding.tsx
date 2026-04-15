import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OnboardingStepper } from "@/components/OnboardingStepper";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, ArrowRight, ArrowLeft } from "lucide-react";
import { StepWelcome } from "@/components/onboarding/StepWelcome";
import { StepIncome } from "@/components/onboarding/StepIncome";
import { StepAccount } from "@/components/onboarding/StepAccount";
import { StepCategories, DEFAULT_CATEGORIES, type Category } from "@/components/onboarding/StepCategories";
import { StepConfirmation } from "@/components/onboarding/StepConfirmation";
import { StepCode } from "@/components/onboarding/StepCode";
import { StepConnect } from "@/components/onboarding/StepConnect";
import { StepPremium } from "@/components/onboarding/StepPremium";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Configuração — Finance Bot" },
      { name: "description", content: "Configure sua conta no Finance Bot." },
    ],
  }),
  component: OnboardingPage,
});

const TOTAL_STEPS = 8;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [income, setIncome] = useState("");
  const [accountName, setAccountName] = useState("");
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [copied, setCopied] = useState(false);

  const code = "FB-8K2X9M";

  const next = () => { setDirection(1); setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)); };
  const prev = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)); };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stepContent = [
    <StepWelcome key="welcome" />,
    <StepIncome key="income" income={income} setIncome={setIncome} />,
    <StepAccount key="account" accountName={accountName} setAccountName={setAccountName} />,
    <StepCategories key="categories" categories={categories} setCategories={setCategories} />,
    <StepConfirmation key="confirm" income={income} accountName={accountName} categories={categories} />,
    <StepCode key="code" code={code} copied={copied} onCopy={copyCode} />,
    <StepConnect key="connect" code={code} copied={copied} onCopy={copyCode} />,
    <StepPremium key="premium" />,
  ];

  const isLast = step === TOTAL_STEPS - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center py-6 px-4">
        <div className="flex items-center gap-2 text-primary font-bold text-lg" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
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

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center justify-between w-full max-w-md mt-8 gap-4">
          {step > 0 ? (
            <Button variant="ghost" onClick={prev} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          ) : (
            <div />
          )}
          {!isLast ? (
            <Button variant="hero" onClick={next} className="gap-2 h-11 px-6 rounded-xl">
              Continuar <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={() => navigate({ to: "/dashboard" })}
              className="gap-2 h-11 px-6 rounded-xl"
            >
              Ir para o painel <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
