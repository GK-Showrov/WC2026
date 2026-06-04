"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Check, Lock, Loader2, ChevronRight, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, isMatchLocked, getStageLabel } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

type Fixture = {
  id: string;
  homeTeam: { id: string; name: string; flag: string; code: string };
  awayTeam: { id: string; name: string; flag: string; code: string };
  matchDate: string;
  stadium: string;
  city: string;
  group: string | null;
  stage: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  userPrediction: { predictedHome: number; predictedAway: number; points: number } | null;
};

function PredictionForm({ fixture, onSaved }: {
  fixture: Fixture;
  onSaved: (prediction: { predictedHome: number; predictedAway: number }) => void;
}) {
  const { toast } = useToast();
  const [homeScore, setHomeScore] = useState(fixture.userPrediction?.predictedHome ?? 0);
  const [awayScore, setAwayScore] = useState(fixture.userPrediction?.predictedAway ?? 0);
  const [isSaving, setIsSaving] = useState(false);
  const locked = isMatchLocked(fixture.matchDate) || fixture.status !== "SCHEDULED";

  const handleSave = async () => {
    if (locked) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtureId: fixture.id, predictedHome: homeScore, predictedAway: awayScore }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Prediction saved! 🎯", description: `${fixture.homeTeam.name} ${homeScore} - ${awayScore} ${fixture.awayTeam.name}` });
      onSaved({ predictedHome: homeScore, predictedAway: awayScore });
    } catch (e: unknown) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const pointsPreview = () => {
    if (homeScore === awayScore) return { label: "Draw predicted", pts: "3 pts" };
    if (homeScore > awayScore) return { label: `${fixture.homeTeam.name} win`, pts: "3 pts" };
    return { label: `${fixture.awayTeam.name} win`, pts: "3 pts" };
  };

  const pts = pointsPreview();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-6">
        {/* Home score input */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">{fixture.homeTeam.flag}</span>
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground mb-1">{fixture.homeTeam.code}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => !locked && setHomeScore(Math.max(0, homeScore - 1))}
                disabled={locked}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                -
              </button>
              <span className="font-display font-black text-4xl w-12 text-center">{homeScore}</span>
              <button
                onClick={() => !locked && setHomeScore(Math.min(20, homeScore + 1))}
                disabled={locked}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="text-muted-foreground font-display font-black text-2xl">VS</div>

        {/* Away score input */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground mb-1">{fixture.awayTeam.code}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => !locked && setAwayScore(Math.max(0, awayScore - 1))}
                disabled={locked}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                -
              </button>
              <span className="font-display font-black text-4xl w-12 text-center">{awayScore}</span>
              <button
                onClick={() => !locked && setAwayScore(Math.min(20, awayScore + 1))}
                disabled={locked}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                +
              </button>
            </div>
          </div>
          <span className="text-2xl">{fixture.awayTeam.flag}</span>
        </div>
      </div>

      {/* Points preview */}
      <div className="flex items-center justify-center gap-3 text-sm">
        <span className="text-muted-foreground">{pts.label}</span>
        <span className="text-gold font-bold">{pts.pts}</span>
        {homeScore === 0 && awayScore === 0 && (
          <span className="text-gold font-bold ml-1">(+7 bonus for exact 0-0)</span>
        )}
      </div>

      {locked ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm py-2">
          <Lock className="w-4 h-4" />
          {fixture.status === "COMPLETED" ? "Match completed" : "Predictions locked — match has started"}
        </div>
      ) : (
        <Button onClick={handleSave} className="w-full btn-gold" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : fixture.userPrediction ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Update Prediction
            </>
          ) : (
            <>
              <Target className="w-4 h-4 mr-2" />
              Save Prediction
            </>
          )}
        </Button>
      )}
    </div>
  );
}

function PredictionsPageInner() {
  const searchParams = useSearchParams();
  const highlightFixture = searchParams.get("fixture");
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(highlightFixture);
  const [filter, setFilter] = useState<"all" | "pending" | "predicted" | "completed">("all");

  const loadFixtures = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch("/api/fixtures?limit=200");
    const data = await res.json();
    setFixtures(data.fixtures || []);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadFixtures(); }, [loadFixtures]);

  const filtered = fixtures.filter((f) => {
    if (filter === "pending") return f.status === "SCHEDULED" && !f.userPrediction;
    if (filter === "predicted") return !!f.userPrediction;
    if (filter === "completed") return f.status === "COMPLETED";
    return true;
  });

  const pendingCount = fixtures.filter((f) => f.status === "SCHEDULED" && !f.userPrediction).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black">
            <span className="gold-text">Predictions</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {pendingCount > 0 ? `${pendingCount} matches awaiting your prediction` : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-gold" />
          <span className="text-muted-foreground">Exact score = <span className="text-gold font-bold">10pts</span></span>
        </div>
      </div>

      {/* Scoring guide */}
      <div className="glass-card p-4 flex flex-wrap gap-4 text-sm">
        {[
          { pts: "10", label: "Exact Score", color: "text-gold" },
          { pts: "5", label: "Correct Goal Diff", color: "text-blue-400" },
          { pts: "3", label: "Correct Winner", color: "text-green-400" },
          { pts: "0", label: "Incorrect", color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={`font-bold ${s.color}`}>{s.pts}pts</span>
            <span className="text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: "All Matches" },
          { value: "pending", label: `Pending (${pendingCount})` },
          { value: "predicted", label: "Predicted" },
          { value: "completed", label: "Completed" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as typeof filter)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              filter === f.value
                ? "bg-gold text-navy-950 font-bold"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Fixtures */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="loading-skeleton h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((fixture, i) => {
            const isExpanded = expandedId === fixture.id;
            const locked = isMatchLocked(fixture.matchDate) || fixture.status !== "SCHEDULED";
            const isCompleted = fixture.status === "COMPLETED";

            return (
              <motion.div
                key={fixture.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025 }}
                className={cn(
                  "glass-card overflow-hidden transition-all duration-300",
                  isExpanded ? "border-gold/30" : "hover:border-white/20"
                )}
              >
                {/* Fixture header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : fixture.id)}
                  className="w-full p-4 flex items-center gap-4 text-left"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xl">{fixture.homeTeam.flag}</span>
                    <div>
                      <div className="font-medium text-sm">
                        {fixture.homeTeam.name} vs {fixture.awayTeam.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(fixture.matchDate).toLocaleDateString("en-GB", {
                          weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                        {fixture.group && ` · Group ${fixture.group}`}
                      </div>
                    </div>
                    <span className="text-xl">{fixture.awayTeam.flag}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isCompleted && fixture.homeScore !== null && (
                      <div className="font-display font-black text-lg">
                        {fixture.homeScore} - {fixture.awayScore}
                      </div>
                    )}
                    {fixture.userPrediction ? (
                      <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 whitespace-nowrap">
                        ✓ {fixture.userPrediction.predictedHome}-{fixture.userPrediction.predictedAway}
                        {fixture.userPrediction.points > 0 && ` +${fixture.userPrediction.points}pts`}
                      </span>
                    ) : locked ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <span className="text-xs px-2 py-1 bg-gold/10 text-gold rounded-full border border-gold/20">
                        Predict
                      </span>
                    )}
                    <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                  </div>
                </button>

                {/* Expanded prediction form */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-white/5"
                    >
                      <div className="p-5">
                        <PredictionForm
                          fixture={fixture}
                          onSaved={(pred) => {
                            setFixtures((prev) =>
                              prev.map((f) =>
                                f.id === fixture.id
                                  ? { ...f, userPrediction: { ...pred, points: 0 } }
                                  : f
                              )
                            );
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No matches found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PredictionsPage() {
  return (
    <Suspense fallback={<div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="loading-skeleton h-20 rounded-xl" />)}</div>}>
      <PredictionsPageInner />
    </Suspense>
  );
}
