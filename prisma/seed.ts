/**
 * FIFA World Cup 2026 seed
 * Fetches the real fixture schedule from openfootball/worldcup.json (GitHub).
 * Real teams, real groups, real match dates — directly from source.
 */
import { PrismaClient, TournamentStage, MatchStatus } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Openfootball flat match format ──────────────────────────────────────────
interface OFMatch {
  round: string;
  date: string;
  time?: string;
  team1: string;
  team2: string;
  group?: string;
  ground?: string;
  score1?: number;
  score2?: number;
  score?: string;  // some openfootball versions use "2:1" string
}

// ─── Official ground → stadium + city ────────────────────────────────────────
const GROUND: Record<string, { stadium: string; city: string }> = {
  "Mexico City":                          { stadium: "Estadio Azteca",          city: "Mexico City, Mexico"           },
  "Guadalajara (Zapopan)":                { stadium: "Estadio Akron",           city: "Guadalajara, Mexico"           },
  "Monterrey (Guadalupe)":                { stadium: "Estadio BBVA",            city: "Monterrey, Mexico"             },
  "Toronto":                              { stadium: "BMO Field",               city: "Toronto, Canada"               },
  "Vancouver":                            { stadium: "BC Place",                city: "Vancouver, Canada"             },
  "Seattle":                              { stadium: "Lumen Field",             city: "Seattle, USA"                  },
  "San Francisco Bay Area (Santa Clara)": { stadium: "Levi's Stadium",         city: "San Francisco, USA"            },
  "Los Angeles (Inglewood)":              { stadium: "SoFi Stadium",            city: "Los Angeles, USA"              },
  "Atlanta":                              { stadium: "Mercedes-Benz Stadium",   city: "Atlanta, USA"                  },
  "New York/New Jersey (East Rutherford)":{ stadium: "MetLife Stadium",         city: "New York / New Jersey, USA"    },
  "Boston (Foxborough)":                  { stadium: "Gillette Stadium",        city: "Boston, USA"                   },
  "Philadelphia":                         { stadium: "Lincoln Financial Field", city: "Philadelphia, USA"             },
  "Dallas (Arlington)":                   { stadium: "AT&T Stadium",            city: "Dallas, USA"                   },
  "Houston":                              { stadium: "NRG Stadium",             city: "Houston, USA"                  },
  "Kansas City":                          { stadium: "Arrowhead Stadium",       city: "Kansas City, USA"              },
  "Miami (Miami Gardens)":                { stadium: "Hard Rock Stadium",       city: "Miami, USA"                    },
};
const DEFAULT_VENUE = { stadium: "TBD",    city: "USA"                                                                };

function venueFor(ground?: string) {
  if (!ground) return DEFAULT_VENUE;
  return GROUND[ground] ?? { stadium: ground, city: "USA" };
}

// ─── Team name → our 3-letter code ───────────────────────────────────────────
const NAME_CODE: Record<string, string> = {
  "Mexico": "MEX", "South Africa": "RSA", "South Korea": "KOR", "Czech Republic": "CZE",
  "Canada": "CAN", "Bosnia & Herzegovina": "BIH", "Qatar": "QAT", "Switzerland": "SUI",
  "Brazil": "BRA", "Morocco": "MAR", "Haiti": "HAI", "Scotland": "SCO",
  "USA": "USA", "United States": "USA", "Paraguay": "PAR", "Australia": "AUS", "Turkey": "TUR",
  "Germany": "GER", "Curaçao": "CUW", "Ivory Coast": "CIV", "Côte d'Ivoire": "CIV", "Ecuador": "ECU",
  "Netherlands": "NED", "Japan": "JPN", "Sweden": "SWE", "Tunisia": "TUN",
  "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "New Zealand": "NZL",
  "Spain": "ESP", "Cape Verde": "CPV", "Saudi Arabia": "KSA", "Uruguay": "URU",
  "France": "FRA", "Senegal": "SEN", "Iraq": "IRQ", "Norway": "NOR",
  "Argentina": "ARG", "Algeria": "ALG", "Austria": "AUT", "Jordan": "JOR",
  "Portugal": "POR", "DR Congo": "COD", "Congo DR": "COD", "Uzbekistan": "UZB", "Colombia": "COL",
  "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN",
};

// ─── Team metadata (all 48 WC2026 participants) ───────────────────────────────
const TEAM_META: Record<string, { flag: string; continent: string; ranking: number; strength: number; fullName: string }> = {
  // Group A
  MEX: { flag: "🇲🇽", continent: "CONCACAF", ranking: 16,  strength: 7.5, fullName: "Mexico"                },
  RSA: { flag: "🇿🇦", continent: "CAF",      ranking: 62,  strength: 5.5, fullName: "South Africa"          },
  KOR: { flag: "🇰🇷", continent: "AFC",      ranking: 24,  strength: 7.5, fullName: "South Korea"           },
  CZE: { flag: "🇨🇿", continent: "UEFA",     ranking: 35,  strength: 7.0, fullName: "Czech Republic"        },
  // Group B
  CAN: { flag: "🇨🇦", continent: "CONCACAF", ranking: 47,  strength: 6.5, fullName: "Canada"                },
  BIH: { flag: "🇧🇦", continent: "UEFA",     ranking: 58,  strength: 6.0, fullName: "Bosnia & Herzegovina"  },
  QAT: { flag: "🇶🇦", continent: "AFC",      ranking: 68,  strength: 5.5, fullName: "Qatar"                 },
  SUI: { flag: "🇨🇭", continent: "UEFA",     ranking: 20,  strength: 8.0, fullName: "Switzerland"           },
  // Group C
  BRA: { flag: "🇧🇷", continent: "CONMEBOL", ranking: 5,   strength: 9.0, fullName: "Brazil"                },
  MAR: { flag: "🇲🇦", continent: "CAF",      ranking: 14,  strength: 8.0, fullName: "Morocco"               },
  HAI: { flag: "🇭🇹", continent: "CONCACAF", ranking: 92,  strength: 4.5, fullName: "Haiti"                 },
  SCO: { flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", continent: "UEFA",     ranking: 33,  strength: 7.0, fullName: "Scotland"              },
  // Group D
  USA: { flag: "🇺🇸", continent: "CONCACAF", ranking: 11,  strength: 7.5, fullName: "United States"         },
  PAR: { flag: "🇵🇾", continent: "CONMEBOL", ranking: 65,  strength: 5.5, fullName: "Paraguay"              },
  AUS: { flag: "🇦🇺", continent: "AFC",      ranking: 23,  strength: 7.0, fullName: "Australia"             },
  TUR: { flag: "🇹🇷", continent: "UEFA",     ranking: 32,  strength: 7.0, fullName: "Turkey"                },
  // Group E
  GER: { flag: "🇩🇪", continent: "UEFA",     ranking: 15,  strength: 8.5, fullName: "Germany"               },
  CUW: { flag: "🇨🇼", continent: "CONCACAF", ranking: 85,  strength: 4.5, fullName: "Curaçao"               },
  CIV: { flag: "🇨🇮", continent: "CAF",      ranking: 38,  strength: 6.5, fullName: "Ivory Coast"           },
  ECU: { flag: "🇪🇨", continent: "CONMEBOL", ranking: 44,  strength: 6.5, fullName: "Ecuador"               },
  // Group F
  NED: { flag: "🇳🇱", continent: "UEFA",     ranking: 7,   strength: 8.5, fullName: "Netherlands"           },
  JPN: { flag: "🇯🇵", continent: "AFC",      ranking: 18,  strength: 7.5, fullName: "Japan"                 },
  SWE: { flag: "🇸🇪", continent: "UEFA",     ranking: 26,  strength: 7.0, fullName: "Sweden"                },
  TUN: { flag: "🇹🇳", continent: "CAF",      ranking: 27,  strength: 7.0, fullName: "Tunisia"               },
  // Group G
  BEL: { flag: "🇧🇪", continent: "UEFA",     ranking: 9,   strength: 8.5, fullName: "Belgium"               },
  EGY: { flag: "🇪🇬", continent: "CAF",      ranking: 34,  strength: 6.5, fullName: "Egypt"                 },
  IRN: { flag: "🇮🇷", continent: "AFC",      ranking: 30,  strength: 7.0, fullName: "Iran"                  },
  NZL: { flag: "🇳🇿", continent: "OFC",      ranking: 95,  strength: 4.5, fullName: "New Zealand"           },
  // Group H
  ESP: { flag: "🇪🇸", continent: "UEFA",     ranking: 3,   strength: 9.5, fullName: "Spain"                 },
  CPV: { flag: "🇨🇻", continent: "CAF",      ranking: 74,  strength: 5.5, fullName: "Cape Verde"            },
  KSA: { flag: "🇸🇦", continent: "AFC",      ranking: 56,  strength: 6.0, fullName: "Saudi Arabia"          },
  URU: { flag: "🇺🇾", continent: "CONMEBOL", ranking: 13,  strength: 8.0, fullName: "Uruguay"               },
  // Group I
  FRA: { flag: "🇫🇷", continent: "UEFA",     ranking: 2,   strength: 9.5, fullName: "France"                },
  SEN: { flag: "🇸🇳", continent: "CAF",      ranking: 17,  strength: 7.5, fullName: "Senegal"               },
  IRQ: { flag: "🇮🇶", continent: "AFC",      ranking: 58,  strength: 5.5, fullName: "Iraq"                  },
  NOR: { flag: "🇳🇴", continent: "UEFA",     ranking: 28,  strength: 7.5, fullName: "Norway"                },
  // Group J
  ARG: { flag: "🇦🇷", continent: "CONMEBOL", ranking: 1,   strength: 9.5, fullName: "Argentina"             },
  ALG: { flag: "🇩🇿", continent: "CAF",      ranking: 45,  strength: 6.5, fullName: "Algeria"               },
  AUT: { flag: "🇦🇹", continent: "UEFA",     ranking: 27,  strength: 7.5, fullName: "Austria"               },
  JOR: { flag: "🇯🇴", continent: "AFC",      ranking: 67,  strength: 5.5, fullName: "Jordan"                },
  // Group K
  POR: { flag: "🇵🇹", continent: "UEFA",     ranking: 6,   strength: 9.0, fullName: "Portugal"              },
  COD: { flag: "🇨🇩", continent: "CAF",      ranking: 57,  strength: 6.0, fullName: "DR Congo"              },
  UZB: { flag: "🇺🇿", continent: "AFC",      ranking: 66,  strength: 5.5, fullName: "Uzbekistan"            },
  COL: { flag: "🇨🇴", continent: "CONMEBOL", ranking: 19,  strength: 7.5, fullName: "Colombia"              },
  // Group L
  ENG: { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", continent: "UEFA",     ranking: 4,   strength: 9.0, fullName: "England"               },
  CRO: { flag: "🇭🇷", continent: "UEFA",     ranking: 12,  strength: 8.5, fullName: "Croatia"               },
  GHA: { flag: "🇬🇭", continent: "CAF",      ranking: 60,  strength: 6.0, fullName: "Ghana"                 },
  PAN: { flag: "🇵🇦", continent: "CONCACAF", ranking: 37,  strength: 6.0, fullName: "Panama"                },
};

// ─── Achievements ─────────────────────────────────────────────────────────────
const achievements = [
  { name: "First Prediction",  description: "Make your first match prediction",         badge: "🎯", category: "PREDICTIONS" as const, requirement: 1,    points: 50   },
  { name: "Prediction Rookie", description: "Make 10 correct predictions",              badge: "⭐", category: "PREDICTIONS" as const, requirement: 10,   points: 100  },
  { name: "Prediction Pro",    description: "Make 25 correct predictions",              badge: "🌟", category: "PREDICTIONS" as const, requirement: 25,   points: 250  },
  { name: "Hot Streak",        description: "5 correct predictions in a row",           badge: "🔥", category: "PREDICTIONS" as const, requirement: 5,    points: 200  },
  { name: "Unstoppable",       description: "10 correct predictions in a row",          badge: "💫", category: "PREDICTIONS" as const, requirement: 10,   points: 500  },
  { name: "Exact Score King",  description: "Predict the exact score 5 times",          badge: "👑", category: "PREDICTIONS" as const, requirement: 5,    points: 300  },
  { name: "First Bet",         description: "Place your first virtual bet",             badge: "💰", category: "BETTING"     as const, requirement: 1,    points: 50   },
  { name: "High Roller",       description: "Win a bet of £500 or more",                badge: "💎", category: "BETTING"     as const, requirement: 500,  points: 300  },
  { name: "Betting Streak",    description: "Win 5 bets in a row",                      badge: "🎰", category: "BETTING"     as const, requirement: 5,    points: 400  },
  { name: "League Creator",    description: "Create your first private league",         badge: "🏆", category: "SOCIAL"      as const, requirement: 1,    points: 100  },
  { name: "Social Butterfly",  description: "Join 3 different leagues",                 badge: "🦋", category: "SOCIAL"      as const, requirement: 3,    points: 150  },
  { name: "World Cup Expert",  description: "Earn 1,000 prediction points",             badge: "🌍", category: "MILESTONES"  as const, requirement: 1000, points: 1000 },
  { name: "Top 10 Finisher",   description: "Finish top 10 on the global leaderboard",  badge: "🥇", category: "MILESTONES"  as const, requirement: 10,   points: 2000 },
  { name: "Millionaire",       description: "Accumulate £2,000 in your virtual wallet", badge: "💸", category: "MILESTONES"  as const, requirement: 2000, points: 500  },
];

// ─── UTC offset parser ────────────────────────────────────────────────────────
function toUTC(dateStr: string, timeStr?: string): Date {
  if (!timeStr) return new Date(`${dateStr}T12:00:00Z`);

  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s+UTC([+-]\d+)/);
  if (!m) return new Date(`${dateStr}T12:00:00Z`);

  const localMins = parseInt(m[1]) * 60 + parseInt(m[2]);
  const offset    = parseInt(m[3]); // e.g. -6
  // UTC = local − offset  →  "13:00 UTC-6" = 13*60 - (-6*60) = 780+360 = 1140 = 19:00 UTC
  let utcMins = localMins - offset * 60;

  let dayShift = 0;
  if (utcMins >= 1440) { dayShift = 1; utcMins -= 1440; }
  if (utcMins < 0)     { dayShift = -1; utcMins += 1440; }

  const base = new Date(`${dateStr}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + dayShift);
  base.setUTCHours(Math.floor(utcMins / 60), utcMins % 60, 0, 0);
  return base;
}

// ─── Round name → our stage enum ─────────────────────────────────────────────
function toStage(round: string): TournamentStage {
  const r = round.toLowerCase();
  if (r.includes("matchday") || r.includes("group"))         return TournamentStage.GROUP_STAGE;
  if (r.includes("round of 32") || r.includes("last 32"))    return TournamentStage.ROUND_OF_32;
  if (r.includes("round of 16") || r.includes("last 16"))    return TournamentStage.ROUND_OF_16;
  if (r.includes("quarter"))                                  return TournamentStage.QUARTER_FINAL;
  if (r.includes("semi"))                                     return TournamentStage.SEMI_FINAL;
  if (r.includes("third") || r.includes("3rd") || r.includes("place"))  return TournamentStage.THIRD_PLACE;
  if (r.includes("final"))                                    return TournamentStage.FINAL;
  return TournamentStage.GROUP_STAGE;
}

// ─── Score extraction ─────────────────────────────────────────────────────────
function extractScore(m: OFMatch): [number, number] | null {
  if (typeof m.score1 === "number" && typeof m.score2 === "number") return [m.score1, m.score2];
  if (typeof m.score === "string") {
    const parts = m.score.split(/[-:]/).map(Number);
    if (parts.length === 2 && !parts.some(isNaN)) return [parts[0], parts[1]];
  }
  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🌍 FIFA World Cup 2026 — fetching REAL fixture data...\n");

  const url = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
  console.log(`   Source: ${url}\n`);

  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) { console.error(`❌ HTTP ${res.status}`); process.exit(1); }

  const data: { name: string; matches: OFMatch[] } = await res.json();
  const allMatches: OFMatch[] = data.matches ?? [];
  console.log(`✅  "${data.name}" — ${allMatches.length} matches found\n`);

  // ── Resolve team code for each name ──────────────────────────────────────
  const resolveCode = (name: string): string => NAME_CODE[name] ?? name.slice(0, 3).toUpperCase();

  // ── Build group map: name → group letter ────────────────────────────────
  const nameToGroup = new Map<string, string>();
  for (const m of allMatches) {
    if (m.group) {
      const letter = m.group.replace("Group ", "").trim();
      nameToGroup.set(m.team1, letter);
      nameToGroup.set(m.team2, letter);
    }
  }

  // ── Clear fixture/team/bet data only — preserve users and wallets ─────────
  console.log("🗑️  Clearing fixture & game data (preserving users & wallets)...");
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.leagueInvite.deleteMany();
  await prisma.leagueMember.deleteMany();
  await prisma.league.deleteMany();
  // Only delete bet/prediction transactions, not initial deposits
  await prisma.transaction.deleteMany({
    where: { type: { not: "INITIAL_DEPOSIT" } },
  });
  await prisma.bet.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.fixture.deleteMany();
  await prisma.team.deleteMany();
  // Reset wallet stats but keep balance so users don't lose their £1,000
  await prisma.wallet.updateMany({
    data: { totalWinnings: 0, totalLosses: 0, totalBets: 0, wonBets: 0 },
  });

  // ── Create teams ──────────────────────────────────────────────────────────
  console.log("⚽  Creating teams...");
  const teamNames = new Set<string>();
  for (const m of allMatches) {
    if (nameToGroup.has(m.team1)) teamNames.add(m.team1); // group-stage teams only
    if (nameToGroup.has(m.team2)) teamNames.add(m.team2);
  }

  const codeToId = new Map<string, string>();
  for (const name of teamNames) {
    const code  = resolveCode(name);
    const meta  = TEAM_META[code];
    const group = nameToGroup.get(name) ?? "?";
    const team  = await prisma.team.create({
      data: {
        name:      meta?.fullName ?? name,
        code,
        flag:      meta?.flag      ?? "🏳️",
        group,
        continent: meta?.continent ?? "UNK",
        ranking:   meta?.ranking   ?? 100,
        strength:  meta?.strength  ?? 5.0,
      },
    });
    codeToId.set(code, team.id);
  }
  console.log(`   ${codeToId.size} teams created across ${new Set(nameToGroup.values()).size} groups\n`);

  // ── Create fixtures ────────────────────────────────────────────────────────
  console.log("📅  Creating fixtures from real schedule...");
  let created = 0, skipped = 0;

  for (const m of allMatches) {
    const homeCode = resolveCode(m.team1);
    const awayCode = resolveCode(m.team2);
    const homeId   = codeToId.get(homeCode);
    const awayId   = codeToId.get(awayCode);

    // Skip knockout placeholders (e.g. "1A", "W73", "L101") — no real teams yet
    if (!homeId || !awayId) { skipped++; continue; }

    const venue      = venueFor(m.ground);
    const matchDate  = toUTC(m.date, m.time);
    const score      = extractScore(m);
    const isGroup    = !!m.group;
    const groupLetter= m.group ? m.group.replace("Group ", "").trim() : null;
    const stage      = toStage(m.round);

    await prisma.fixture.create({
      data: {
        homeTeamId: homeId,
        awayTeamId: awayId,
        matchDate,
        stadium:   venue.stadium,
        city:      venue.city,
        group:     groupLetter,
        stage,
        status:    score ? MatchStatus.COMPLETED : MatchStatus.SCHEDULED,
        homeScore: score ? score[0] : null,
        awayScore: score ? score[1] : null,
      },
    });
    created++;
  }
  console.log(`   ${created} fixtures created  (${skipped} knockout placeholders skipped — teams TBD)\n`);

  // ── Achievements ──────────────────────────────────────────────────────────
  console.log("🏅  Creating achievements...");
  for (const a of achievements) await prisma.achievement.create({ data: a });

  // ── Summary ───────────────────────────────────────────────────────────────
  const groups = [...new Set(nameToGroup.values())].sort();
  console.log(`
✅  Database populated with REAL WC2026 data!

    ⚽  ${codeToId.size} teams — Groups ${groups.join(", ")}
    📅  ${created} fixtures  (72 group-stage · knockout TBD until teams qualify)
    🏅  ${achievements.length} achievements
    🌍  Venues: USA · Mexico · Canada
    📆  June 11 – July 19, 2026

    Groups:
    A  Mexico · South Africa · South Korea · Czech Republic
    B  Canada · Bosnia & Herzegovina · Qatar · Switzerland
    C  Brazil · Morocco · Haiti · Scotland
    D  USA · Paraguay · Australia · Turkey
    E  Germany · Curaçao · Ivory Coast · Ecuador
    F  Netherlands · Japan · Sweden · Tunisia
    G  Belgium · Egypt · Iran · New Zealand
    H  Spain · Cape Verde · Saudi Arabia · Uruguay
    I  France · Senegal · Iraq · Norway
    J  Argentina · Algeria · Austria · Jordan
    K  Portugal · DR Congo · Uzbekistan · Colombia
    L  England · Croatia · Ghana · Panama
  `);
}

main()
  .catch((e) => { console.error("\n❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
