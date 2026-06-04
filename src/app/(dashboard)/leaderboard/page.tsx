"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Target, Globe, Crown } from "lucide-react";
import { cn, formatCurrency, getRankIcon } from "@/lib/utils";
import { useSession } from "next-auth/react";

type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  name: string | null;
  image: string | null;
  country: string | null;
  points: number;
  accuracy: number;
  correctPredictions: number;
  totalPredictions: number;
  walletBalance: number;
  totalWinnings?: number;
};

const tabs = [
  { value: "global", label: "Global", icon: Globe },
  { value: "betting", label: "Betting", icon: TrendingUp },
];

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("global");

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch(`/api/leaderboard?type=${activeTab}&take=100`);
    const data = await res.json();
    setLeaderboard(data.leaderboard || []);
    setIsLoading(false);
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const myEntry = leaderboard.find((e) => e.userId === session?.user?.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-gold" />
        </div>
        <h1 className="font-display text-3xl font-black">
          <span className="gold-text">Leaderboard</span>
        </h1>
        <p className="text-muted-foreground mt-1">See who's leading the predictions race</p>
      </div>

      {/* My rank banner */}
      {myEntry && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 border-gold/30 bg-gold/5"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center font-display font-black text-gold">
              {myEntry.rank}
            </div>
            <div className="flex-1">
              <div className="font-medium">Your current rank: <span className="text-gold font-bold">#{myEntry.rank}</span></div>
              <div className="text-sm text-muted-foreground">
                {myEntry.points} pts · {myEntry.accuracy}% accuracy
              </div>
            </div>
            <Crown className="w-6 h-6 text-gold" />
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
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

      {/* Top 3 podium */}
      {!isLoading && leaderboard.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {/* 2nd */}
          <div className="flex flex-col items-center pt-6">
            <div className="text-3xl mb-2">🥈</div>
            <div className="w-16 h-16 rounded-full bg-gray-400/20 flex items-center justify-center font-bold text-xl mb-2">
              {(leaderboard[1].name?.[0] || leaderboard[1].username[0]).toUpperCase()}
            </div>
            <div className="text-sm font-medium text-center truncate w-full px-2">{leaderboard[1].name || leaderboard[1].username}</div>
            <div className="text-gold font-bold text-sm">{leaderboard[1].points}pts</div>
            <div className="h-16 w-full mt-2 bg-gray-400/20 rounded-t-xl" />
          </div>

          {/* 1st */}
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">🥇</div>
            <div className="w-20 h-20 rounded-full bg-gold/30 border-2 border-gold flex items-center justify-center font-bold text-2xl mb-2 shadow-gold">
              {(leaderboard[0].name?.[0] || leaderboard[0].username[0]).toUpperCase()}
            </div>
            <div className="text-sm font-medium text-center truncate w-full px-2">{leaderboard[0].name || leaderboard[0].username}</div>
            <div className="text-gold font-bold">{leaderboard[0].points}pts</div>
            <div className="h-24 w-full mt-2 bg-gold/20 rounded-t-xl border border-gold/30" />
          </div>

          {/* 3rd */}
          <div className="flex flex-col items-center pt-10">
            <div className="text-3xl mb-2">🥉</div>
            <div className="w-14 h-14 rounded-full bg-amber-700/20 flex items-center justify-center font-bold text-lg mb-2">
              {(leaderboard[2].name?.[0] || leaderboard[2].username[0]).toUpperCase()}
            </div>
            <div className="text-sm font-medium text-center truncate w-full px-2">{leaderboard[2].name || leaderboard[2].username}</div>
            <div className="text-gold font-bold text-sm">{leaderboard[2].points}pts</div>
            <div className="h-12 w-full mt-2 bg-amber-700/20 rounded-t-xl" />
          </div>
        </motion.div>
      )}

      {/* Full leaderboard table */}
      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-[48px_1fr_80px_80px_80px] gap-0 border-b border-white/5 px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">
          <div className="text-center">#</div>
          <div>Player</div>
          <div className="text-center">Points</div>
          <div className="text-center">Accuracy</div>
          <div className="text-right hidden sm:block">
            {activeTab === "betting" ? "Winnings" : "Balance"}
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="loading-skeleton h-14 rounded-lg" />)}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No entries yet — be the first to predict!</p>
          </div>
        ) : (
          <div>
            {leaderboard.map((entry, i) => {
              const isMe = entry.userId === session?.user?.id;
              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={cn(
                    "grid grid-cols-[48px_1fr_80px_80px_80px] gap-0 px-4 py-3 items-center border-b border-white/3 transition-all",
                    isMe ? "bg-gold/5 border-gold/20" : "hover:bg-white/3",
                    i < 3 ? "" : ""
                  )}
                >
                  <div className="text-center">
                    {i < 3 ? (
                      <span className="text-xl">{getRankIcon(entry.rank)}</span>
                    ) : (
                      <span className={cn(
                        "font-bold text-sm",
                        isMe ? "text-gold" : "text-muted-foreground"
                      )}>
                        {entry.rank}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0",
                      isMe ? "bg-gold/20 text-gold" : "bg-white/10 text-foreground"
                    )}>
                      {(entry.name?.[0] || entry.username[0]).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className={cn("font-medium text-sm truncate", isMe && "text-gold")}>
                        {entry.name || entry.username}
                        {isMe && <span className="ml-2 text-xs text-gold/60">(You)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        @{entry.username}
                        {entry.country && ` · ${entry.country}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-gold">{entry.points.toLocaleString()}</span>
                  </div>
                  <div className="text-center">
                    <span className={cn(
                      "font-medium text-sm",
                      entry.accuracy >= 70 ? "text-green-400" :
                      entry.accuracy >= 50 ? "text-yellow-400" :
                      "text-muted-foreground"
                    )}>
                      {entry.accuracy}%
                    </span>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className="text-sm font-medium text-green-400">
                      {formatCurrency(activeTab === "betting" ? (entry.totalWinnings || 0) : entry.walletBalance)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
