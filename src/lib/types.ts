export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id?: string;
  name: string;
  amount: number;
  date: string;
  note?: string;
  is_recurring: boolean;
  recurrence_interval?: "daily" | "weekly" | "monthly";
  created_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  source: string;
  amount: number;
  date: string;
  is_recurring: boolean;
  recurrence_interval?: "daily" | "weekly" | "monthly";
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  currency: string;
  budget_period_end?: string;
  balance_mode: "auto" | "manual";
  manual_balance?: number;
  theme: "dark" | "light" | "system";
  notifications_enabled: boolean;
  display_name?: string;
  avatar_url?: string;
}

export const CURRENCIES: { code: string; symbol: string; name: string }[] = [
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
];

export const DEFAULT_CATEGORIES: { name: string; color: string; icon: string }[] = [
  { name: "Food & Dining", color: "#F97316", icon: "utensils" },
  { name: "Transport", color: "#3B82F6", icon: "car" },
  { name: "Shopping", color: "#EC4899", icon: "shopping-bag" },
  { name: "Entertainment", color: "#8B5CF6", icon: "film" },
  { name: "Bills & Utilities", color: "#EF4444", icon: "zap" },
  { name: "Health", color: "#10B981", icon: "heart" },
  { name: "Education", color: "#6366F1", icon: "book" },
  { name: "Other", color: "#A1A1AA", icon: "circle" },
];
