import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import {
  Category,
  Expense,
  Income,
  UserSettings,
  DEFAULT_CATEGORIES,
  CURRENCIES,
} from "@/lib/types";

interface AppState {
  // Auth
  userId: string | null;
  userEmail: string | null;
  userMetadata: Record<string, unknown> | null;

  // Settings
  settings: UserSettings | null;
  categories: Category[];
  
  // Data
  expenses: Expense[];
  incomes: Income[];

  // Computed
  currentBalance: number;
  safeToSpendToday: number;
  spentThisMonth: number;

  // Loading
  isLoadingSettings: boolean;
  isLoadingExpenses: boolean;
  isLoadingIncomes: boolean;

  // Actions
  setUser: (userId: string, email: string, metadata?: Record<string, unknown>) => void;
  clearUser: () => void;
  
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;

  fetchCategories: () => Promise<void>;
  addCategory: (name: string, color: string, icon?: string) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  fetchExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, "id" | "user_id" | "created_at">) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  fetchIncomes: () => Promise<void>;
  addIncome: (income: Omit<Income, "id" | "user_id" | "created_at">) => Promise<void>;
  updateIncome: (id: string, updates: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;

  computeBalance: () => void;

  getCurrencySymbol: () => string;
}

export const useAppStore = create<AppState>((set, get) => ({
  userId: null,
  userEmail: null,
  userMetadata: null,
  settings: null,
  categories: [],
  expenses: [],
  incomes: [],
  currentBalance: 0,
  safeToSpendToday: 0,
  spentThisMonth: 0,
  isLoadingSettings: false,
  isLoadingExpenses: false,
  isLoadingIncomes: false,

  setUser: (userId, email, metadata) => set({ userId, userEmail: email, userMetadata: metadata || null }),
  clearUser: () =>
    set({
      userId: null,
      userEmail: null,
      userMetadata: null,
      settings: null,
      categories: [],
      expenses: [],
      incomes: [],
      currentBalance: 0,
      safeToSpendToday: 0,
      spentThisMonth: 0,
    }),

  // ── Settings ──────────────────────────────────────────────
  fetchSettings: async () => {
    const { userId } = get();
    if (!userId) return;
    set({ isLoadingSettings: true });

    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      set({ settings: data as UserSettings });
    } else {
      // Create default settings for new user
      const defaultSettings: UserSettings = {
        user_id: userId,
        currency: "BDT",
        balance_mode: "auto",
        theme: "dark",
        notifications_enabled: false,
      };
      await supabase.from("user_settings").insert(defaultSettings);
      set({ settings: defaultSettings });
    }
    set({ isLoadingSettings: false });
  },

  updateSettings: async (updates) => {
    const { userId, settings } = get();
    if (!userId || !settings) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, user_id, created_at, ...allowedUpdates } = updates as Record<string, unknown>;

    const newSettings = { ...settings, ...updates };
    const { error } = await supabase
      .from("user_settings")
      .update(allowedUpdates)
      .eq("user_id", userId);
      
    if (error) {
      console.error("Error updating settings:", error.message);
      return;
    }
    set({ settings: newSettings });
    get().computeBalance();
  },

  // ── Categories ────────────────────────────────────────────
  fetchCategories: async () => {
    const { userId } = get();
    if (!userId) return;

    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      set({ categories: data as Category[] });
    } else {
      // Seed default categories for new user
      const toInsert = DEFAULT_CATEGORIES.map((c) => ({
        user_id: userId,
        name: c.name,
        color: c.color,
        icon: c.icon,
      }));
      const { data: inserted } = await supabase
        .from("categories")
        .insert(toInsert)
        .select();
      if (inserted) set({ categories: inserted as Category[] });
    }
  },

  addCategory: async (name, color, icon) => {
    const { userId, categories } = get();
    if (!userId) return;

    const { data } = await supabase
      .from("categories")
      .insert({ user_id: userId, name, color, icon })
      .select()
      .single();

    if (data) set({ categories: [...categories, data as Category] });
  },

  updateCategory: async (id, updates) => {
    const { categories } = get();
    await supabase.from("categories").update(updates).eq("id", id);
    set({
      categories: categories.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  },

  deleteCategory: async (id) => {
    const { categories } = get();
    await supabase.from("categories").delete().eq("id", id);
    set({ categories: categories.filter((c) => c.id !== id) });
  },

  // ── Expenses ──────────────────────────────────────────────
  fetchExpenses: async () => {
    const { userId } = get();
    if (!userId) return;
    set({ isLoadingExpenses: true });

    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (data) set({ expenses: data as Expense[] });
    set({ isLoadingExpenses: false });
    get().computeBalance();
  },

  addExpense: async (expense) => {
    const { userId, expenses } = get();
    if (!userId) return;

    const { data } = await supabase
      .from("expenses")
      .insert({ ...expense, user_id: userId })
      .select()
      .single();

    if (data) {
      set({ expenses: [data as Expense, ...expenses] });
      get().computeBalance();
    }
  },

  updateExpense: async (id, updates) => {
    const { expenses } = get();
    await supabase.from("expenses").update(updates).eq("id", id);
    set({
      expenses: expenses.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    });
    get().computeBalance();
  },

  deleteExpense: async (id) => {
    const { expenses } = get();
    await supabase.from("expenses").delete().eq("id", id);
    set({ expenses: expenses.filter((e) => e.id !== id) });
    get().computeBalance();
  },

  // ── Income ────────────────────────────────────────────────
  fetchIncomes: async () => {
    const { userId } = get();
    if (!userId) return;
    set({ isLoadingIncomes: true });

    const { data } = await supabase
      .from("income")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (data) set({ incomes: data as Income[] });
    set({ isLoadingIncomes: false });
    get().computeBalance();
  },

  addIncome: async (income) => {
    const { userId, incomes } = get();
    if (!userId) return;

    const { data } = await supabase
      .from("income")
      .insert({ ...income, user_id: userId })
      .select()
      .single();

    if (data) {
      set({ incomes: [data as Income, ...incomes] });
      get().computeBalance();
    }
  },

  updateIncome: async (id, updates) => {
    const { incomes } = get();
    await supabase.from("income").update(updates).eq("id", id);
    set({
      incomes: incomes.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    });
    get().computeBalance();
  },

  deleteIncome: async (id) => {
    const { incomes } = get();
    await supabase.from("income").delete().eq("id", id);
    set({ incomes: incomes.filter((i) => i.id !== id) });
    get().computeBalance();
  },

  // ── Computed Balance ──────────────────────────────────────
  computeBalance: () => {
    const { settings, expenses, incomes } = get();

    const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    let balance: number;
    if (settings?.balance_mode === "manual" && settings.manual_balance != null) {
      balance = Number(settings.manual_balance) - totalExpenses;
    } else {
      balance = totalIncome - totalExpenses;
    }

    // Spent this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const spentThisMonth = expenses
      .filter((e) => e.date >= monthStart)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Safe to spend today
    let remainingDays = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let endDate: Date;
    if (settings?.budget_period_end) {
      endDate = new Date(settings.budget_period_end);
      // If the set budget period has already passed, roll it forward by months until it's in the future
      while (endDate.getTime() < today.getTime()) {
        endDate.setMonth(endDate.getMonth() + 1);
      }
    } else {
      // Default to end of current month
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      // If today is the last day of the month (or somehow past), roll to next month's end to avoid remainingDays=1
      if (endDate.getTime() <= today.getTime()) {
        endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      }
    }
    endDate.setHours(0, 0, 0, 0);

    const diff = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    // +1 because we include today as a remaining day
    remainingDays = Math.max(diff + 1, 1);

    const safeToSpendToday = Math.max(balance / remainingDays, 0);

    set({ currentBalance: balance, safeToSpendToday, spentThisMonth });
  },

  getCurrencySymbol: () => {
    const { settings } = get();
    const currency = CURRENCIES.find((c) => c.code === settings?.currency);
    return currency?.symbol || "৳";
  },
}));
