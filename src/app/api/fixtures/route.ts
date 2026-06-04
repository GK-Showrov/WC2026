import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const group = searchParams.get("group");
    const stage = searchParams.get("stage");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: Record<string, unknown> = {};

    if (group) where.group = group;
    if (stage) where.stage = stage;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { homeTeam: { name: { contains: search, mode: "insensitive" } } },
        { awayTeam: { name: { contains: search, mode: "insensitive" } } },
        { stadium: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    const fixtures = await prisma.fixture.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        _count: { select: { predictions: true, bets: true } },
      },
      orderBy: { matchDate: "asc" },
      take: limit,
    });

    // Attach user predictions if authenticated
    const session = await auth();
    let predictions: Record<string, { predictedHome: number; predictedAway: number; points: number }> = {};

    if (session?.user?.id) {
      const userPredictions = await prisma.prediction.findMany({
        where: {
          userId: session.user.id,
          fixtureId: { in: fixtures.map((f) => f.id) },
        },
      });
      predictions = Object.fromEntries(
        userPredictions.map((p) => [
          p.fixtureId,
          { predictedHome: p.predictedHome, predictedAway: p.predictedAway, points: p.points },
        ])
      );
    }

    return NextResponse.json({
      fixtures: fixtures.map((f) => ({
        ...f,
        userPrediction: predictions[f.id] || null,
      })),
    });
  } catch (error) {
    console.error("Fixtures fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch fixtures" }, { status: 500 });
  }
}
