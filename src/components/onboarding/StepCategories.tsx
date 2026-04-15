import { useMemo, useState } from "react";
import { Tags, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CategoryResponse, CategoryType } from "@/lib/auth-api";

interface Props {
  categories: CategoryResponse[];
  onAddCategory: (name: string, type: CategoryType) => Promise<void>;
  isCreating: boolean;
}

export function StepCategories({ categories, onAddCategory, isCreating }: Props) {
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<CategoryType>("EXPENSE");

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === "EXPENSE"),
    [categories],
  );
  const incomeCategories = useMemo(
    () => categories.filter((category) => category.type === "INCOME"),
    [categories],
  );

  const addCategory = async () => {
    if (!newName.trim()) {
      return;
    }

    await onAddCategory(newName.trim(), newType);
    setNewName("");
    setNewType("EXPENSE");
  };

  return (
    <div className="max-w-md mx-auto">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
        <Tags className="w-7 h-7 text-primary" />
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-xl font-bold text-foreground text-center mb-2" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
        Revise suas categorias
      </motion.h2>
      <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-muted-foreground text-center text-sm mb-6">
        Sua conta já começa com categorias padrão no backend. Se quiser, adicione novas categorias agora.
      </motion.p>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card rounded-2xl border border-border p-4 mb-4 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Despesas</p>
          <div className="flex flex-wrap gap-2">
            {expenseCategories.map((category) => (
              <span key={category.id} className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                {category.name}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Receitas</p>
          <div className="flex flex-wrap gap-2">
            {incomeCategories.map((category) => (
              <span key={category.id} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                {category.name}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={newType === "EXPENSE" ? "default" : "outline"}
            size="sm"
            onClick={() => setNewType("EXPENSE")}
          >
            Despesa
          </Button>
          <Button
            type="button"
            variant={newType === "INCOME" ? "default" : "outline"}
            size="sm"
            onClick={() => setNewType("INCOME")}
          >
            Receita
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Nova categoria..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void addCategory();
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => void addCategory()}
            disabled={!newName.trim() || isCreating}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
