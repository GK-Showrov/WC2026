import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "global";
  const take = parseInt(searchParams.get("take") || "50");

  try {
    // Aggregate points per user
    const pointsAgg = await prisma.prediction.groupBy({
      by: ["userId"],
      _sum: { points: true },
      _count: { id: true },
      where: { pointsAwarded: true },
    });

    const correctCountAgg = await prisma.prediction.groupBy({
      by: ["userId"],
      _count: { id: true },
      where: {
        pointsAwarded: true,
        points: { gt: 0 },
      },
    });

    const correctMap = new Map(
      correctCountAgg.map((c) => [c.userId, c._count.id])
    );

    // Sort by points
    const sorted = pointsAgg
      .sort((a, b) => (b._sum.points || 0) - (a._sum.points || 0))
      .slice(0, take);

    const userIds = sorted.map((s) => s.userId);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        country: true,
        wallet: { select: { balance: true } },
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = sorted.map((entry, idx) => {
      const user = userMap.get(entry.userId);
      const totalPredictions = entry._count.id;
      const correctPredictions = correctMap.get(entry.userId) || 0;
      const accuracy = totalPredictions > 0
        ? Math.round((correctPredictions / totalPredictions) * 100)
        : 0;

      return {
        rank: idx + 1,
        userId: entry.userId,
        username: user?.username || "Unknown",
        name: user?.name || null,
        image: user?.image || null,
        country: user?.country || null,
        points: entry._sum.points || 0,
        accuracy,
        correctPredictions,
        totalPredictions,
        walletBalance: user?.wallet?.balance || 0,
      };
    });

    // Add weekly/monthly filters
    if (type === "betting") {
      const wallets = await prisma.wallet.findMany({
        orderBy: { totalWinnings: "desc" },
        take,
        include: {
          user: {
            select: { id: true, name: true, username: true, image: true, country: true },
          },
        },
      });

      const bettingLeaderboard = wallets.map((w, idx) => ({
        rank: idx + 1,
        userId: w.userId,
        username: w.user.username,
        name: w.user.name,
        image: w.user.image,
        country: w.user.country,
        points: 0,
        accuracy: w.totalBets > 0 ? Math.round((w.wonBets / w.totalBets) * 100) : 0,
        correctPredictions: w.wonBets,
        totalPredictions: w.totalBets,
        walletBalance: w.balance,
        totalWinnings: w.totalWinnings,
      }));

      return NextResponse.json({ leaderboard: bettingLeaderboard, type: "betting" });
    }

    return NextResponse.json({ leaderboard, type });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
