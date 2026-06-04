/**
 * POST /api/admin/sync
 * Admin-only. Pulls the full WC2026 schedule + results from openfootball,
 * then overlays today's live scores from ESPN.
 * Updates every fixture's status, homeScore, awayScore in the DB.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  fetchOpenFootball,
  fetchESPNScoreboard,
  type LiveMatch,
} from "@/lib/live-data";
import { awardPredictionPoints } from "@/lib/predictions";
import { settleBets } from "@/lib/betting";
import { MatchStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const results = {
    openFootball: { fetched: 0, updated: 0, errors: 0 },
    espn:         { fetched: 0, updated: 0, errors: 0 },
    settled:      0,
  };

  // ── 1. Full schedule from openfootball ──────────────────────────────────
  try {
    const ofMatches = await fetchOpenFootball();
    results.openFootball.fetched = ofMatches.length;

    for (const m of ofMatches) {
      const updated = await syncMatch(m);
      if (updated === "updated") {
        results.openFootball.updated++;
        if (m.status === "COMPLETED") results.settled++;
      } else if (updated === "error") {
        results.openFootball.errors++;
      }
    }
  } catch (err) {
    console.error("[sync] openfootball error:", err);
    results.openFootball.errors++;
  }

  // ── 2. Live/today scores from ESPN (overrides openfootball for today) ──
  try {
    const espnMatches = await fetchESPNScoreboard();
    results.espn.fetched = espnMatches.length;

    for (const m of espnMatches) {
      const updated = await syncMatch(m);
      if (updated === "updated") results.espn.updated++;
      else if (updated === "error") results.espn.errors++;
    }
  } catch (err) {
    console.error("[sync] ESPN error:", err);
    results.espn.errors++;
  }

  return NextResponse.json({
    success: true,
    message: "Sync complete",
    results,
    syncedAt: new Date().toISOString(),
  });
}

// ── GET — lightweight: today's live scores only ─────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const espnMatches = await fetchESPNScoreboard();
    let updated = 0;
    for (const m of espnMatches) {
      const r = await syncMatch(m);
      if (r === "updated") updated++;
    }
    return NextResponse.json({
      success: true,
      fetched: espnMatches.length,
      updated,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}

// ── Helper: find fixture in DB and update if needed ─────────────────────────

async function syncMatch(m: LiveMatch): Promise<"updated" | "skipped" | "error"> {
  try {
    // Find the teams in our DB
    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({ where: { code: m.homeCode } }),
      prisma.team.findUnique({ where: { code: m.awayCode } }),
    ]);

    if (!homeTeam || !awayTeam) return "skipped"; // teams not in our DB

    // Find the fixture
    const fixture = await prisma.fixture.findFirst({
      where: { homeTeamId: homeTeam.id, awayTeamId: awayTeam.id },
    });

    if (!fixture) return "skipped";

    // Skip if nothing changed
    const statusChanged = fixture.status !== m.status;
    const scoreChanged =
      fixture.homeScore !== m.homeScore || fixture.awayScore !== m.awayScore;

    if (!statusChanged && !scoreChanged) return "skipped";

    await prisma.fixture.update({
      where: { id: fixture.id },
      data: {
        status:    m.status as MatchStatus,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        updatedAt: new Date(),
      },
    });

    // Award points and settle bets when a match completes
    if (m.status === "COMPLETED" && fixture.status !== "COMPLETED") {
      await awardPredictionPoints(fixture.id);
      await settleBets(fixture.id);
    }

    return "updated";
  } catch (err) {
    console.error("[syncMatch] error:", err);
    return "error";
  }
}
