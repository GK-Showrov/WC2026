"use client";

import { useState, useEffect } from "react";
import { Users, Shield, Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency, timeAgo } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

type AdminUser = {
  id: string;
  name: string | null;
  username: string;
  email: string;
  role: string;
  country: string | null;
  createdAt: string;
  wallet: { balance: number; totalBets: number } | null;
  _count: { predictions: number; bets: number };
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [balanceInputs, setBalanceInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => { setUsers(d.users || []); setIsLoading(false); });
  }, []);

  const doAction = async (userId: string, action: string, value: string) => {
    setActionLoading(`${userId}-${action}`);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: data.message });
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          if (action === "SET_ROLE") return { ...u, role: value };
          if (action === "ADJUST_BALANCE" && u.wallet) {
            return { ...u, wallet: { ...u.wallet, balance: u.wallet.balance + parseFloat(value) } };
          }
          return u;
        })
      );
    } catch (e: unknown) {
      toast({ title: "Action failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black flex items-center gap-2">
          <Users className="w-6 h-6 text-gold" />
          User Management
        </h1>
        <p className="text-muted-foreground mt-1">Manage accounts, roles, and balances</p>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white/5 border-white/10 focus:border-gold/50 max-w-sm"
        />
        <div className="text-sm text-muted-foreground flex items-center">{filtered.length} users</div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="loading-skeleton h-16 rounded-xl" />)}</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_100px_160px_160px] gap-0 border-b border-white/5 px-5 py-3 text-xs text-muted-foreground uppercase tracking-wider">
            <div>User</div>
            <div className="text-center">Role</div>
            <div className="text-center">Predictions</div>
            <div className="text-center">Balance</div>
            <div className="text-center">Adjust</div>
          </div>
          {filtered.map((user) => (
            <div key={user.id} className="grid grid-cols-[1fr_100px_100px_160px_160px] gap-0 items-center px-5 py-3 border-b border-white/3">
              <div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs",
                    user.role === "ADMIN" ? "bg-red-500/20 text-red-400" : "bg-white/10"
                  )}>
                    {(user.name?.[0] || user.username[0]).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{user.name || user.username}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <button
                  onClick={() => doAction(user.id, "SET_ROLE", user.role === "ADMIN" ? "USER" : "ADMIN")}
                  disabled={actionLoading === `${user.id}-SET_ROLE`}
                  className={cn(
                    "text-xs px-2 py-1 rounded-full border transition-all hover:scale-105",
                    user.role === "ADMIN"
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : "bg-white/5 text-muted-foreground border-white/10 hover:border-blue-500/30"
                  )}
                >
                  {actionLoading === `${user.id}-SET_ROLE` ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>{user.role === "ADMIN" ? <Shield className="w-3 h-3 inline" /> : null} {user.role}</>
                  )}
                </button>
              </div>
              <div className="text-center text-sm">
                <div>{user._count.predictions}</div>
                <div className="text-xs text-muted-foreground">{user._count.bets} bets</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gold text-sm">
                  {formatCurrency(user.wallet?.balance ?? 0)}
                </div>
              </div>
              <div className="flex items-center gap-1 px-2">
                <Input
                  type="number"
                  placeholder="±amount"
                  className="h-7 text-xs bg-white/5 border-white/10 focus:border-gold/50"
                  value={balanceInputs[user.id] || ""}
                  onChange={(e) => setBalanceInputs((p) => ({ ...p, [user.id]: e.target.value }))}
                />
                <Button
                  size="sm"
                  className="h-7 text-xs px-2 btn-gold"
                  onClick={() => {
                    const v = balanceInputs[user.id];
                    if (!v) return;
                    doAction(user.id, "ADJUST_BALANCE", v);
                    setBalanceInputs((p) => ({ ...p, [user.id]: "" }));
                  }}
                  disabled={actionLoading === `${user.id}-ADJUST_BALANCE` || !balanceInputs[user.id]}
                >
                  {actionLoading === `${user.id}-ADJUST_BALANCE` ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : "Go"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
