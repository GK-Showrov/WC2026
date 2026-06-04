/**
 * Live data service — FIFA World Cup 2026
 *
 * Source 1 (schedule + results): openfootball/worldcup.json
 *   URL: https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json
 *   Free, no API key, updated by the community as results come in.
 *
 * Source 2 (live in-progress scores): ESPN public API
 *   URL: https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
 *   Free, no API key, real-time.
 */

// ── Types from external APIs ────────────────────────────────────────────────

interface OpenFootballTeam {
  name: string;
  code: string;
}

interface OpenFootballScore {
  ft?: [number, number]; // full-time
  ht?: [number, number]; // half-time
}

interface OpenFootballMatch {
  num: number;
  date: string;        // "2026-06-11"
  time?: string;       // "20:00"
  team1: OpenFootballTeam;
  team2: OpenFootballTeam;
  score?: OpenFootballScore;
  group?: string;
  round?: string;
}

interface OpenFootballRound {
  name: string;        // "Group A", "Round of 32", etc.
  matches: OpenFootballMatch[];
}

interface OpenFootballData {
  name: string;
  rounds: OpenFootballRound[];
}

interface ESPNStatus {
  type: {
    name: string;      // STATUS_SCHEDULED | STATUS_IN_PROGRESS | STATUS_HALFTIME | STATUS_FINAL
    completed: boolean;
    state: string;     // "pre" | "in" | "post"
  };
  displayClock?: string;
  period?: number;
}

interface ESPNCompetitor {
  homeAway: "home" | "away";
  score: string;
  team: { abbreviation: string; displayName: string };
}

interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  competitions: Array<{
    status: ESPNStatus;
    competitors: ESPNCompetitor[];
    venue?: { fullName: string; address?: { city: string; country: string } };
  }>;
}

// ── Normalised match record we return from both sources ─────────────────────

export interface LiveMatch {
  /** Matches our Team.code values */
  homeCode: string;
  awayCode: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "SCHEDULED" | "LIVE" | "COMPLETED";
  /** ISO string */
  matchDate: string;
  /** e.g. "45'" or "HT" — only when LIVE */
  clock?: string;
  /** Group letter if group stage */
  group?: string;
}

// ── Team-code normalisation ──────────────────────────────────────────────────
// Both sources sometimes use slightly different codes/names; map to our DB codes.

const CODE_MAP: Record<string, string> = {
  // ESPN abbreviations → our codes
  USMNT: "USA", US: "USA",
  MXNT: "MEX",
  CAN: "CAN",
  // openfootball name → our code (fallback for when code field is absent)
  "United States": "USA",
  "Mexico": "MEX",
  "Canada": "CAN",
  "South Korea": "KOR",
  "Ivory Coast": "CIV",
  "Côte d'Ivoire": "CIV",
  "Saudi Arabia": "KSA",
  "South Africa": "RSA",
  "New Zealand": "NZL",
  "Netherlands": "NED",
  "Venezuela": "VEN",
};

function normaliseCode(code: string, name = ""): string {
  if (CODE_MAP[code]) return CODE_MAP[code];
  if (CODE_MAP[name]) return CODE_MAP[name];
  return code.toUpperCase().slice(0, 3);
}

// ── ESPN status → our MatchStatus ────────────────────────────────────────────

function espnStatusToOurs(typeName: string): LiveMatch["status"] {
  if (typeName === "STATUS_FINAL" || typeName === "STATUS_FULL_TIME") return "COMPLETED";
  if (
    typeName === "STATUS_IN_PROGRESS" ||
    typeName === "STATUS_HALFTIME" ||
    typeName === "STATUS_EXTRA_TIME" ||
    typeName === "STATUS_PENALTY"
  )
    return "LIVE";
  return "SCHEDULED";
}

// ── openfootball round name → our stage key ───────────────────────────────────

function roundToStage(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("group")) return "GROUP_STAGE";
  if (n.includes("round of 32")) return "ROUND_OF_32";
  if (n.includes("round of 16")) return "ROUND_OF_16";
  if (n.includes("quarterfinal") || n.includes("quarter-final")) return "QUARTER_FINAL";
  if (n.includes("semifinal") || n.includes("semi-final")) return "SEMI_FINAL";
  if (n.includes("third") || n.includes("3rd")) return "THIRD_PLACE";
  if (n.includes("final")) return "FINAL";
  return "GROUP_STAGE";
}

// ── Fetch from openfootball ──────────────────────────────────────────────────

export async function fetchOpenFootball(): Promise<LiveMatch[]> {
  const url =
    "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
  const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
  if (!res.ok) throw new Error(`openfootball fetch failed: ${res.status}`);

  const data: OpenFootballData = await res.json();
  const matches: LiveMatch[] = [];

  for (const round of data.rounds) {
    const group = round.name.startsWith("Group ")
      ? round.name.replace("Group ", "")
      : undefined;

    for (const m of round.matches) {
      const homeCode = normaliseCode(m.team1.code, m.team1.name);
      const awayCode = normaliseCode(m.team2.code, m.team2.name);
      const hasScore = m.score?.ft != null;
      const homeScore = hasScore ? m.score!.ft![0] : null;
      const awayScore = hasScore ? m.score!.ft![1] : null;

      // Build ISO date
      const timeStr = m.time ?? "12:00";
      const matchDate = new Date(`${m.date}T${timeStr}:00Z`).toISOString();

      matches.push({
        homeCode,
        awayCode,
        homeScore,
        awayScore,
        status: hasScore ? "COMPLETED" : "SCHEDULED",
        matchDate,
        group,
      });
    }
  }
  return matches;
}

// ── Fetch live/today scores from ESPN ────────────────────────────────────────

export async function fetchESPNScoreboard(dateStr?: string): Promise<LiveMatch[]> {
  // dateStr format: "YYYYMMDD" — defaults to today
  const today = dateStr ?? new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${today}&limit=50`;

  const res = await fetch(url, { next: { revalidate: 0 } }); // always fresh
  if (!res.ok) throw new Error(`ESPN API fetch failed: ${res.status}`);

  const data = await res.json();
  const events: ESPNEvent[] = data.events ?? [];
  const matches: LiveMatch[] = [];

  for (const ev of events) {
    const comp = ev.competitions?.[0];
    if (!comp) continue;

    const home = comp.competitors.find((c) => c.homeAway === "home");
    const away = comp.competitors.find((c) => c.homeAway === "away");
    if (!home || !away) continue;

    const statusName = comp.status.type.name;
    const status = espnStatusToOurs(statusName);
    const homeScore = status !== "SCHEDULED" ? parseInt(home.score, 10) : null;
    const awayScore = status !== "SCHEDULED" ? parseInt(away.score, 10) : null;
    const clock =
      status === "LIVE"
        ? comp.status.displayClock ?? undefined
        : undefined;

    matches.push({
      homeCode: normaliseCode(home.team.abbreviation, home.team.displayName),
      awayCode: normaliseCode(away.team.abbreviation, away.team.displayName),
      homeScore: isNaN(homeScore as number) ? null : homeScore,
      awayScore: isNaN(awayScore as number) ? null : awayScore,
      status,
      matchDate: ev.date,
      clock,
    });
  }
  return matches;
}

// ── Get today's live matches (used by polling endpoint) ──────────────────────

export async function getTodayLiveMatches(): Promise<LiveMatch[]> {
  try {
    return await fetchESPNScoreboard();
  } catch (err) {
    console.error("[live-data] ESPN failed, returning []:", err);
    return [];
  }
}
