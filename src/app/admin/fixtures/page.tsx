"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Save, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, getStatusBadgeClass } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

type AdminFixture = {
  id: string;
  homeTeam: { name: string; flag: string };
  awayTeam: { name: string; flag: string };
  matchDate: string;
  stadium: string;
  group: string | null;
  stage: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  _count: { predictions: number; bets: number };
};

export default function AdminFixturesPage() {
  const { toast } = useToast();
  const [fixtures, setFixtures] = useState<AdminFixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { homeScore: number; awayScore: number; status: string }>>({});

  useEffect(() => {
    fetch("/api/admin/fixtures")
      .then((r) => r.json())
      .then((d) => {
        setFixtures(d.fixtures || []);
        const initial: Record<string, { homeScore: number; awayScore: number; status: string }> = {};
        for (const f of d.fixtures || []) {
          initial[f.id] = { homeScore: f.homeScore ?? 0, awayScore: f.awayScore ?? 0, status: f.status };
        }
        setEdits(initial);
        setIsLoading(false);
      });
  }, []);

  const handleUpdate = async (fixtureId: string) => {
    const edit = edits[fixtureId];
    if (!edit) return;
    setUpdating(fixtureId);
    try {
      const res = await fetch("/api/admin/fixtures", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtureId, ...edit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Fixture updated!", description: data.message });
      setFixtures((prev) =>
        prev.map((f) =>
          f.id === fixtureId
            ? { ...f, homeScore: edit.homeScore, awayScore: edit.awayScore, status: edit.status }
            : f
        )
      );
    } catch (e: unknown) {
      toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-gold" />
          Fixture Management
        </h1>
        <p className="text-muted-foreground mt-1">Update match results and trigger point/bet settlements</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="loading-skeleton h-20 rounded-xl" />)}</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_120px_140px_40px] gap-0 border-b border-white/5 px-5 py-3 text-xs text-muted-foreground uppercase tracking-wider">
            <div>Match</div>
            <div className="text-center">Home Score</div>
            <div className="text-center">Away Score</div>
            <div className="text-center">Status</div>
            <div />
          </div>
          {fixtures.map((fixture) => {
            const edit = edits[fixture.id] || { homeScore: 0, awayScore: 0, status: fixture.status };
            const isDirty =
              edit.homeScore !== (fixture.homeScore ?? 0) ||
              edit.awayScore !== (fixture.awayScore ?? 0) ||
              edit.status !== fixture.status;

            return (
              <div key={fixture.id} className={cn(
                "grid grid-cols-[1fr_120px_120px_140px_40px] gap-0 items-center px-5 py-3 border-b border-white/3",
                isDirty && "bg-gold/3"
              )}>
                <div>
                  <div className="text-sm font-medium">
                    {fixture.homeTeam.flag} {fixture.homeTeam.name} vs {fixture.awayTeam.name} {fixture.awayTeam.flag}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(fixture.matchDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    {fixture.group && ` · Group ${fixture.group}`}
                    <span className="ml-2">{fixture._count.predictions} predictions · {fixture._count.bets} bets</span>
                  </div>
                </div>
                <div className="px-2">
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={edit.homeScore}
                    onChange={(e) => setEdits((p) => ({ ...p, [fixture.id]: { ...p[fixture.id], homeScore: Number(e.target.value) } }))}
                    className="h-8 text-center bg-white/5 border-white/10 focus:border-gold/50"
                  />
                </div>
                <div className="px-2">
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={edit.awayScore}
                    onChange={(e) => setEdits((p) => ({ ...p, [fixture.id]: { ...p[fixture.id], awayScore: Number(e.target.value) } }))}
                    className="h-8 text-center bg-white/5 border-white/10 focus:border-gold/50"
                  />
                </div>
                <div className="px-2">
                  <select
                    value={edit.status}
                    onChange={(e) => setEdits((p) => ({ ...p, [fixture.id]: { ...p[fixture.id], status: e.target.value } }))}
                    className="w-full h-8 bg-white/5 border border-white/10 rounded text-xs focus:border-gold/50 focus:outline-none"
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="LIVE">Live</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="POSTPONED">Postponed</option>
                  </select>
                </div>
                <div>
                  <button
                    onClick={() => handleUpdate(fixture.id)}
                    disabled={!isDirty || updating === fixture.id}
                    className={cn(
                      "w-8 h-8 rounded flex items-center justify-center transition-all",
                      isDirty ? "text-gold hover:bg-gold/10" : "text-muted-foreground/30 cursor-not-allowed"
                    )}
                  >
                    {updating === fixture.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isDirty ? (
                      <Save className="w-4 h-4" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
