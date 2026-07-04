"use client";

import React, { useMemo, useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import {
  Wallet,
  TrendingDown,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  format,
  subDays,
  startOfMonth,
  eachDayOfInterval,
} from "date-fns";
import Link from "next/link";

// ── Animated Counter ─────────────────────────────────────────
function AnimatedNumber({ value, symbol }: { value: number; symbol: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = display;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };

    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className="font-mono tabular-nums">
      {symbol}{display.toLocaleString()}
    </span>
  );
}

// ── Glass Card ────────────────────────────────────────────────
function GlassCard({
  children,
  tint = "violet",
  className = "",
}: {
  children: React.ReactNode;
  tint?: "violet" | "emerald" | "amber";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 12; // slightly amplified for better tilt
    const rotateX = (0.5 - y) * 12;
    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      "--highlight-x": `${x * 100}%`,
      "--highlight-y": `${y * 100}%`,
    });
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() =>
        setStyle({
          transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)",
        })
      }
      style={style as React.CSSProperties}
      className={`glass-panel glass-panel-highlight glass-panel--accent-${tint} p-6 transition-transform duration-100 ease-out will-change-transform ${className}`}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

export default function DashboardPage() {
  const {
    currentBalance,
    safeToSpendToday,
    spentThisMonth,
    expenses,
    categories,
    getCurrencySymbol,
    settings,
  } = useAppStore();

  const symbol = getCurrencySymbol();

  // ── Pre-group expenses by date for O(1) lookup ────────────
  const expensesByDate = useMemo(() => {
    const map = new Map<string, typeof expenses>();
    expenses.forEach(e => {
      const d = e.date.split("T")[0];
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(e);
    });
    return map;
  }, [expenses]);

  // ── Last 30 days spend chart data ─────────────────────────
  const chartData = useMemo(() => {
    const today = new Date();
    const days = eachDayOfInterval({
      start: subDays(today, 29),
      end: today,
    });

    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayExpenses = expensesByDate.get(dateStr) || [];
      const total = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      return {
        date: format(day, "MMM d"),
        amount: total,
      };
    });
  }, [expensesByDate]);

  // ── Category breakdown for pie chart ──────────────────────
  const categoryData = useMemo(() => {
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const monthExpenses = expenses.filter((e) => e.date >= monthStart);

    const grouped: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      const catId = e.category_id || "uncategorized";
      grouped[catId] = (grouped[catId] || 0) + Number(e.amount);
    });

    return Object.entries(grouped)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          name: cat?.name || "Uncategorized",
          value: amount,
          color: cat?.color || "#A1A1AA",
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [expenses, categories]);

  // ── Recent 5 expenses ─────────────────────────────────────
  const recentExpenses = expenses.slice(0, 5);

  // ── Spending Streak ───────────────────────────────────────
  const spendingStreak = useMemo(() => {
    if (!settings?.budget_period_end) return 0;
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const day = subDays(today, i);
      const dateStr = format(day, "yyyy-MM-dd");
      const dayExpenses = expensesByDate.get(dateStr) || [];
      const daySpend = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      
      if (daySpend <= safeToSpendToday) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [expensesByDate, safeToSpendToday, settings]);

  // ── Month-over-month comparison ───────────────────────────
  const monthComparison = useMemo(() => {
    const now = new Date();
    const thisMonthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const lastMonthStart = format(
      startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      "yyyy-MM-dd"
    );
    const lastMonthEnd = format(
      new Date(now.getFullYear(), now.getMonth(), 0),
      "yyyy-MM-dd"
    );

    const thisMonthTotal = expenses
      .filter((e) => e.date >= thisMonthStart)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const lastMonthTotal = expenses
      .filter((e) => e.date >= lastMonthStart && e.date <= lastMonthEnd)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    if (lastMonthTotal === 0) return null;

    const diff = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    return diff;
  }, [expenses]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-semibold text-[var(--text-primary)]"
      >
        Dashboard
      </motion.h1>

      {/* Summary Tilt Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="relative"
        >
          {/* Layer A — ambient glow */}
          <motion.div 
            animate={{ x: [-10, 10, -10], y: [-5, 5, -5] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 -z-10 bg-[var(--primary)]/20 blur-3xl rounded-full scale-75" 
          />
          <GlassCard tint="violet">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-[var(--text-muted)] drop-shadow-sm">Current Balance</p>
              <Wallet className="h-5 w-5 text-[var(--accent-runway)] drop-shadow-sm" />
            </div>
            <p
              className={`text-3xl font-bold drop-shadow-sm ${
                currentBalance >= 0
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--money-negative)]"
              }`}
            >
              <AnimatedNumber value={currentBalance} symbol={symbol} />
            </p>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          {/* Layer A — ambient glow */}
          <motion.div 
            animate={{ x: [10, -10, 10], y: [5, -5, 5] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 -z-10 bg-[var(--money-positive)]/20 blur-3xl rounded-full scale-75" 
          />
          <GlassCard tint="emerald">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-[var(--text-muted)] drop-shadow-sm">Safe to Spend Today</p>
              <CalendarDays className="h-5 w-5 text-[var(--money-positive)] drop-shadow-sm" />
            </div>
            {/* Shimmer text effect */}
            <p className="text-3xl font-bold text-[var(--money-positive)] relative overflow-hidden drop-shadow-sm">
              <AnimatedNumber value={Math.round(safeToSpendToday)} symbol={symbol} />
              <span className="text-sm font-normal text-[var(--text-muted)] ml-1 drop-shadow-sm">/day</span>
              <motion.span
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              />
            </p>
            {spendingStreak > 0 && (
              <p className="text-xs text-[var(--text-muted)] mt-2 drop-shadow-sm">
                🔥 {spendingStreak}-day streak under budget
              </p>
            )}
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          {/* Layer A — ambient glow */}
          <motion.div 
            animate={{ x: [-8, 8, -8], y: [8, -8, 8] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 -z-10 bg-[var(--money-warning)]/15 blur-3xl rounded-full scale-75" 
          />
          <GlassCard tint="amber">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-[var(--text-muted)] drop-shadow-sm">Spent This Month</p>
              <TrendingDown className="h-5 w-5 text-[var(--money-negative)] drop-shadow-sm" />
            </div>
            <p className="text-3xl font-bold text-[var(--money-negative)] drop-shadow-sm">
              <AnimatedNumber value={spentThisMonth} symbol={symbol} />
            </p>
            {monthComparison !== null && (
              <p className="text-xs text-[var(--text-muted)] mt-2 drop-shadow-sm">
                {monthComparison < 0 ? (
                  <span className="text-[var(--money-positive)]">
                    ↓ {Math.abs(monthComparison).toFixed(0)}% less than last month
                  </span>
                ) : (
                  <span className="text-[var(--money-negative)]">
                    ↑ {monthComparison.toFixed(0)}% more than last month
                  </span>
                )}
              </p>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Spending Trend */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
          whileHover={{ y: -4, scale: 1.01 }}
          className="lg:col-span-2 bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-3xl p-6 relative overflow-hidden hover:bg-white/10 hover:shadow-3xl hover:border-white/20 transition-colors"
        >
          <h2 className="text-base font-medium text-[var(--text-primary)] mb-4">
            Last 30 Days
          </h2>
          {expenses.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-[var(--text-muted)] text-sm">
              Add some expenses to see your spending trend
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--accent-runway)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--accent-runway)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--bg-surface-2)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "12px",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                  }}
                  formatter={(value: unknown) => [`${symbol}${value}`, "Spent"]}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--accent-runway)"
                  strokeWidth={2}
                  fill="url(#colorSpend)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 20 }}
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-3xl p-6 relative overflow-hidden hover:bg-white/10 hover:shadow-3xl hover:border-white/20 transition-colors"
        >
          <h2 className="text-base font-medium text-[var(--text-primary)] mb-4">
            This Month
          </h2>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-[var(--text-muted)] text-sm">
              No spending data this month
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {categoryData.slice(0, 4).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-[var(--text-muted)]">{cat.name}</span>
                    </div>
                    <span className="font-mono text-[var(--text-primary)]">
                      {symbol}{cat.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Recent Expenses */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 20 }}
        whileHover={{ y: -4, scale: 1.01 }}
        className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-3xl p-6 relative overflow-hidden hover:bg-white/10 hover:shadow-3xl hover:border-white/20 transition-colors"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-[var(--text-primary)]">
            Recent Expenses
          </h2>
          <Link
            href="/app/expenses"
            className="text-sm text-[var(--accent-runway)] hover:text-[var(--accent-runway)]/80 flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recentExpenses.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-8">
            No expenses logged yet. Hit the + button to get started!
          </p>
        ) : (
          <div className="space-y-2">
            {recentExpenses.map((expense) => {
              const cat = categories.find((c) => c.id === expense.category_id);
              return (
                <div
                  key={expense.id}
                  className="flex items-center gap-3 py-2 border-b border-[var(--border-subtle)] last:border-0"
                >
                  {cat && (
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">
                      {expense.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{expense.date}</p>
                  </div>
                  <span className="text-sm font-mono font-medium text-[var(--text-primary)]">
                    {symbol}{Number(expense.amount).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
