"use client";

import { signOut } from "next-auth/react";
import { Bell, LogOut, Settings, User, Wallet, ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useState, useEffect } from "react";

interface TopBarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username: string;
    role: string;
  };
}

export function TopBar({ user }: TopBarProps) {
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/profile/wallet")
      .then((r) => r.json())
      .then((d) => setWalletBalance(d.balance ?? null))
      .catch(() => {});
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <header className="h-16 border-b border-white/5 bg-navy-950/60 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      {/* Mobile menu trigger */}
      <label
        htmlFor="sidebar-mobile-toggle"
        className="lg:hidden cursor-pointer flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/5 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </label>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        {/* Wallet Balance */}
        {walletBalance !== null && (
          <Link href="/profile">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20 text-gold hover:bg-gold/15 transition-colors cursor-pointer">
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-bold">
                £{walletBalance.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </Link>
        )}

        {/* Notifications (placeholder) */}
        <Button variant="ghost" size="icon" className="relative hover:bg-white/5">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-white/5">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">
                {(user.name?.[0] || user.username?.[0] || "U").toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium leading-none">{user.name || user.username}</div>
                <div className="text-xs text-muted-foreground">@{user.username}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-navy-900 border-white/10">
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Signed in as @{user.username}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer">
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer">
                <Link href="/profile?tab=wallet" className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Wallet
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer">
                <Link href="/profile?tab=settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="hover:bg-red-500/10 text-red-400 cursor-pointer gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
