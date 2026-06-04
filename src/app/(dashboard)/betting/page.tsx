"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Wallet,
  ChevronRight,
  Trophy,
  Loader2,
  X,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency, calculateOdds } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

type Fixture = {
  id: string;
  homeTeam: { id: string; name: string; flag: string; code: string; strength: number };
  awayTeam: { id: string; name: string; flag: string; code: string; strength: number };
  matchDate: string;
  stadium: string;
  city: string;
  group: string | null;
  stage: string;
  status: string;
};

type Bet = {
  id: string;
  fixtureId: string;
  betType: string;
  amount: number;
  odds: number;
  potentialWinning: number;
  status: string;
  createdAt: string;
  fixture: {
    homeTeam: { name: string; flag: string };
    awayTeam: { name: string; flag: string };
    homeScore: number | null;
    awayScore: number | null;
  };
};

type BetSlipItem = {
  fixtureId: string;
  fixtureName: string;
  betType: "MATCH_WINNER" | "DRAW" | "EXACT_SCORE";
  label: string;
  odds: number;
  amount: number;
  winnerTeamId?: string;
  predictedHome?: number;
  predictedAway?: number;
};

type Wallet = {
  balance: number;
  totalWinnings: number;
  totalLosses: number;
  wonBets: number;
  totalBets: number;
};

export default function BettingPage() {
  const { toast } = useToast();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacing, setIsPlacing] = useState(false);
  const [activeTab, setActiveTab] = useState<"fixtures" | "myBets">("fixtures");
  const [exactHome, setExactHome] = useState(0);
  const [exactAway, setExactAway] = useState(0);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [fixturesRes, betsRes] = await Promise.all([
      fetch("/api/fixtures?status=SCHEDULED"),
      fetch("/api/bets"),
    ]);
    const [fixturesData, betsData] = await Promise.all([fixturesRes.json(), betsRes.json()]);
    setFixtures(fixturesData.fixtures || []);
    setBets(betsData.bets || []);
    setWallet(betsData.wallet || null);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const addToBetSlip = (fixture: Fixture, betType: BetSlipItem["betType"], label: string, winnerTeamId?: string) => {
    const existing = betSlip.find(
      (b) => b.fixtureId === fixture.id && b.betType === betType && b.winnerTeamId === winnerTeamId
    );
    if (existing) return;

    const odds = calculateOdds(
      fixture.homeTeam.strength,
      fixture.awayTeam.strength,
      betType === "MATCH_WINNER" ? (winnerTeamId === fixture.homeTeam.id ? "HOME_WIN" : "AWAY_WIN") :
      betType === "DRAW" ? "DRAW" : "EXACT_SCORE"
    );

    setBetSlip((prev) => [
      ...prev,
      {
        fixtureId: fixture.id,
        fixtureName: `${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`,
        betType,
        label,
        odds,
        amount: 10,
        winnerTeamId,
        predictedHome: betType === "EXACT_SCORE" ? exactHome : undefined,
        predictedAway: betType === "EXACT_SCORE" ? exactAway : undefined,
      },
    ]);
  };

  const removeBetSlipItem = (index: number) => {
    setBetSlip((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAmount = (index: number, amount: number) => {
    setBetSlip((prev) => prev.map((b, i) => (i === index ? { ...b, amount } : b)));
  };

  const placeBets = async () => {
    if (betSlip.length === 0) return;
    setIsPlacing(true);
    let successCount = 0;
    let errorMsg = "";

    for (const bet of betSlip) {
      try {
        const res = await fetch("/api/bets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fixtureId: bet.fixtureId,
            betType: bet.betType,
            amount: bet.amount,
            winnerTeamId: bet.winnerTeamId,
            predictedHome: bet.predictedHome,
            predictedAway: bet.predictedAway,
          }),
        });
        const data = await res.json();
        if (res.ok) successCount++;
        else errorMsg = data.error;
      } catch {
        errorMsg = "Failed to place bet";
      }
    }

    if (successCount > 0) {
      toast({ title: `${successCount} bet${successCount > 1 ? "s" : ""} placed! 💰`, description: "Good luck!" });
      setBetSlip([]);
      await loadData();
    }
    if (errorMsg) {
      toast({ title: "Some bets failed", description: errorMsg, variant: "destructive" });
    }
    setIsPlacing(false);
  };

  const totalStake = betSlip.reduce((sum, b) => sum + b.amount, 0);
  const totalPotential = betSlip.reduce((sum, b) => sum + b.amount * b.odds, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black">
            Virtual <span className="gold-text">Betting</span>
          </h1>
          <p className="text-muted-foreground mt-1">Place virtual bets — no real money involved</p>
        </div>
        {wallet && (
          <div className="glass-card px-4 py-2 flex items-center gap-2 border-gold/20">
            <Wallet className="w-4 h-4 text-gold" />
            <div>
              <div className="font-bold text-gold">{formatCurrency(wallet.balance)}</div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2">
            {(["fixtures", "myBets"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  activeTab === tab
                    ? "bg-gold text-navy-950 font-bold"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                )}
              >
                {tab === "fixtures" ? "Upcoming Matches" : "My Bets"}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="loading-skeleton h-24 rounded-xl" />)}</div>
          ) : activeTab === "fixtures" ? (
            <div className="space-y-3">
              {fixtures.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No upcoming fixtures available for betting</p>
                </div>
              ) : (
                fixtures.map((fixture, i) => {
                  const homeOdds = calculateOdds(fixture.homeTeam.strength, fixture.awayTeam.strength, "HOME_WIN");
                  const drawOdds = calculateOdds(fixture.homeTeam.strength, fixture.awayTeam.strength, "DRAW");
                  const awayOdds = calculateOdds(fixture.homeTeam.strength, fixture.awayTeam.strength, "AWAY_WIN");

                  return (
                    <motion.div
                      key={fixture.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card p-5"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="font-medium">
                            {fixture.homeTeam.flag} {fixture.homeTeam.name} vs {fixture.awayTeam.name} {fixture.awayTeam.flag}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(fixture.matchDate).toLocaleDateString("en-GB", {
                              weekday: "short", day: "numeric", month: "short",
                            })} · {fixture.city}
                            {fixture.group && ` · Group ${fixture.group}`}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => addToBetSlip(fixture, "MATCH_WINNER", `${fixture.homeTeam.name} Win`, fixture.homeTeam.id)}
                          className="glass-card p-3 text-center hover:border-green-500/40 hover:bg-green-500/5 transition-all group"
                        >
                          <div className="text-xs text-muted-foreground mb-1">Home Win</div>
                          <div className="font-bold text-green-400 group-hover:scale-105 transition-transform">{homeOdds.toFixed(2)}</div>
                        </button>
                        <button
                          onClick={() => addToBetSlip(fixture, "DRAW", "Draw")}
                          className="glass-card p-3 text-center hover:border-yellow-500/40 hover:bg-yellow-500/5 transition-all group"
                        >
                          <div className="text-xs text-muted-foreground mb-1">Draw</div>
                          <div className="font-bold text-yellow-400 group-hover:scale-105 transition-transform">{drawOdds.toFixed(2)}</div>
                        </button>
                        <button
                          onClick={() => addToBetSlip(fixture, "MATCH_WINNER", `${fixture.awayTeam.name} Win`, fixture.awayTeam.id)}
                          className="glass-card p-3 text-center hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group"
                        >
                          <div className="text-xs text-muted-foreground mb-1">Away Win</div>
                          <div className="font-bold text-blue-400 group-hover:scale-105 transition-transform">{awayOdds.toFixed(2)}</div>
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {bets.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No bets placed yet</p>
                </div>
              ) : (
                bets.map((bet, i) => (
                  <motion.div
                    key={bet.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={cn(
                      "glass-card p-4 border",
                      bet.status === "WON" ? "border-green-500/30 bg-green-500/5" :
                      bet.status === "LOST" ? "border-red-500/20" :
                      "border-white/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">
                          {bet.fixture.homeTeam.flag} {bet.fixture.homeTeam.name} vs {bet.fixture.awayTeam.name} {bet.fixture.awayTeam.flag}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {bet.betType.replace(/_/g, " ")} · Odds: {bet.odds.toFixed(2)}
                        </div>
                        {bet.fixture.homeScore !== null && (
                          <div className="text-xs text-muted-foreground">
                            Result: {bet.fixture.homeScore} - {bet.fixture.awayScore}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          {bet.status === "PENDING" && <Clock className="w-3 h-3 text-yellow-400" />}
                          {bet.status === "WON" && <CheckCircle className="w-3 h-3 text-green-400" />}
                          {bet.status === "LOST" && <XCircle className="w-3 h-3 text-red-400" />}
                          <span className={cn(
                            "text-xs font-medium",
                            bet.status === "WON" ? "text-green-400" :
                            bet.status === "LOST" ? "text-red-400" :
                            "text-yellow-400"
                          )}>
                            {bet.status}
                          </span>
                        </div>
                        <div className="font-bold text-sm">{formatCurrency(bet.amount)}</div>
                        {bet.status === "WON" && (
                          <div className="text-green-400 text-xs">+{formatCurrency(bet.potentialWinning - bet.amount)}</div>
                        )}
                        {bet.status === "PENDING" && (
                          <div className="text-muted-foreground text-xs">→ {formatCurrency(bet.potentialWinning)}</div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Bet Slip */}
        <div className="lg:col-span-1">
          <div className="glass-card p-5 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gold" />
                Bet Slip
              </h3>
              {betSlip.length > 0 && (
                <button
                  onClick={() => setBetSlip([])}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {betSlip.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🎰</div>
                <p className="text-sm text-muted-foreground">Click odds to add selections</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {betSlip.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-white/5 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{item.fixtureName}</div>
                          <div className="text-xs text-gold">{item.label}</div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-sm font-bold text-green-400">{item.odds.toFixed(2)}</span>
                          <button onClick={() => removeBetSlipItem(i)} className="text-muted-foreground hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">£</span>
                        <Input
                          type="number"
                          min={1}
                          max={wallet?.balance ?? 10000}
                          value={item.amount}
                          onChange={(e) => updateAmount(i, Number(e.target.value))}
                          className="h-8 text-sm bg-white/5 border-white/10 focus:border-gold/50"
                        />
                        <span className="text-xs text-green-400 whitespace-nowrap">
                          → {formatCurrency(item.amount * item.odds)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <div className="pt-3 border-t border-white/10 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Stake</span>
                    <span className="font-medium">{formatCurrency(totalStake)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Potential Win</span>
                    <span className="font-bold text-green-400">{formatCurrency(totalPotential)}</span>
                  </div>
                  {wallet && wallet.balance < totalStake && (
                    <p className="text-red-400 text-xs">Insufficient balance</p>
                  )}
                </div>

                <Button
                  className="w-full btn-gold"
                  onClick={placeBets}
                  disabled={isPlacing || (wallet ? wallet.balance < totalStake : false)}
                >
                  {isPlacing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Placing Bets...
                    </>
                  ) : (
                    <>
                      Place {betSlip.length} Bet{betSlip.length > 1 ? "s" : ""}
                      <span className="ml-2 text-navy-950/70">{formatCurrency(totalStake)}</span>
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">Virtual currency only — no real money</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
