"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { CURRENCIES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Palette,
  Globe,
  CalendarDays,
  Database,
  Trash2,
  Plus,
  Pencil,
  Check,
  X,
  Download,
  UserCircle,
} from "lucide-react";
import { HexColorPicker } from "react-colorful";

const COLOR_PALETTE = [
  "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16",
  "#22C55E", "#10B981", "#14B8A6", "#06B6D4", "#0EA5E9",
  "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#D946EF",
  "#EC4899", "#F43F5E", "#7C5CFF", "#A3A3A3", "#52525B"
];

function CustomColorPicker({ color, onChange, position = "bottom" }: { color: string; onChange: (c: string) => void; position?: "top" | "bottom" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState(color);

  useEffect(() => {
    setHexInput(color);
  }, [color]);

  const posClass = position === "bottom" ? "top-full mt-2 origin-top" : "bottom-full mb-2 origin-bottom";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9 rounded-full shrink-0 outline-none ring-2 ring-offset-2 ring-offset-[var(--bg-surface)] ring-transparent focus:ring-[var(--border-subtle)] transition-all shadow-sm"
        style={{ backgroundColor: color }}
      />
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: position === "bottom" ? 10 : -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: position === "bottom" ? 10 : -10 }}
              transition={{ duration: 0.15 }}
              className={`absolute left-0 z-[100] p-4 bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-2xl rounded-2xl w-[260px] backdrop-blur-xl ${posClass}`}
            >
              <div className="mb-4 rounded-xl overflow-hidden shadow-inner border border-[var(--border-subtle)]">
                <HexColorPicker
                  color={color}
                  onChange={(c) => {
                    setHexInput(c);
                    onChange(c);
                  }}
                  style={{ width: "100%", height: "140px" }}
                />
              </div>

              <div className="mb-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1">
                Presets
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => {
                      onChange(c);
                      setHexInput(c);
                      setIsOpen(false);
                    }}
                    className={`w-10 h-10 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${
                      color.toUpperCase() === c.toUpperCase() ? "scale-110 ring-2 ring-white/70 ring-offset-2 ring-offset-[var(--bg-surface-2)] shadow-md" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center gap-3">
                <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">Hex</span>
                <Input 
                  value={hexInput}
                  onChange={(e) => {
                    setHexInput(e.target.value);
                    if (/^#([0-9A-F]{3}){1,2}$/i.test(e.target.value)) {
                      onChange(e.target.value);
                    }
                  }}
                  className="h-8 bg-[var(--bg-base)] border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono flex-1 px-2.5 rounded-lg"
                  placeholder="#FFFFFF"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SettingsPage() {
  const {
    settings,
    categories,
    updateSettings,
    addCategory,
    updateCategory,
    deleteCategory,
    expenses,
    incomes,
    getCurrencySymbol,
  } = useAppStore();

  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#7C5CFF");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatColor, setEditCatColor] = useState("");

  const [localSettings, setLocalSettings] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings(settings);
    }
  }, [settings, localSettings]);

  if (!settings || !localSettings) return null;

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(localSettings);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await updateSettings(localSettings);
    setIsSaving(false);
  };

  const handleExportCSV = () => {
    const symbol = getCurrencySymbol();
    const headers = "Date,Name,Category,Amount,Note\n";
    const rows = expenses
      .map((e) => {
        const cat = categories.find((c) => c.id === e.category_id);
        return `${e.date},"${e.name}","${cat?.name || ""}",${symbol}${e.amount},"${e.note || ""}"`;
      })
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zen-money-expenses-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = { expenses, incomes, categories, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zen-money-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4 pb-24">
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-semibold text-[var(--text-primary)]"
      >
        Settings
      </motion.h1>

      {/* Profile Settings */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
      <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-[var(--text-primary)]">
            <UserCircle className="h-4 w-4 text-[var(--accent-runway)]" />
            Profile
          </CardTitle>
          <CardDescription className="text-[var(--text-muted)]">
            Customize your display name and avatar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[var(--text-primary)]">Display Name</Label>
            <Input
              placeholder="Your name"
              value={localSettings.display_name || ""}
              onChange={(e) => setLocalSettings({ ...localSettings, display_name: e.target.value })}
              className="bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-primary)]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--text-primary)]">Avatar Image URL</Label>
            <Input
              placeholder="https://example.com/avatar.png"
              value={localSettings.avatar_url || ""}
              onChange={(e) => setLocalSettings({ ...localSettings, avatar_url: e.target.value })}
              className="bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-sm"
            />
            <p className="text-xs text-[var(--text-muted)]">
              Paste a direct link to an image. Leave blank to use your Google avatar (if logged in via Google).
            </p>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Currency */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
      <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-[var(--text-primary)]">
            <Globe className="h-4 w-4 text-[var(--accent-runway)]" />
            Currency
          </CardTitle>
          <CardDescription className="text-[var(--text-muted)]">
            Choose your preferred currency.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CURRENCIES.map((cur) => (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                key={cur.code}
                onClick={() => setLocalSettings({ ...localSettings, currency: cur.code })}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  localSettings.currency === cur.code
                    ? "bg-[var(--accent-soft)] text-[var(--accent-runway)] border border-[var(--accent-runway)]/30"
                    : "bg-[var(--bg-surface-2)] text-[var(--text-muted)] border border-transparent hover:border-[var(--border-subtle)]"
                }`}
              >
                {cur.symbol} {cur.code}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Budget Period */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
      <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-[var(--text-primary)]">
            <CalendarDays className="h-4 w-4 text-[var(--accent-runway)]" />
            Budget Period End Date
          </CardTitle>
          <CardDescription className="text-[var(--text-muted)]">
            When does your current budget period end? (e.g., your next salary date)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="date"
            value={localSettings.budget_period_end || ""}
            onChange={(e) => setLocalSettings({ ...localSettings, budget_period_end: e.target.value || undefined })}
            className="bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-primary)] max-w-xs"
          />
        </CardContent>
      </Card>
      </motion.div>

      {/* Balance Mode */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
      <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-[var(--text-primary)]">
            <Database className="h-4 w-4 text-[var(--accent-runway)]" />
            Balance Calculation
          </CardTitle>
          <CardDescription className="text-[var(--text-muted)]">
            How should your balance be calculated?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocalSettings({ ...localSettings, balance_mode: "auto" })}
              className={`flex-1 px-4 py-3 rounded-xl text-sm transition-all ${
                localSettings.balance_mode === "auto"
                  ? "bg-[var(--accent-soft)] text-[var(--accent-runway)] border border-[var(--accent-runway)]/30"
                  : "bg-[var(--bg-surface-2)] text-[var(--text-muted)] border border-transparent hover:border-[var(--border-subtle)]"
              }`}
            >
              <p className="font-medium">Auto</p>
              <p className="text-xs mt-1 opacity-75">Income − Expenses</p>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocalSettings({ ...localSettings, balance_mode: "manual" })}
              className={`flex-1 px-4 py-3 rounded-xl text-sm transition-all ${
                localSettings.balance_mode === "manual"
                  ? "bg-[var(--accent-soft)] text-[var(--accent-runway)] border border-[var(--accent-runway)]/30"
                  : "bg-[var(--bg-surface-2)] text-[var(--text-muted)] border border-transparent hover:border-[var(--border-subtle)]"
              }`}
            >
              <p className="font-medium">Manual</p>
              <p className="text-xs mt-1 opacity-75">Set a fixed balance</p>
            </motion.button>
          </div>
          <AnimatePresence>
            {localSettings.balance_mode === "manual" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <Label className="text-[var(--text-primary)]">Current Balance</Label>
                <Input
                  type="number"
                  placeholder="Enter your balance"
                  value={localSettings.manual_balance ?? ""}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      manual_balance: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-primary)] font-mono max-w-xs"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
      </motion.div>

      {/* Category Manager */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}>
      <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-[var(--text-primary)]">
            <Palette className="h-4 w-4 text-[var(--accent-runway)]" />
            Categories
          </CardTitle>
          <CardDescription className="text-[var(--text-muted)]">
            Manage your expense categories.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Existing categories */}
          <div className="space-y-2">
            <AnimatePresence>
              {categories.map((cat) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={cat.id}
                  className="flex items-center gap-3 bg-[var(--bg-surface-2)] rounded-xl px-3 py-2.5"
                >
                  {editingCatId === cat.id ? (
                    <>
                      <CustomColorPicker
                        color={editCatColor}
                        onChange={setEditCatColor}
                      />
                      <Input
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        className="flex-1 h-8 bg-[var(--bg-base)] border-[var(--border-subtle)] text-sm text-[var(--text-primary)]"
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          updateCategory(cat.id, { name: editCatName, color: editCatColor });
                          setEditingCatId(null);
                        }}
                        className="p-1 text-[var(--money-positive)] hover:bg-[var(--money-positive)]/10 rounded"
                      >
                        <Check className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setEditingCatId(null)}
                        className="p-1 text-[var(--text-muted)] hover:bg-[var(--bg-base)] rounded"
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <div
                        className="h-4 w-4 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="flex-1 text-sm text-[var(--text-primary)]">
                        {cat.name}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setEditCatName(cat.name);
                          setEditCatColor(cat.color);
                        }}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteCategory(cat.id)}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--money-negative)] rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </motion.button>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add new category */}
          <div className="flex items-center gap-2 pt-2">
            <CustomColorPicker
              color={newCatColor}
              onChange={setNewCatColor}
              position="top"
            />
            <Input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New category name"
              className="flex-1 bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-primary)]"
            />
            <Button
              onClick={() => {
                if (newCatName.trim()) {
                  addCategory(newCatName.trim(), newCatColor);
                  setNewCatName("");
                  setNewCatColor("#7C5CFF");
                }
              }}
              size="sm"
              className="bg-[var(--accent-runway)] hover:bg-[var(--accent-runway)]/90 text-white rounded-xl"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Data Export */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.4 }}>
      <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-[var(--text-primary)]">
            <Download className="h-4 w-4 text-[var(--accent-runway)]" />
            Data Export
          </CardTitle>
          <CardDescription className="text-[var(--text-muted)]">
            Download your data.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="bg-[var(--bg-surface-2)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-base)] rounded-xl"
          >
            Export CSV
          </Button>
          <Button
            onClick={handleExportJSON}
            variant="outline"
            className="bg-[var(--bg-surface-2)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-base)] rounded-xl"
          >
            Export JSON
          </Button>
        </CardContent>
      </Card>
      </motion.div>

      {/* Floating Save Button */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4"
          >
            <div className="bg-white/10 border border-white/20 shadow-2xl rounded-full p-3 px-5 flex items-center gap-4 pointer-events-auto backdrop-blur-3xl">
              <span className="text-sm font-medium text-[var(--text-primary)] pl-2">
                Unsaved changes
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setLocalSettings(settings)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] rounded-xl"
                  disabled={isSaving}
                >
                  Discard
                </Button>
                <Button
                  onClick={handleSaveSettings}
                  className="bg-[var(--accent-runway)] hover:bg-[var(--accent-runway)]/90 text-white rounded-xl min-w-[100px]"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
