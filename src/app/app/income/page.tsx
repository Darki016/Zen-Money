"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Wallet,
} from "lucide-react";

function IncomeContent() {
  const {
    incomes,
    addIncome,
    updateIncome,
    deleteIncome,
    getCurrencySymbol,
    settings,
    updateSettings,
  } = useAppStore();

  const searchParams = useSearchParams();
  const showAddOnMount = searchParams.get("add") === "true";
  const dateFromParams = searchParams.get("date");
  const [showAddModal, setShowAddModal] = useState(showAddOnMount);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSource, setEditSource] = useState("");
  const [editAmount, setEditAmount] = useState("");

  // Add form
  const [newSource, setNewSource] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(
    dateFromParams || new Date().toISOString().split("T")[0]
  );
  const [newRecurring, setNewRecurring] = useState(false);
  const [newInterval, setNewInterval] = useState<"daily" | "weekly" | "monthly">("monthly");

  const symbol = getCurrencySymbol();

  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);

  const handleAdd = async () => {
    if (!newSource.trim() || !newAmount) return;
    await addIncome({
      source: newSource.trim(),
      amount: Number(newAmount),
      date: newDate,
      is_recurring: newRecurring,
      recurrence_interval: newRecurring ? newInterval : undefined,
    });
    setNewSource("");
    setNewAmount("");
    setNewRecurring(false);
    setShowAddModal(false);
  };

  const startEdit = (income: typeof incomes[0]) => {
    setEditingId(income.id);
    setEditSource(income.source);
    setEditAmount(String(income.amount));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateIncome(editingId, {
      source: editSource,
      amount: Number(editAmount),
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
          Income
        </motion.h1>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-[var(--money-positive)] hover:bg-[var(--money-positive)]/90 text-black rounded-xl"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Income
        </Button>
      </div>

      {/* Summary and Budget Settings */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Summary Card */}
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-sm rounded-3xl h-full">
          <CardContent className="py-6 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-muted)]">Total Income</p>
                <p className="text-3xl font-mono font-bold text-[var(--money-positive)]">
                  {symbol}{totalIncome.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[var(--money-positive)]/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-[var(--money-positive)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Period End (quick access) */}
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-sm rounded-3xl h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[var(--text-primary)]">
              Budget Period End Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[var(--text-muted)] mb-2">
              When is your next income expected? This is used to calculate your daily budget.
            </p>
            <Input
              type="date"
              value={settings?.budget_period_end || ""}
              onChange={(e) =>
                updateSettings({ budget_period_end: e.target.value || undefined })
              }
              className="bg-black/20 border-white/10 text-[var(--text-primary)] w-full rounded-xl"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Income List */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
      {incomes.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-xl rounded-3xl">
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[var(--money-positive)]/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-[var(--money-positive)]" />
            </div>
            <p className="text-[var(--text-muted)] text-center">
              No income logged yet. Add your first income source!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {incomes.map((income) => {
            const isEditing = editingId === income.id;

            return (
              <motion.div
                key={income.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.01, y: -2 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 group hover:bg-white/10 transition-colors shadow-sm"
              >
                {isEditing ? (
                  <>
                    <Input
                      value={editSource}
                      onChange={(e) => setEditSource(e.target.value)}
                      className="flex-1 h-8 bg-black/20 border-white/10 text-sm text-[var(--text-primary)] rounded-lg"
                    />
                    <Input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-32 h-8 bg-black/20 border-white/10 text-sm font-mono text-[var(--text-primary)] rounded-lg"
                    />
                    <button
                      onClick={saveEdit}
                      className="p-1.5 text-[var(--money-positive)] hover:bg-[var(--money-positive)]/10 rounded-lg"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 text-[var(--text-muted)] hover:bg-white/10 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {income.source}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {income.date}
                        {income.is_recurring && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-[var(--accent-soft)] text-[var(--accent-runway)]">
                            {income.recurrence_interval}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-sm font-mono font-semibold text-[var(--money-positive)]">
                      +{symbol}{Number(income.amount).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => startEdit(income)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 rounded-lg"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteIncome(income.id)}
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

      {/* Add Income Modal */}
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
                <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-emerald-500/20 rounded-full mix-blend-screen filter blur-[80px] pointer-events-none" />
                <div className="relative z-10">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Add Income
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[var(--text-primary)]">Source</Label>
                    <Input
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      placeholder="Salary, freelance, etc."
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

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setNewRecurring(!newRecurring)}
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                        newRecurring
                          ? "bg-[var(--money-positive)] border-[var(--money-positive)]"
                          : "border-[var(--border-subtle)]"
                      }`}
                    >
                      {newRecurring && <Check className="h-3 w-3 text-black" />}
                    </button>
                    <Label className="text-[var(--text-primary)] cursor-pointer" onClick={() => setNewRecurring(!newRecurring)}>
                      Recurring income
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
                              ? "bg-[var(--money-positive)]/15 text-[var(--money-positive)]"
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
                      className="flex-1 bg-[var(--money-positive)] hover:bg-[var(--money-positive)]/90 text-black rounded-xl"
                      disabled={!newSource.trim() || !newAmount}
                    >
                      Add Income
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

export default function IncomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[var(--text-muted)]">Loading income...</div>}>
      <IncomeContent />
    </Suspense>
  );
}
