/**
 * GET /api/live
 * Public endpoint — returns today's live match scores from ESPN.
 * Used by the fixtures page to auto-refresh every 60 seconds.
 * No auth required (scores are public info).
 */
import { NextResponse } from "next/server";
import { getTodayLiveMatches } from "@/lib/live-data";

export const dynamic = "force-dynamic"; // never cache

export async function GET() {
  try {
    const matches = await getTodayLiveMatches();

    // Return as a code-keyed map so the client can do O(1) lookups
    const byPair: Record<string, {
      homeScore: number | null;
      awayScore: number | null;
      status: string;
      clock?: string;
    }> = {};

    for (const m of matches) {
      const key = `${m.homeCode}-${m.awayCode}`;
      byPair[key] = {
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        status:    m.status,
        clock:     m.clock,
      };
    }

    return NextResponse.json({ matches: byPair, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { matches: {}, error: String(err) },
      { status: 200 } // still 200 so the client doesn't crash
    );
  }
}
