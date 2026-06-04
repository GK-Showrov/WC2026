"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Target,
  TrendingUp,
  Trophy,
  Users,
  User,
  Shield,
  Trophy as TrophyIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Fixtures", href: "/fixtures", icon: CalendarDays },
  { title: "Predictions", href: "/predictions", icon: Target },
  { title: "Betting", href: "/betting", icon: TrendingUp },
  { title: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { title: "Leagues", href: "/leagues", icon: Users },
  { title: "Profile", href: "/profile", icon: User },
];

interface SidebarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username: string;
    role: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile toggle button — rendered in TopBar */}
      <input
        type="checkbox"
        id="sidebar-mobile-toggle"
        className="sr-only"
        checked={mobileOpen}
        onChange={(e) => setMobileOpen(e.target.checked)}
      />

      <AnimatePresence mode="wait">
        <motion.aside
          key={collapsed ? "collapsed" : "expanded"}
          initial={false}
          animate={{ width: collapsed ? 72 : 240 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className={cn(
            "hidden lg:flex flex-col h-full border-r border-white/5 bg-navy-950/80 backdrop-blur-xl overflow-hidden relative z-10",
          )}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 p-4 h-16 border-b border-white/5">
            <div className="w-9 h-9 bg-gold rounded-xl flex items-center justify-center flex-shrink-0">
              <TrophyIcon className="w-5 h-5 text-navy-950" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-display font-bold text-sm whitespace-nowrap overflow-hidden"
                >
                  World Cup <span className="gold-text">Predictor</span>
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Nav items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                      isActive
                        ? "bg-gradient-to-r from-gold/15 to-transparent border-l-2 border-gold text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0",
                        isActive ? "text-gold" : "group-hover:text-foreground"
                      )}
                    />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -5 }}
                          className="text-sm font-medium whitespace-nowrap overflow-hidden"
                        >
                          {item.title}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </Link>
              );
            })}

            {/* Admin link */}
            {user.role === "ADMIN" && (
              <Link href="/admin">
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group mt-4",
                    pathname.startsWith("/admin")
                      ? "bg-gradient-to-r from-red-500/15 to-transparent border-l-2 border-red-500 text-foreground"
                      : "text-red-400/70 hover:text-red-400 hover:bg-white/5"
                  )}
                >
                  <Shield className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        Admin Panel
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            )}
          </nav>

          {/* User info */}
          <div className="p-3 border-t border-white/5">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 text-gold font-bold text-sm">
                {(user.name?.[0] || user.username?.[0] || "U").toUpperCase()}
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="min-w-0"
                  >
                    <div className="text-sm font-medium truncate">{user.name || user.username}</div>
                    <div className="text-xs text-muted-foreground truncate">@{user.username}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-navy-800 border border-white/10 rounded-full flex items-center justify-center hover:bg-navy-700 transition-colors z-20"
          >
            {collapsed ? (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        </motion.aside>
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-64 bg-navy-950 border-r border-white/5 z-50 lg:hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-4 h-16 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
                  <TrophyIcon className="w-5 h-5 text-navy-950" />
                </div>
                <span className="font-display font-bold text-sm">
                  World Cup <span className="gold-text">Predictor</span>
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-gold/15 to-transparent border-l-2 border-gold text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5", isActive ? "text-gold" : "")} />
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                  </Link>
                );
              })}
              {user.role === "ADMIN" && (
                <Link href="/admin">
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-white/5 transition-all mt-4">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm font-medium">Admin Panel</span>
                  </div>
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function SidebarMobileToggle() {
  return (
    <label htmlFor="sidebar-mobile-toggle" className="lg:hidden cursor-pointer">
      <div className="w-9 h-9 flex flex-col items-center justify-center gap-1.5">
        <span className="w-5 h-0.5 bg-foreground rounded" />
        <span className="w-5 h-0.5 bg-foreground rounded" />
        <span className="w-5 h-0.5 bg-foreground rounded" />
      </div>
    </label>
  );
}
