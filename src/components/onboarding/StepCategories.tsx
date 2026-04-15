import { useState } from "react";
import { Tags, Plus, X, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, Reorder } from "framer-motion";

const DEFAULT_CATEGORIES = [
  { id: "1", name: "Alimentação", emoji: "🍔" },
  { id: "2", name: "Transporte", emoji: "🚗" },
  { id: "3", name: "Moradia", emoji: "🏠" },
  { id: "4", name: "Lazer", emoji: "🎮" },
  { id: "5", name: "Saúde", emoji: "💊" },
  { id: "6", name: "Educação", emoji: "📚" },
  { id: "7", name: "Compras", emoji: "🛒" },
  { id: "8", name: "Assinaturas", emoji: "📺" },
];

export interface Category {
  id: string;
  name: string;
  emoji: string;
}

interface Props {
  categories: Category[];
  setCategories: (c: Category[]) => void;
}

export function StepCategories({ categories, setCategories }: Props) {
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("💰");

  const addCategory = () => {
    if (!newName.trim()) return;
    setCategories([...categories, { id: Date.now().toString(), name: newName.trim(), emoji: newEmoji }]);
    setNewName("");
    setNewEmoji("💰");
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  return (
    <div className="max-w-md mx-auto">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
        <Tags className="w-7 h-7 text-primary" />
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-xl font-bold text-foreground text-center mb-2" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
        Organize suas categorias
      </motion.h2>
      <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-muted-foreground text-center text-sm mb-6">
        Personalize as categorias de gastos. Arraste para reordenar, remova ou adicione novas.
      </motion.p>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card rounded-2xl border border-border p-4 mb-4 max-h-[260px] overflow-y-auto">
        <Reorder.Group axis="y" values={categories} onReorder={setCategories} className="space-y-2">
          <AnimatePresence initial={false}>
            {categories.map((cat) => (
              <Reorder.Item key={cat.id} value={cat} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }} className="flex items-center gap-3 bg-background rounded-xl px-3 py-2.5 border border-border cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-lg">{cat.emoji}</span>
                <span className="text-sm font-medium text-foreground flex-1">{cat.name}</span>
                <button type="button" onClick={() => removeCategory(cat.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/10">
                  <X className="w-4 h-4" />
                </button>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center gap-2">
        <Input placeholder="😀" value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} className="w-14 text-center text-lg px-1" maxLength={2} />
        <Input placeholder="Nova categoria..." value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1" onKeyDown={(e) => e.key === "Enter" && addCategory()} />
        <Button type="button" size="icon" variant="outline" onClick={addCategory} disabled={!newName.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </motion.div>
    </div>
  );
}

export { DEFAULT_CATEGORIES };
