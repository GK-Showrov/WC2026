import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "League code required" }, { status: 400 });

    const league = await prisma.league.findUnique({
      where: { code: code.toUpperCase() },
      include: { _count: { select: { members: true } } },
    });

    if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });
    if (league._count.members >= league.maxMembers) {
      return NextResponse.json({ error: "League is full" }, { status: 400 });
    }

    const alreadyMember = await prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId: league.id, userId: session.user.id } },
    });
    if (alreadyMember) {
      return NextResponse.json({ error: "You are already a member of this league" }, { status: 400 });
    }

    await prisma.leagueMember.create({
      data: { leagueId: league.id, userId: session.user.id },
    });

    return NextResponse.json({ league, message: "Successfully joined league" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to join league" }, { status: 500 });
  }
}
