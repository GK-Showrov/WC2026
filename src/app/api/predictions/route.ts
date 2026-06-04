import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { predictionSchema } from "@/lib/validations";
import { isMatchLocked } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fixtureId = searchParams.get("fixtureId");

  const where: Record<string, unknown> = { userId: session.user.id };
  if (fixtureId) where.fixtureId = fixtureId;

  const predictions = await prisma.prediction.findMany({
    where,
    include: {
      fixture: {
        include: { homeTeam: true, awayTeam: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ predictions });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const validated = predictionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { fixtureId, predictedHome, predictedAway } = validated.data;

    const fixture = await prisma.fixture.findUnique({ where: { id: fixtureId } });
    if (!fixture) return NextResponse.json({ error: "Fixture not found" }, { status: 404 });

    if (isMatchLocked(fixture.matchDate)) {
      return NextResponse.json({ error: "Predictions are locked — match has started" }, { status: 400 });
    }

    if (fixture.status !== "SCHEDULED") {
      return NextResponse.json({ error: "Predictions are closed for this match" }, { status: 400 });
    }

    // Determine predicted winner
    let winner: "HOME" | "AWAY" | "DRAW";
    if (predictedHome > predictedAway) winner = "HOME";
    else if (predictedAway > predictedHome) winner = "AWAY";
    else winner = "DRAW";

    const prediction = await prisma.prediction.upsert({
      where: { userId_fixtureId: { userId: session.user.id, fixtureId } },
      update: { predictedHome, predictedAway, winner },
      create: {
        userId: session.user.id,
        fixtureId,
        predictedHome,
        predictedAway,
        winner,
      },
    });

    // Award first prediction achievement
    const firstPredAchievement = await prisma.achievement.findFirst({
      where: { name: "First Prediction" },
    });
    if (firstPredAchievement) {
      await prisma.userAchievement.upsert({
        where: { userId_achievementId: { userId: session.user.id, achievementId: firstPredAchievement.id } },
        update: {},
        create: { userId: session.user.id, achievementId: firstPredAchievement.id },
      });
    }

    return NextResponse.json({ prediction }, { status: 201 });
  } catch (error) {
    console.error("Prediction error:", error);
    return NextResponse.json({ error: "Failed to save prediction" }, { status: 500 });
  }
}
