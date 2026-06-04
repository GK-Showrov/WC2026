import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getUserPredictionStats } from "@/lib/predictions";
import { calculateCurrentStreak } from "@/lib/predictions";
import { ensureWallet } from "@/lib/wallet";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user.id;

  const [user, wallet, activeBets, recentPredictions, upcomingFixtures, achievements] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, username: true, image: true, country: true, createdAt: true },
      }),
      ensureWallet(userId),
      prisma.bet.count({ where: { userId, status: "PENDING" } }),
      prisma.prediction.findMany({
        where: { userId, pointsAwarded: true },
        include: {
          fixture: {
            include: { homeTeam: true, awayTeam: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.fixture.findMany({
        where: {
          status: "SCHEDULED",
          matchDate: { gte: new Date() },
        },
        include: { homeTeam: true, awayTeam: true },
        orderBy: { matchDate: "asc" },
        take: 4,
      }),
      prisma.userAchievement.count({ where: { userId } }),
    ]);

  const predStats = await getUserPredictionStats(userId);
  const streak = await calculateCurrentStreak(userId);

  // Calculate global rank
  const usersWithMorePoints = await prisma.prediction.groupBy({
    by: ["userId"],
    _sum: { points: true },
    having: { points: { _sum: { gt: predStats.totalPoints } } },
  });
  const globalRank = usersWithMorePoints.length + 1;

  return (
    <DashboardClient
      user={user}
      wallet={wallet}
      stats={{
        totalPoints: predStats.totalPoints,
        globalRank,
        predictionAccuracy: predStats.accuracy,
        totalPredictions: predStats.totalPredictions,
        correctPredictions: predStats.correctWinner,
        walletBalance: wallet?.balance ?? 0,
        activeBets,
        totalWinnings: wallet?.totalWinnings ?? 0,
        currentStreak: streak,
        achievementsUnlocked: achievements,
      }}
      recentPredictions={recentPredictions}
      upcomingFixtures={upcomingFixtures}
    />
  );
}
