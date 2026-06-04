"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  User, Wallet, Trophy, Target, Star, Edit, Save, Loader2, Clock,
  TrendingUp, TrendingDown, Award, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency, formatDateTime, timeAgo } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

type ProfileData = {
  user: {
    id: string; name: string | null; username: string; email: string;
    image: string | null; country: string | null; bio: string | null;
    role: string; createdAt: string;
    wallet: { balance: number; totalWinnings: number; totalLosses: number; wonBets: number; totalBets: number } | null;
    _count: { predictions: number; bets: number; leagueMemberships: number };
  };
  stats: { totalPoints: number; totalPredictions: number; correctPredictions: number; accuracy: number };
  achievements: Array<{
    id: string; unlockedAt: string;
    achievement: { id: string; name: string; description: string; badge: string; points: number; category: string };
  }>;
  transactions: Array<{ id: string; type: string; amount: number; balance: number; description: string; createdAt: string }>;
};

const TABS = [
  { value: "overview", label: "Overview", icon: User },
  { value: "wallet", label: "Wallet", icon: Wallet },
  { value: "achievements", label: "Achievements", icon: Trophy },
  { value: "settings", label: "Settings", icon: Edit },
];

function ProfilePageInner() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [data, setData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", username: "", country: "", bio: "" });

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setEditForm({
          name: d.user.name || "",
          username: d.user.username || "",
          country: d.user.country || "",
          bio: d.user.bio || "",
        });
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast({ title: "Profile updated!" });
      setIsEditing(false);
      setData((prev) => prev ? { ...prev, user: { ...prev.user, ...result.user } } : prev);
    } catch (e: unknown) {
      toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="loading-skeleton h-32 rounded-xl" />
      <div className="loading-skeleton h-96 rounded-xl" />
    </div>
  );

  if (!data) return <div className="text-center py-20 text-muted-foreground">Failed to load profile</div>;

  const { user, stats, achievements, transactions } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5"
      >
        <div className="w-20 h-20 rounded-full bg-gold/20 border-2 border-gold/30 flex items-center justify-center text-3xl font-black text-gold flex-shrink-0">
          {(user.name?.[0] || user.username[0]).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display font-black text-2xl">{user.name || user.username}</h1>
            {user.role === "ADMIN" && (
              <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">Admin</span>
            )}
          </div>
          <div className="text-muted-foreground">@{user.username}</div>
          {user.bio && <p className="text-sm mt-1 text-muted-foreground">{user.bio}</p>}
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
            {user.country && <span>🌍 {user.country}</span>}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Joined {timeAgo(user.createdAt)}
            </span>
            <span>{user._count.leagueMemberships} league{user._count.leagueMemberships !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="font-bold text-gold text-xl">{stats.totalPoints}</div>
            <div className="text-xs text-muted-foreground">Points</div>
          </div>
          <div>
            <div className="font-bold text-xl">{stats.accuracy}%</div>
            <div className="text-xs text-muted-foreground">Accuracy</div>
          </div>
          <div>
            <div className="font-bold text-xl">{achievements.length}</div>
            <div className="text-xs text-muted-foreground">Badges</div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.value
                ? "bg-gold text-navy-950 font-bold"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-display font-bold flex items-center gap-2">
              <Target className="w-4 h-4 text-gold" />Prediction Stats
            </h3>
            {[
              { label: "Total Predictions", value: stats.totalPredictions },
              { label: "Correct Predictions", value: stats.correctPredictions, color: "text-green-400" },
              { label: "Accuracy", value: `${stats.accuracy}%`, color: "text-gold" },
              { label: "Total Points", value: stats.totalPoints, color: "text-gold" },
            ].map((s) => (
              <div key={s.label} className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-muted-foreground text-sm">{s.label}</span>
                <span className={cn("font-bold", s.color)}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-display font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold" />Betting Stats
            </h3>
            {[
              { label: "Total Bets", value: user._count.bets },
              { label: "Bets Won", value: user.wallet?.wonBets ?? 0, color: "text-green-400" },
              { label: "Win Rate", value: user.wallet?.totalBets ? `${Math.round((user.wallet.wonBets / user.wallet.totalBets) * 100)}%` : "0%", color: "text-gold" },
              { label: "Total Winnings", value: formatCurrency(user.wallet?.totalWinnings ?? 0), color: "text-green-400" },
              { label: "Total Losses", value: formatCurrency(user.wallet?.totalLosses ?? 0), color: "text-red-400" },
            ].map((s) => (
              <div key={s.label} className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-muted-foreground text-sm">{s.label}</span>
                <span className={cn("font-bold", s.color)}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "wallet" && (
        <div className="space-y-4">
          {/* Balance card */}
          <div className="glass-card p-6 border-gold/20 bg-gradient-to-br from-gold/10 to-transparent">
            <div className="flex items-center gap-3 mb-4">
              <Wallet className="w-6 h-6 text-gold" />
              <h3 className="font-display font-bold text-xl">Virtual Wallet</h3>
            </div>
            <div className="font-display font-black text-4xl text-gold mb-1">
              {formatCurrency(user.wallet?.balance ?? 0)}
            </div>
            <div className="text-sm text-muted-foreground">Available Balance</div>
            <div className="grid grid-cols-2 gap-4 mt-5">
              <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="font-bold text-green-400">{formatCurrency(user.wallet?.totalWinnings ?? 0)}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3" />Total Winnings
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="font-bold text-red-400">{formatCurrency(user.wallet?.totalLosses ?? 0)}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <TrendingDown className="w-3 h-3" />Total Losses
                </div>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" />
              <h3 className="font-bold">Transaction History</h3>
            </div>
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No transactions yet</div>
            ) : (
              <div>
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-3 border-b border-white/3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      tx.amount > 0 ? "bg-green-500/20 text-green-400" :
                      tx.amount < 0 ? "bg-red-500/20 text-red-400" :
                      "bg-gray-500/20 text-gray-400"
                    )}>
                      {tx.amount > 0 ? <TrendingUp className="w-4 h-4" /> :
                       tx.amount < 0 ? <TrendingDown className="w-4 h-4" /> :
                       <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{tx.description}</div>
                      <div className="text-xs text-muted-foreground">{timeAgo(tx.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className={cn("font-bold text-sm",
                        tx.amount > 0 ? "text-green-400" :
                        tx.amount < 0 ? "text-red-400" : "text-muted-foreground"
                      )}>
                        {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(tx.balance)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-gold" />
            <span className="font-bold">{achievements.length} achievements unlocked</span>
          </div>
          {achievements.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No achievements yet — start predicting!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.map((ua) => (
                <motion.div
                  key={ua.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card p-4 flex items-center gap-4 border-gold/20 bg-gold/5"
                >
                  <div className="text-4xl">{ua.achievement.badge}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm">{ua.achievement.name}</div>
                    <div className="text-xs text-muted-foreground">{ua.achievement.description}</div>
                    <div className="text-xs text-gold mt-1">+{ua.achievement.points} bonus pts</div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {timeAgo(ua.unlockedAt)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="glass-card p-6 space-y-5 max-w-lg">
          <h3 className="font-display font-bold text-lg">Edit Profile</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                className="bg-white/5 border-white/10 focus:border-gold/50"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  value={editForm.username}
                  onChange={(e) => setEditForm((p) => ({ ...p, username: e.target.value }))}
                  className="pl-8 bg-white/5 border-white/10 focus:border-gold/50"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={editForm.country}
                onChange={(e) => setEditForm((p) => ({ ...p, country: e.target.value }))}
                className="bg-white/5 border-white/10 focus:border-gold/50"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Input
                value={editForm.bio}
                onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                className="bg-white/5 border-white/10 focus:border-gold/50"
                placeholder="Tell us about yourself..."
                disabled={!isEditing}
              />
            </div>
          </div>
          <div className="flex gap-3">
            {!isEditing ? (
              <Button className="btn-gold gap-2" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button className="btn-gold gap-2" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </Button>
                <Button variant="outline" className="border-white/20" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="loading-skeleton h-96 rounded-xl max-w-4xl mx-auto" />}>
      <ProfilePageInner />
    </Suspense>
  );
}
