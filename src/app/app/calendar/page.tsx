"use client";

import { useState, useRef } from "react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { motion, AnimatePresence } from "framer-motion";
import {
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Expense, Income } from "@/lib/types";
import { Plus, Receipt, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const START_INDEX = 1200; // Index 1200 is the current month. Gives 100 years past and future.
const TOTAL_COUNT = 2400;

export default function CalendarPage() {
  const { expenses, incomes, getCurrencySymbol, safeToSpendToday } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const symbol = getCurrencySymbol();

  // Jump to today
  const jumpToToday = () => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: START_INDEX,
        align: "start",
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="h-full flex flex-col relative -mx-4 md:-mx-8 -my-4 md:-my-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1, duration: 0.4 }}
        className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-end pointer-events-none"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={jumpToToday}
          className="pointer-events-auto px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-[var(--text-primary)] text-sm font-medium hover:bg-white/20 transition-all shadow-lg"
        >
          Today
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="h-full w-full"
      >
      <Virtuoso
        ref={virtuosoRef}
        totalCount={TOTAL_COUNT}
        initialTopMostItemIndex={START_INDEX}
        itemContent={(index) => {
          return (
            <MonthView
              index={index}
              expenses={expenses}
              incomes={incomes}
              onSelectDate={setSelectedDate}
            />
          );
        }}
        className="h-full w-full custom-scrollbar"
      />
      </motion.div>

      {/* Daily Detail Modal */}
      <AnimatePresence>
        {selectedDate && (
          <DailyDetailModal
            date={selectedDate}
            expenses={expenses.filter((e) => isSameDay(parseISO(e.date), selectedDate))}
            incomes={incomes.filter((i) => isSameDay(parseISO(i.date), selectedDate))}
            onClose={() => setSelectedDate(null)}
            symbol={symbol}
            safeToSpend={safeToSpendToday}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MonthView({
  index,
  expenses,
  incomes,
  onSelectDate,
}: {
  index: number;
  expenses: Expense[];
  incomes: Income[];
  onSelectDate: (d: Date) => void;
}) {
  const monthDate = addMonths(startOfMonth(new Date()), index - START_INDEX);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl md:text-4xl font-bold font-heading text-[var(--text-primary)] mb-6 tracking-tight">
          {format(monthDate, "MMMM yyyy")}
        </h2>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 md:gap-4 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs md:text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-2 md:gap-4">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, monthDate);
            const isTodayDate = isToday(day);
            const dayKey = format(day, "yyyy-MM-dd");

            // Calculate totals for this day
            const dayExpenses = expenses.filter((e) => e.date.startsWith(dayKey));
            const dayIncomes = incomes.filter((inc) => inc.date.startsWith(dayKey));
            
            const totalExpense = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
            const totalIncome = dayIncomes.reduce((sum, inc) => sum + Number(inc.amount), 0);

            return (
              <div
                key={day.toISOString()}
                onClick={() => onSelectDate(day)}
                className={`relative aspect-square md:aspect-auto md:h-28 rounded-2xl md:rounded-[24px] p-2 md:p-3 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 flex flex-col items-center md:items-start justify-center md:justify-start ${
                  isCurrentMonth
                    ? isTodayDate
                      ? "bg-violet-500/20 backdrop-blur-3xl border border-violet-500/30 ring-2 ring-violet-500 ring-offset-2 ring-offset-[var(--bg-base)]"
                      : "bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10"
                    : "opacity-30 hover:opacity-50"
                }`}
              >
                <span
                  className={`text-sm md:text-lg font-medium ${
                    isTodayDate ? "text-white" : "text-[var(--text-primary)]"
                  }`}
                >
                  {format(day, "d")}
                </span>

                {/* Desktop: Show amounts */}
                <div className="hidden md:flex flex-col mt-auto w-full gap-1">
                  {totalIncome > 0 && (
                    <div className="text-xs font-medium text-[var(--money-positive)] truncate">
                      +{totalIncome}
                    </div>
                  )}
                  {totalExpense > 0 && (
                    <div className="text-xs font-medium text-[var(--money-negative)] truncate">
                      -{totalExpense}
                    </div>
                  )}
                </div>

                {/* Mobile: Show dots */}
                <div className="md:hidden flex gap-1 mt-auto">
                  {totalIncome > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--money-positive)] shadow-[0_0_8px_var(--money-positive)]" />
                  )}
                  {totalExpense > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--money-negative)] shadow-[0_0_8px_var(--money-negative)]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Spacer between months */}
      <div className="h-16 md:h-24 w-full" />
    </div>
  );
}

function DailyDetailModal({
  date,
  expenses,
  incomes,
  onClose,
  symbol,
  safeToSpend,
}: {
  date: Date;
  expenses: Expense[];
  incomes: Income[];
  onClose: () => void;
  symbol: string;
  safeToSpend: number;
}) {
  const router = useRouter();
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
  
  // Safe to spend only makes sense for current or future dates if we dynamically calculate it.
  // For now, it just shows the global safe to spend.
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full md:max-w-lg bg-white/5 backdrop-blur-3xl border border-white/10 !rounded-b-none md:!rounded-3xl p-6 flex flex-col max-h-[85vh] relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-violet-500/10 rounded-full mix-blend-screen filter blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold font-heading text-[var(--text-primary)]">
              {format(date, "MMMM d")}
            </h3>
            <p className="text-[var(--text-muted)] text-sm">
              {format(date, "EEEE, yyyy")}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 bg-[var(--bg-surface-2)] rounded-full text-[var(--text-muted)] hover:text-white"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-violet-500/20 backdrop-blur-xl border border-violet-500/30 rounded-2xl p-4 flex flex-col justify-center items-center">
            <span className="text-xs text-violet-200/70 mb-1 font-medium uppercase tracking-wider">Safe to spend</span>
            <span className="text-2xl font-bold font-mono text-violet-100 tracking-tight">
              {symbol}{Math.max(0, safeToSpend).toLocaleString()}
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col justify-center items-center">
            <span className="text-xs text-[var(--text-muted)] mb-1 font-medium uppercase tracking-wider">Net</span>
            <span className={`text-xl font-bold font-mono tracking-tight ${totalIncome - totalExpense >= 0 ? "text-[var(--money-positive)]" : "text-[var(--money-negative)]"}`}>
              {totalIncome - totalExpense >= 0 ? "+" : "-"}{symbol}{Math.abs(totalIncome - totalExpense).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar pr-2 space-y-6">
          {expenses.length === 0 && incomes.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[var(--text-muted)]">No transactions on this day.</p>
            </div>
          ) : (
            <>
              {incomes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-[var(--money-positive)] uppercase tracking-wider flex items-center gap-2">
                    <Wallet className="h-4 w-4" /> Incomes
                  </h4>
                  {incomes.map(inc => (
                    <div key={inc.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{inc.source}</p>
                      </div>
                      <span className="font-mono font-medium text-[var(--money-positive)]">+{symbol}{Number(inc.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {expenses.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-[var(--money-negative)] uppercase tracking-wider flex items-center gap-2">
                    <Receipt className="h-4 w-4" /> Expenses
                  </h4>
                  {expenses.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{exp.name}</p>
                      </div>
                      <span className="font-mono font-medium text-[var(--text-primary)]">{symbol}{Number(exp.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            className="flex-1 bg-white/5 border border-white/10 text-[var(--money-negative)] hover:bg-[var(--money-negative)] hover:text-white transition-all rounded-xl"
            onClick={() => {
              router.push(`/app/expenses?add=true&date=${format(date, 'yyyy-MM-dd')}`);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Expense
          </Button>
          <Button
            className="flex-1 bg-white/5 border border-white/10 text-[var(--money-positive)] hover:bg-[var(--money-positive)] hover:text-white transition-all rounded-xl"
            onClick={() => {
              router.push(`/app/income?add=true&date=${format(date, 'yyyy-MM-dd')}`);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Income
          </Button>
        </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
