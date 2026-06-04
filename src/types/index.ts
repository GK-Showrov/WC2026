import type {
  User,
  Team,
  Fixture,
  Prediction,
  Bet,
  Wallet,
  Transaction,
  League,
  LeagueMember,
  Achievement,
  UserAchievement,
  Role,
  TournamentStage,
  MatchStatus,
  BetType,
  BetStatus,
  TransactionType,
  PredictionWinner,
} from "@prisma/client";

export type {
  User,
  Team,
  Fixture,
  Prediction,
  Bet,
  Wallet,
  Transaction,
  League,
  LeagueMember,
  Achievement,
  UserAchievement,
  Role,
  TournamentStage,
  MatchStatus,
  BetType,
  BetStatus,
  TransactionType,
  PredictionWinner,
};

export type SafeUser = Omit<User, "password"> & {
  wallet?: Wallet | null;
  _count?: {
    predictions: number;
    bets: number;
    leagueMemberships: number;
  };
};

export type FixtureWithTeams = Fixture & {
  homeTeam: Team;
  awayTeam: Team;
  predictions?: Prediction[];
  bets?: Bet[];
};

export type PredictionWithFixture = Prediction & {
  fixture: FixtureWithTeams;
};

export type BetWithFixture = Bet & {
  fixture: FixtureWithTeams;
  winnerTeam?: Team | null;
};

export type TransactionWithDetails = Transaction;

export type LeagueWithDetails = League & {
  owner: SafeUser;
  members: (LeagueMember & {
    user: SafeUser;
  })[];
  _count: {
    members: number;
  };
};

export type AchievementWithStatus = Achievement & {
  unlocked: boolean;
  unlockedAt?: Date | null;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  name: string | null;
  image: string | null;
  country: string | null;
  points: number;
  accuracy: number;
  correctPredictions: number;
  totalPredictions: number;
  walletBalance: number;
};

export type DashboardStats = {
  totalPoints: number;
  globalRank: number;
  predictionAccuracy: number;
  totalPredictions: number;
  correctPredictions: number;
  walletBalance: number;
  activeBets: number;
  totalWinnings: number;
  currentStreak: number;
  achievementsUnlocked: number;
};

export type NavItem = {
  title: string;
  href: string;
  icon: string;
  badge?: string | number;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
