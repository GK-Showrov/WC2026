"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, ChevronRight, RefreshCw, Calendar, Lock, Zap
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, getStageLabel } from "@/lib/utils";
import Link from "next/link";

type Team = { id: string; name: string; flag: string; code: string };
type Fixture = {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  matchDate: string;
  stadium: string;
  city: string;
  group: string | null;
  stage: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  userPrediction: { predictedHome: number; predictedAway: number; points: number } | null;
  _count: { predictions: number; bets: number };
};

type LiveScore = {
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  clock?: string;
};

const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

const KNOCKOUT_STAGES = [
  { value: "ROUND_OF_32",    label: "R32",   fullLabel: "Round of 32"    },
  { value: "ROUND_OF_16",    label: "R16",   fullLabel: "Round of 16"    },
  { value: "QUARTER_FINAL",  label: "QF",    fullLabel: "Quarter-Finals" },
  { value: "SEMI_FINAL",     label: "SF",    fullLabel: "Semi-Finals"    },
  { value: "FINAL",          label: "Final", fullLabel: "Final"          },
];

export default function FixturesPage() {
  const [allFixtures, setAllFixtures] = useState<Fixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeNav, setActiveNav] = useState<string>("GROUP_STAGE");
  const [liveScores, setLiveScores] = useState<Record<string, LiveScore>>({});
  const [lastLiveAt, setLastLiveAt] = useState<string | null>(null);
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const loadFixtures = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch("/api/fixtures?limit=300");
    const data = await res.json();
    setAllFixtures(data.fixtures || []);
    setIsLoading(false);
  }, []);

  // Poll /api/live every 60 s for live scores
  const pollLiveScores = useCallback(async () => {
    try {
      const res = await fetch("/api/live");
      if (!res.ok) return;
      const data = await res.json();
      if (Object.keys(data.matches).length > 0) {
        setLiveScores(data.matches);
        setLastLiveAt(data.fetchedAt);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadFixtures(); }, [loadFixtures]);

  useEffect(() => {
    pollLiveScores(); // immediate poll on mount
    const id = setInterval(pollLiveScores, 60_000); // then every 60 s
    return () => clearInterval(id);
  }, [pollLiveScores]);

  // Teams per group (for the group header pills)
  const groupTeams = useCallback((group: string) => {
    const seen = new Set<string>();
    const teams: Team[] = [];
    for (const f of allFixtures) {
      if (f.group !== group) continue;
      if (!seen.has(f.homeTeam.id)) { seen.add(f.homeTeam.id); teams.push(f.homeTeam); }
      if (!seen.has(f.awayTeam.id)) { seen.add(f.awayTeam.id); teams.push(f.awayTeam); }
      if (teams.length === 4) break;
    }
    return teams;
  }, [allFixtures]);

  // Filtered fixtures depending on active tab + search
  const filtered = useCallback(() => {
    let list = allFixtures;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.homeTeam.name.toLowerCase().includes(q) ||
          f.awayTeam.name.toLowerCase().includes(q) ||
          f.stadium.toLowerCase().includes(q) ||
          f.city.toLowerCase().includes(q)
      );
    }
    if (activeNav === "GROUP_STAGE") return list.filter((f) => f.stage === "GROUP_STAGE");
    if (GROUPS.includes(activeNav)) return list.filter((f) => f.group === activeNav);
    return list.filter((f) => f.stage === activeNav);
  }, [allFixtures, activeNav, search]);

  const displayFixtures = filtered();

  // Group them by group letter or stage
  const grouped = displayFixtures.reduce((acc, f) => {
    const key = f.group ? `Group ${f.group}` : getStageLabel(f.stage);
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {} as Record<string, Fixture[]>);

  const isGroupStageNav = activeNav === "GROUP_STAGE" || GROUPS.includes(activeNav);

  return (
    <div className="max-w-6xl mx-auto space-y-0">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-3xl font-black">
            World Cup <span className="gold-text">Fixtures</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            FIFA World Cup 2026 — USA · Canada · Mexico · {allFixtures.length} matches
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastLiveAt && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
              <Zap className="w-3 h-3" />
              Live · {new Date(lastLiveAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => { loadFixtures(); pollLiveScores(); }}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4 text-muted-foreground", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ── Groups Navigation Bar ─────────────────────────────── */}
      <div className="glass-card overflow-hidden mb-4">
        {/* Section tabs: Group Stage | Knockout */}
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setActiveNav("GROUP_STAGE")}
            className={cn(
              "flex-1 py-3 text-sm font-semibold transition-all",
              isGroupStageNav
                ? "text-gold border-b-2 border-gold bg-gold/5"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Group Stage
          </button>
          {KNOCKOUT_STAGES.map((s) => (
            <button
              key={s.value}
              onClick={() => setActiveNav(s.value)}
              className={cn(
                "flex-1 py-3 text-sm font-semibold transition-all",
                activeNav === s.value
                  ? "text-gold border-b-2 border-gold bg-gold/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Group letters (only when Group Stage is active) */}
        <AnimatePresence>
          {isGroupStageNav && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-3 flex flex-wrap gap-2">
                {/* "All" pill */}
                <button
                  onClick={() => setActiveNav("GROUP_STAGE")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    activeNav === "GROUP_STAGE"
                      ? "bg-gold text-navy-950"
                      : "bg-white/5 text-muted-foreground hover:bg-white/10"
                  )}
                >
                  All
                </button>
                {GROUPS.map((g) => {
                  const teams = groupTeams(g);
                  const isActive = activeNav === g;
                  return (
                    <button
                      key={g}
                      onClick={() => setActiveNav(g)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                        isActive
                          ? "bg-gold text-navy-950 border-gold"
                          : "bg-white/5 text-muted-foreground hover:bg-white/8 border-white/5 hover:border-white/20"
                      )}
                    >
                      <span className="font-display">Group {g}</span>
                      {teams.length > 0 && (
                        <span className="flex gap-0.5 ml-1">
                          {teams.map((t) => (
                            <span key={t.id} className="text-sm leading-none">{t.flag}</span>
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Search bar ────────────────────────────────────────── */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search teams, stadiums, cities…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 focus:border-gold/50"
        />
      </div>

      {/* ── Loading skeleton ──────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-2">
          {[1,2,3,4,5,6,7,8].map((i) => (
            <div key={i} className="loading-skeleton h-20 rounded-xl" />
          ))}
        </div>
      )}

      {/* ── Fixture list ─────────────────────────────────────── */}
      {!isLoading && (
        <div className="space-y-5">
          {Object.keys(grouped).length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No fixtures found</p>
            </div>
          ) : (
            Object.entries(grouped).map(([sectionName, sectionFixtures]) => (
              <div key={sectionName} ref={(el) => { groupRefs.current[sectionName] = el; }}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-2 px-1">
                  <div className="w-1.5 h-5 bg-gold rounded-full" />
                  <h2 className="font-display font-bold text-sm uppercase tracking-wider text-gold">
                    {sectionName}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {sectionFixtures.length} match{sectionFixtures.length !== 1 ? "es" : ""}
                  </span>
                </div>

                {/* Fixture cards */}
                <div className="space-y-1.5">
                  {sectionFixtures.map((fixture, i) => {
                    const liveKey = `${fixture.homeTeam.code}-${fixture.awayTeam.code}`;
                    const live = liveScores[liveKey] ?? null;
                    return (
                      <FixtureRow key={fixture.id} fixture={fixture} index={i} liveOverride={live} />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Individual fixture row ────────────────────────────────────────────────────
function FixtureRow({
  fixture,
  index,
  liveOverride,
}: {
  fixture: Fixture;
  index: number;
  liveOverride: LiveScore | null;
}) {
  // Merge DB data with live override from ESPN polling
  const effectiveStatus    = liveOverride?.status    ?? fixture.status;
  const effectiveHomeScore = liveOverride?.homeScore  ?? fixture.homeScore;
  const effectiveAwayScore = liveOverride?.awayScore  ?? fixture.awayScore;
  const effectiveClock     = liveOverride?.clock;

  const isCompleted = effectiveStatus === "COMPLETED";
  const isLive      = effectiveStatus === "LIVE";
  const isScheduled = effectiveStatus === "SCHEDULED";
  const hasPred     = !!fixture.userPrediction;

  const matchDate = new Date(fixture.matchDate);
  const dateStr   = matchDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const timeStr   = matchDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
    >
      <Link href={`/predictions?fixture=${fixture.id}`}>
        <div className={cn(
          "glass-card px-4 py-3 flex items-center gap-3 transition-all duration-200 cursor-pointer group",
          "hover:border-gold/25 hover:bg-white/4",
          isLive && "border-red-500/30 bg-red-500/3"
        )}>
          {/* Date / Status block */}
          <div className="w-14 flex-shrink-0 text-center">
            {isCompleted ? (
              <span className="text-xs font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">FT</span>
            ) : isLive ? (
              <span className="flex items-center justify-center gap-1 text-xs font-bold text-red-400">
                <span className="live-pulse" />
                {effectiveClock ?? "LIVE"}
              </span>
            ) : (
              <div>
                <div className="text-xs font-bold text-gold">{timeStr}</div>
                <div className="text-xs text-muted-foreground leading-none mt-0.5">{dateStr}</div>
              </div>
            )}
          </div>

          {/* Home team */}
          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
            <span className="text-sm font-semibold truncate hidden sm:block text-right">{fixture.homeTeam.name}</span>
            <span className="text-sm font-bold sm:hidden text-right">{fixture.homeTeam.code}</span>
            <span className="text-2xl flex-shrink-0">{fixture.homeTeam.flag}</span>
          </div>

          {/* Score or VS */}
          <div className="flex-shrink-0 w-20 text-center">
            {isCompleted || isLive ? (
              <span className={cn(
                "font-display font-black text-xl tabular-nums",
                isLive && "text-red-300"
              )}>
                {effectiveHomeScore ?? 0} – {effectiveAwayScore ?? 0}
              </span>
            ) : (
              <span className="font-display font-black text-muted-foreground/40 text-sm tracking-widest">VS</span>
            )}
          </div>

          {/* Away team */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">{fixture.awayTeam.flag}</span>
            <span className="text-sm font-semibold truncate hidden sm:block">{fixture.awayTeam.name}</span>
            <span className="text-sm font-bold sm:hidden">{fixture.awayTeam.code}</span>
          </div>

          {/* Right meta */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />{fixture.city.split(",")[0]}
            </div>
            {hasPred ? (
              <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
                ✓ {fixture.userPrediction!.predictedHome}–{fixture.userPrediction!.predictedAway}
              </span>
            ) : isScheduled ? (
              <span className="text-xs px-2 py-0.5 bg-gold/10 text-gold rounded-full border border-gold/20">
                Predict
              </span>
            ) : !isScheduled && !isCompleted ? null : (
              <Lock className="w-3 h-3 text-muted-foreground/40" />
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-gold transition-colors" />
          </div>

          {/* Mobile prediction badge */}
          <div className="md:hidden flex-shrink-0">
            {hasPred ? (
              <span className="text-xs text-green-400">✓</span>
            ) : isScheduled ? (
              <span className="text-xs text-gold">+</span>
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
