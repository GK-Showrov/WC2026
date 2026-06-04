import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { updateProfileSchema } from "@/lib/validations";
import { ensureWallet } from "@/lib/wallet";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      country: true,
      bio: true,
      role: true,
      createdAt: true,
      wallet: true,
      _count: {
        select: {
          predictions: true,
          bets: true,
          leagueMemberships: true,
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Ensure wallet exists — creates with £1,000 if missing
  await ensureWallet(session.user.id);

  // Re-fetch user with guaranteed wallet
  const userWithWallet = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, username: true, email: true, image: true,
      country: true, bio: true, role: true, createdAt: true,
      wallet: true,
      _count: { select: { predictions: true, bets: true, leagueMemberships: true } },
    },
  });

  const predStats = await prisma.prediction.aggregate({
    where: { userId: session.user.id, pointsAwarded: true },
    _sum: { points: true },
    _count: { id: true },
  });

  const correctPredictions = await prisma.prediction.count({
    where: { userId: session.user.id, pointsAwarded: true, points: { gt: 0 } },
  });

  const achievements = await prisma.userAchievement.findMany({
    where: { userId: session.user.id },
    include: { achievement: true },
    orderBy: { unlockedAt: "desc" },
  });

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    user: userWithWallet ?? user,
    stats: {
      totalPoints: predStats._sum.points || 0,
      totalPredictions: predStats._count.id || 0,
      correctPredictions,
      accuracy: predStats._count.id > 0
        ? Math.round((correctPredictions / predStats._count.id) * 100)
        : 0,
    },
    achievements,
    transactions,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const validated = updateProfileSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.errors[0].message }, { status: 400 });
    }

    if (validated.data.username) {
      const existing = await prisma.user.findFirst({
        where: {
          username: validated.data.username,
          NOT: { id: session.user.id },
        },
      });
      if (existing) {
        return NextResponse.json({ error: "Username already taken" }, { status: 400 });
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validated.data.name,
        username: validated.data.username,
        country: validated.data.country,
        bio: validated.data.bio,
      },
      select: { id: true, name: true, username: true, country: true, bio: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
