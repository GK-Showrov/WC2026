"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  TrendingUp,
  Target,
  Wallet,
  Flame,
  Star,
  Clock,
  ChevronRight,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime, getMatchResult, getOrdinalSuffix } from "@/lib/utils";
import type { DashboardStats, FixtureWithTeams, PredictionWithFixture } from "@/types";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface DashboardClientProps {
  user: { id: string; name: string | null; username: string; image: string | null; country: string | null; createdAt: Date } | null;
  wallet: { balance: number; totalWinnings: number; totalLosses: number; wonBets: number; totalBets: number } | null;
  stats: DashboardStats;
  recentPredictions: PredictionWithFixture[];
  upcomingFixtures: FixtureWithTeams[];
}

export function DashboardClient({ user, wallet, stats, recentPredictions, upcomingFixtures }: DashboardClientProps) {
  const statCards = [
    {
      label: "Total Points",
      value: stats.totalPoints.toLocaleString(),
      icon: <Trophy className="w-5 h-5" />,
      color: "from-gold/20 to-amber-500/10",
      border: "border-gold/30",
      iconColor: "text-gold",
    },
    {
      label: "Global Rank",
      value: getOrdinalSuffix(stats.globalRank),
      icon: <TrendingUp className="w-5 h-5" />,
      color: "from-blue-500/20 to-indigo-500/10",
      border: "border-blue-500/30",
      iconColor: "text-blue-400",
    },
    {
      label: "Accuracy",
      value: `${stats.predictionAccuracy}%`,
      icon: <Target className="w-5 h-5" />,
      color: "from-green-500/20 to-emerald-500/10",
      border: "border-green-500/30",
      iconColor: "text-green-400",
    },
    {
      label: "Wallet Balance",
      value: formatCurrency(stats.walletBalance),
      icon: <Wallet className="w-5 h-5" />,
      color: "from-purple-500/20 to-pink-500/10",
      border: "border-purple-500/30",
      iconColor: "text-purple-400",
    },
    {
      label: "Current Streak",
      value: `${stats.currentStreak}🔥`,
      icon: <Flame className="w-5 h-5" />,
      color: "from-orange-500/20 to-red-500/10",
      border: "border-orange-500/30",
      iconColor: "text-orange-400",
    },
    {
      label: "Achievements",
      value: `${stats.achievementsUnlocked}`,
      icon: <Star className="w-5 h-5" />,
      color: "from-cyan-500/20 to-teal-500/10",
      border: "border-cyan-500/30",
      iconColor: "text-cyan-400",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-3xl font-black">
            Welcome back, <span className="gold-text">{user?.name?.split(" ")[0] || user?.username}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {stats.activeBets > 0
              ? `You have ${stats.activeBets} active bet${stats.activeBets > 1 ? "s" : ""}`
              : "No active bets — place one on upcoming matches"}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link href="/predictions">
            <Button className="btn-gold gap-2">
              <Zap className="w-4 h-4" />
              Predict Now
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {statCards.map((card, i) => (
          <motion.div
            key={i}
            variants={fadeInUp}
            className={`glass-card p-4 bg-gradient-to-br ${card.color} border ${card.border} flex flex-col gap-3`}
          >
            <div className={`w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center ${card.iconColor}`}>
              {card.icon}
            </div>
            <div>
              <div className="font-display font-bold text-xl">{card.value}</div>
              <div className="text-xs text-muted-foreground">{card.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Fixtures */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold" />
              <h2 className="font-display font-bold text-lg">Upcoming Matches</h2>
            </div>
            <Link href="/fixtures">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-gold gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>

          {upcomingFixtures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No upcoming fixtures scheduled
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingFixtures.map((fixture) => (
                <Link key={fixture.id} href={`/predictions?fixture=${fixture.id}`}>
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-all duration-200 cursor-pointer group">
                    <div className="flex-1 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{fixture.homeTeam.flag}</span>
                        <div>
                          <div className="font-medium text-sm">{fixture.homeTeam.name}</div>
                          <div className="text-xs text-muted-foreground">vs {fixture.awayTeam.name}</div>
                        </div>
                      </div>
                      <span className="text-xl">{fixture.awayTeam.flag}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {new Date(fixture.matchDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </div>
                      <div className="text-xs text-gold">
                        {new Date(fixture.matchDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-white/5">
            <Link href="/predictions">
              <Button className="w-full btn-gold gap-2">
                <Zap className="w-4 h-4" />
                Make Predictions
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Recent Predictions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-gold" />
              <h2 className="font-display font-bold text-lg">Recent Predictions</h2>
            </div>
            <Link href="/predictions">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-gold gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>

          {recentPredictions.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No predictions yet</p>
              <Link href="/predictions">
                <Button className="mt-3 btn-gold" size="sm">Make your first prediction</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPredictions.map((pred) => {
                const isCorrect =
                  pred.fixture.homeScore !== null &&
                  pred.fixture.awayScore !== null &&
                  getMatchResult(pred.predictedHome, pred.predictedAway) ===
                    getMatchResult(pred.fixture.homeScore, pred.fixture.awayScore);

                return (
                  <div key={pred.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/3">
                    <div className="flex items-center gap-2 text-xl">
                      <span>{pred.fixture.homeTeam.flag}</span>
                      <span className="text-xs text-muted-foreground">vs</span>
                      <span>{pred.fixture.awayTeam.flag}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {pred.fixture.homeTeam.name} {pred.predictedHome} - {pred.predictedAway} {pred.fixture.awayTeam.name}
                      </div>
                      {pred.fixture.homeScore !== null && (
                        <div className="text-xs text-muted-foreground">
                          Result: {pred.fixture.homeScore} - {pred.fixture.awayScore}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-sm ${pred.points > 0 ? "text-green-400" : "text-muted-foreground"}`}>
                        +{pred.points}pts
                      </div>
                      <div className={`text-xs ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                        {pred.fixture.homeScore !== null ? (isCorrect ? "✓ Correct" : "✗ Wrong") : "Pending"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Prediction Summary */}
          {stats.totalPredictions > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="font-bold text-green-400">{stats.correctPredictions}</div>
                <div className="text-xs text-muted-foreground">Correct</div>
              </div>
              <div>
                <div className="font-bold text-muted-foreground">{stats.totalPredictions - stats.correctPredictions}</div>
                <div className="text-xs text-muted-foreground">Wrong</div>
              </div>
              <div>
                <div className="font-bold text-gold">{stats.predictionAccuracy}%</div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "View Fixtures", href: "/fixtures", icon: "📅", color: "from-blue-500/20" },
          { label: "Place a Bet", href: "/betting", icon: "💰", color: "from-green-500/20" },
          { label: "Leaderboard", href: "/leaderboard", icon: "🏆", color: "from-gold/20" },
          { label: "My Leagues", href: "/leagues", icon: "👥", color: "from-purple-500/20" },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <div className={`glass-card p-5 text-center cursor-pointer hover:border-gold/20 transition-all duration-300 bg-gradient-to-br ${action.color} to-transparent h-full`}>
              <div className="text-3xl mb-2">{action.icon}</div>
              <div className="text-sm font-medium">{action.label}</div>
            </div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
