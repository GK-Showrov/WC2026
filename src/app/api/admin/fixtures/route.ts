import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { fixtureResultSchema } from "@/lib/validations";
import { awardPredictionPoints } from "@/lib/predictions";
import { settleBets } from "@/lib/betting";
import { MatchStatus } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const fixtures = await prisma.fixture.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
      _count: { select: { predictions: true, bets: true } },
    },
    orderBy: { matchDate: "asc" },
  });

  return NextResponse.json({ fixtures });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { fixtureId, ...rest } = body;
    const validated = fixtureResultSchema.safeParse(rest);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.errors[0].message }, { status: 400 });
    }

    const { homeScore, awayScore, status } = validated.data;

    const fixture = await prisma.fixture.update({
      where: { id: fixtureId },
      data: {
        homeScore,
        awayScore,
        status: status as MatchStatus,
        updatedAt: new Date(),
      },
    });

    if (status === "COMPLETED") {
      await awardPredictionPoints(fixtureId);
      await settleBets(fixtureId);
    }

    return NextResponse.json({ fixture, message: "Fixture updated successfully" });
  } catch (error) {
    console.error("Admin fixture update error:", error);
    return NextResponse.json({ error: "Failed to update fixture" }, { status: 500 });
  }
}
