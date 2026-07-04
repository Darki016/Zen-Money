"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassSelect } from "@/components/ui/glass-select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Search,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Undo2,
  Receipt,
} from "lucide-react";

function ExpensesContent() {
  const searchParams = useSearchParams();
  const showAddOnMount = searchParams.get("add") === "true";
  const dateFromParams = searchParams.get("date");

  const {
    expenses,
    categories,
    addExpense,
    updateExpense,
    deleteExpense,
    getCurrencySymbol,
  } = useAppStore();

  const [showAddModal, setShowAddModal] = useState(showAddOnMount);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");

  // Add form state
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState(categories[0]?.id || "");
  const [newDate, setNewDate] = useState(
    dateFromParams || new Date().toISOString().split("T")[0]
  );
  const [newNote, setNewNote] = useState("");
  const [newRecurring, setNewRecurring] = useState(false);
  const [newInterval, setNewInterval] = useState<"daily" | "weekly" | "monthly">("monthly");

  // Undo state
  const [undoExpense, setUndoExpense] = useState<typeof expenses[0] | null>(null);
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);

  const symbol = getCurrencySymbol();

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        !searchQuery ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.note?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || e.category_id === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, filterCategory]);

  const handleAdd = async () => {
    if (!newName.trim() || !newAmount) return;
    await addExpense({
      name: newName.trim(),
      amount: Number(newAmount),
      category_id: newCategory || undefined,
      date: newDate,
      note: newNote || undefined,
      is_recurring: newRecurring,
      recurrence_interval: newRecurring ? newInterval : undefined,
    });
    setNewName("");
    setNewAmount("");
    setNewNote("");
    setNewRecurring(false);
    setShowAddModal(false);
  };

  const handleDelete = (expense: typeof expenses[0]) => {
    // Clear any existing undo timer
    if (undoTimer) clearTimeout(undoTimer);

    setUndoExpense(expense);
    deleteExpense(expense.id);

    const timer = setTimeout(() => {
      setUndoExpense(null);
    }, 5000);
    setUndoTimer(timer);
  };

  const handleUndo = async () => {
    if (!undoExpense) return;
    if (undoTimer) clearTimeout(undoTimer);

    await addExpense({
      name: undoExpense.name,
      amount: undoExpense.amount,
      category_id: undoExpense.category_id,
      date: undoExpense.date,
      note: undoExpense.note,
      is_recurring: undoExpense.is_recurring,
      recurrence_interval: undoExpense.recurrence_interval,
    });
    setUndoExpense(null);
  };

  const startEdit = (expense: typeof expenses[0]) => {
    setEditingId(expense.id);
    setEditName(expense.name);
    setEditAmount(String(expense.amount));
    setEditCategory(expense.category_id || "");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateExpense(editingId, {
      name: editName,
      amount: Number(editAmount),
      category_id: editCategory || undefined,
    });
    setEditingId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold text-[var(--text-primary)]"
        >
          Expenses
        </motion.h1>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-[var(--accent-runway)] hover:bg-[var(--accent-runway)]/90 text-white rounded-xl"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Search & Filter */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 backdrop-blur-xl border border-white/10 text-[var(--text-primary)] rounded-xl"
          />
        </div>
        <div className="relative z-50 w-full sm:w-48">
          <GlassSelect
            value={filterCategory}
            onChange={setFilterCategory}
            options={[
              { value: "all", label: "All Categories" },
              ...categories.map((c) => ({ value: c.id, label: c.name, color: c.color }))
            ]}
          />
        </div>
      </motion.div>

      {/* Expenses List */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
      {filteredExpenses.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-xl rounded-3xl">
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center">
              <Receipt className="h-6 w-6 text-[var(--accent-runway)]" />
            </div>
            <p className="text-[var(--text-muted)] text-center">
              {expenses.length === 0
                ? "No expenses yet. Start tracking your spending!"
                : "No expenses match your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredExpenses.map((expense) => {
            const cat = categories.find((c) => c.id === expense.category_id);
            const isEditing = editingId === expense.id;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.01, y: -2 }}
                key={expense.id}
                className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 group hover:bg-white/10 transition-colors shadow-sm ${
                  isEditing ? "relative z-[100]" : "relative z-10"
                }`}
              >
                {isEditing ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 h-8 bg-black/20 border border-white/10 text-sm text-[var(--text-primary)] rounded-xl"
                    />
                    <Input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-28 h-8 bg-black/20 border border-white/10 text-sm font-mono text-[var(--text-primary)] rounded-xl"
                    />
                    <div className="w-40 relative z-[60]">
                      <GlassSelect
                        value={editCategory}
                        onChange={setEditCategory}
                        options={[
                          { value: "", label: "No category" },
                          ...categories.map((c) => ({ value: c.id, label: c.name, color: c.color }))
                        ]}
                      />
                    </div>
                    <button
                      onClick={saveEdit}
                      className="p-1.5 text-[var(--money-positive)] hover:bg-[var(--money-positive)]/10 rounded-lg"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-base)] rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    {cat && (
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium"
                        style={{
                          backgroundColor: `${cat.color}20`,
                          color: cat.color,
                        }}
                      >
                        {cat.name}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {expense.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {expense.date}
                        {expense.note && ` · ${expense.note}`}
                      </p>
                    </div>
                    <span className="text-sm font-mono font-medium text-[var(--text-primary)]">
                      {symbol}
                      {Number(expense.amount).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => startEdit(expense)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] rounded-lg"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(expense)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--money-negative)] hover:bg-[var(--money-negative)]/10 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </motion.button>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
      </motion.div>

      {/* Undo Toast */}
      <AnimatePresence>
        {undoExpense && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl"
          >
            <span className="text-sm text-[var(--text-primary)]">
              Deleted &quot;{undoExpense.name}&quot;
            </span>
            <button
              onClick={handleUndo}
              className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent-runway)] hover:text-[var(--accent-runway)]/80"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAddModal(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md relative"
            >
              <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-violet-500/20 rounded-full mix-blend-screen filter blur-[80px] pointer-events-none" />
                <div className="relative z-10">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Add Expense
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[var(--text-primary)]">Name</Label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="What did you spend on?"
                      className="bg-black/20 border-white/10 text-[var(--text-primary)] rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[var(--text-primary)]">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-mono">
                        {symbol}
                      </span>
                      <Input
                        type="number"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        placeholder="0"
                        className="pl-8 bg-black/20 border-white/10 text-[var(--text-primary)] font-mono rounded-xl"
                      />
                    </div>
                    {/* Preview: tomorrow's budget impact */}
                    {newAmount && Number(newAmount) > 0 && (
                      <p className="text-xs text-[var(--text-muted)]">
                        If you spend this, tomorrow&apos;s budget becomes{" "}
                        <span className="font-mono text-[var(--money-warning)]">
                          {symbol}
                          {Math.max(
                            (useAppStore.getState().safeToSpendToday *
                              (useAppStore.getState().settings?.budget_period_end
                                ? Math.max(
                                    Math.ceil(
                                      (new Date(
                                        useAppStore.getState().settings!.budget_period_end!
                                      ).getTime() -
                                        new Date().getTime()) /
                                        (1000 * 60 * 60 * 24)
                                    ),
                                    1
                                  )
                                : 1) -
                              Number(newAmount)) /
                              Math.max(
                                (useAppStore.getState().settings?.budget_period_end
                                  ? Math.ceil(
                                      (new Date(
                                        useAppStore.getState().settings!.budget_period_end!
                                      ).getTime() -
                                        new Date().getTime()) /
                                        (1000 * 60 * 60 * 24)
                                    ) - 1
                                  : 1),
                                1
                              ),
                            0
                          ).toFixed(0)}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[var(--text-primary)]">Category</Label>
                    <GlassSelect
                      value={newCategory}
                      onChange={setNewCategory}
                      options={[
                        { value: "", label: "No category" },
                        ...categories.map((c) => ({ value: c.id, label: c.name, color: c.color }))
                      ]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[var(--text-primary)]">Date</Label>
                    <Input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="bg-black/20 border-white/10 text-[var(--text-primary)] rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[var(--text-primary)]">Note (optional)</Label>
                    <Input
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note..."
                      className="bg-black/20 border-white/10 text-[var(--text-primary)] rounded-xl"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setNewRecurring(!newRecurring)}
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                        newRecurring
                          ? "bg-[var(--accent-runway)] border-[var(--accent-runway)]"
                          : "border-[var(--border-subtle)]"
                      }`}
                    >
                      {newRecurring && <Check className="h-3 w-3 text-white" />}
                    </button>
                    <Label className="text-[var(--text-primary)] cursor-pointer" onClick={() => setNewRecurring(!newRecurring)}>
                      Recurring expense
                    </Label>
                  </div>

                  {newRecurring && (
                    <div className="flex gap-2 pl-8">
                      {(["daily", "weekly", "monthly"] as const).map((int) => (
                        <button
                          key={int}
                          onClick={() => setNewInterval(int)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            newInterval === int
                              ? "bg-[var(--accent-soft)] text-[var(--accent-runway)]"
                              : "bg-[var(--bg-surface-2)] text-[var(--text-muted)]"
                          }`}
                        >
                          {int.charAt(0).toUpperCase() + int.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => setShowAddModal(false)}
                      variant="outline"
                      className="flex-1 bg-white/5 border-white/10 text-[var(--text-primary)] hover:bg-white/10 rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAdd}
                      className="flex-1 bg-[var(--accent-runway)] hover:bg-[var(--accent-runway)]/90 text-white rounded-xl"
                      disabled={!newName.trim() || !newAmount}
                    >
                      Add Expense
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[var(--text-muted)]">Loading expenses...</div>}>
      <ExpensesContent />
    </Suspense>
  );
}
