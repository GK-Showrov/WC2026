import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { betSchema } from "@/lib/validations";
import { placeBet } from "@/lib/betting";
import { BetType } from "@prisma/client";
import { ensureWallet } from "@/lib/wallet";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureWallet(session.user.id);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const take = parseInt(searchParams.get("take") || "50");

  const bets = await prisma.bet.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status: status as "PENDING" | "WON" | "LOST" | "VOID" } : {}),
    },
    include: {
      fixture: { include: { homeTeam: true, awayTeam: true } },
      winnerTeam: true,
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } });

  return NextResponse.json({ bets, wallet });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const validated = betSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.errors[0].message }, { status: 400 });
    }

    const bet = await placeBet(
      session.user.id,
      validated.data.fixtureId,
      validated.data.betType as BetType,
      validated.data.amount,
      {
        predictedHome: validated.data.predictedHome,
        predictedAway: validated.data.predictedAway,
        winnerTeamId: validated.data.winnerTeamId,
      }
    );

    return NextResponse.json({ bet }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to place bet";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
