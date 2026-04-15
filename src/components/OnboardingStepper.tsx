import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  "Boas-vindas",
  "Renda",
  "Conta",
  "Confirmação",
  "Código",
  "Conectar",
];

export function OnboardingStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-1 w-full max-w-lg mx-auto mb-10">
      {steps.map((label, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="flex items-center w-full">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all duration-300",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-1 rounded-full transition-colors duration-300",
                  isCompleted ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
            <span className={cn(
              "text-[10px] font-medium leading-tight text-center hidden sm:block",
              isCurrent ? "text-primary" : "text-muted-foreground"
            )}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
