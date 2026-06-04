import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isAfter, isBefore } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy HH:mm");
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), "HH:mm");
}

export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isMatchLocked(matchDate: Date | string): boolean {
  return isAfter(new Date(), new Date(matchDate));
}

export function isMatchUpcoming(matchDate: Date | string): boolean {
  return isAfter(new Date(matchDate), new Date());
}

export function generateLeagueCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getMatchResult(homeScore: number, awayScore: number): "HOME" | "AWAY" | "DRAW" {
  if (homeScore > awayScore) return "HOME";
  if (awayScore > homeScore) return "AWAY";
  return "DRAW";
}

export function getPredictionPoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): number {
  const predictedResult = getMatchResult(predictedHome, predictedAway);
  const actualResult = getMatchResult(actualHome, actualAway);

  if (predictedHome === actualHome && predictedAway === actualAway) {
    return 10; // Exact score
  }
  const predictedDiff = predictedHome - predictedAway;
  const actualDiff = actualHome - actualAway;
  if (predictedDiff === actualDiff && predictedResult !== "DRAW") {
    return 5; // Correct goal difference (non-draw)
  }
  if (predictedResult === actualResult) {
    return 3; // Correct winner/draw
  }
  return 0;
}

export function calculateOdds(
  homeStrength: number,
  awayStrength: number,
  betType: string
): number {
  const totalStrength = homeStrength + awayStrength;
  const homeProb = homeStrength / totalStrength;
  const awayProb = awayStrength / totalStrength;
  const drawProb = 0.28;
  const adjustedHomeProb = homeProb * (1 - drawProb);
  const adjustedAwayProb = awayProb * (1 - drawProb);

  const margin = 0.05; // bookmaker margin

  switch (betType) {
    case "HOME_WIN":
      return Math.max(1.1, +(1 / (adjustedHomeProb + margin)).toFixed(2));
    case "AWAY_WIN":
      return Math.max(1.1, +(1 / (adjustedAwayProb + margin)).toFixed(2));
    case "DRAW":
      return Math.max(2.0, +(1 / (drawProb + margin)).toFixed(2));
    case "EXACT_SCORE":
      return Math.max(5.0, +(15 / Math.max(homeStrength, awayStrength)).toFixed(2));
    default:
      return 2.0;
  }
}

export function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    GROUP_STAGE: "Group Stage",
    ROUND_OF_32: "Round of 32",
    ROUND_OF_16: "Round of 16",
    QUARTER_FINAL: "Quarter Final",
    SEMI_FINAL: "Semi Final",
    THIRD_PLACE: "3rd Place",
    FINAL: "Final",
  };
  return labels[stage] || stage;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "LIVE":
      return "text-red-400";
    case "COMPLETED":
      return "text-green-400";
    case "SCHEDULED":
      return "text-blue-400";
    case "POSTPONED":
    case "CANCELLED":
      return "text-gray-400";
    default:
      return "text-gray-400";
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "LIVE":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "COMPLETED":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "SCHEDULED":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

export function getRankIcon(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export function getPredictionLabel(winner: string): string {
  switch (winner) {
    case "HOME":
      return "Home Win";
    case "AWAY":
      return "Away Win";
    case "DRAW":
      return "Draw";
    default:
      return winner;
  }
}
