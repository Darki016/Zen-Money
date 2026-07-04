"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/lib/store";
import {
  LayoutDashboard,
  Calendar,
  Receipt,
  Wallet,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/app/dashboard" },
  { label: "Calendar", icon: Calendar, href: "/app/calendar" },
  { label: "Expenses", icon: Receipt, href: "/app/expenses" },
  { label: "Income", icon: Wallet, href: "/app/income" },
  { label: "Settings", icon: Settings, href: "/app/settings" },
];

function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or using a modifier key
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "d":
          router.push("/app/dashboard");
          break;
        case "c":
          router.push("/app/calendar");
          break;
        case "e":
          router.push("/app/expenses");
          break;
        case "i":
          router.push("/app/income");
          break;
        case "s":
          router.push("/app/settings");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const {
    setUser,
    clearUser,
    fetchSettings,
    fetchCategories,
    fetchExpenses,
    fetchIncomes,
    userEmail,
    userMetadata,
    settings,
  } = useAppStore();

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/");
        return;
      }

      setUser(session.user.id, session.user.email || "", session.user.user_metadata);

      // Fetch all data in parallel
      await Promise.all([
        fetchSettings(),
        fetchCategories(),
        fetchExpenses(),
        fetchIncomes(),
      ]);

      if (pathname === "/app") {
        router.push("/app/dashboard");
      }
      setIsReady(true);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        clearUser();
        router.push("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clearUser();
    router.push("/");
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-runway)]" />
          <p className="text-[var(--text-muted)] text-sm">Loading Zen Money...</p>
        </div>
      </div>
    );
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > lastScrollY && currentScrollY > 50) {
      setIsNavVisible(false);
    } else if (currentScrollY < lastScrollY) {
      setIsNavVisible(true);
    }
    setLastScrollY(currentScrollY);
  };

  const displayName = settings?.display_name || userMetadata?.full_name || userEmail?.split("@")[0] || "User";
  const avatarUrl = settings?.avatar_url || userMetadata?.avatar_url;

  // Generate avatar initials from display name
  const initials = displayName
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)] relative overflow-hidden">
      <KeyboardShortcuts />

      {/* Ambient Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 dark:bg-white/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-slate-400/5 dark:bg-slate-400/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-zinc-400/5 dark:bg-zinc-400/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex p-6 pr-0 h-screen sticky top-0 z-10">
        <aside className="flex flex-col w-64 bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-3xl p-4 relative overflow-hidden">
          <div className="mb-8 px-2">
          <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
            Zen Money
          </h1>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer relative overflow-hidden ${
                    isActive
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-white/10 shadow-inner border border-white/10 rounded-xl"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-3 w-full">
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[var(--border-subtle)] pt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--accent-runway)] to-[#34D399] flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
            )}
            <span className="text-sm text-[var(--text-muted)] truncate max-w-[140px]">
              {displayName}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--money-negative)] rounded-xl hover:bg-white/5 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
        </aside>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen z-10">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between border-b border-white/10 bg-white/5 backdrop-blur-3xl px-4 py-3 sticky top-0 z-50 shadow-sm">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            Zen Money
          </h1>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Avatar" className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--accent-runway)] to-[#34D399] flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          )}
        </div>

        {/* Page Content */}
        <div
          className="flex-1 p-4 md:p-8 pb-28 md:pb-8 overflow-auto relative"
          onScroll={handleScroll}
        >
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        <motion.nav
          initial={{ y: 0 }}
          animate={{ y: isNavVisible ? 0 : 100 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden bg-white/10 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-t-[32px] flex items-center justify-around px-2 py-3 fixed bottom-0 left-0 right-0 z-40"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors relative overflow-hidden ${
                    isActive
                      ? "text-[var(--accent-runway)] drop-shadow-sm"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-active"
                      className="absolute inset-0 bg-white/10 rounded-xl"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <item.icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </motion.nav>
      </main>
    </div>
  );
}
