import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, username: true, image: true } },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              country: true,
              predictions: {
                where: { pointsAwarded: true },
                select: { points: true },
              },
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { members: true } },
    },
  });

  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });

  const isMember = league.members.some((m) => m.userId === session.user.id);
  if (!isMember && !league.isPublic) {
    return NextResponse.json({ error: "You are not a member of this league" }, { status: 403 });
  }

  const leaderboard = league.members
    .map((member) => ({
      userId: member.user.id,
      username: member.user.username,
      name: member.user.name,
      image: member.user.image,
      country: member.user.country,
      points: member.user.predictions.reduce((sum, p) => sum + p.points, 0),
      joinedAt: member.joinedAt,
    }))
    .sort((a, b) => b.points - a.points)
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

  return NextResponse.json({ league: { ...league, leaderboard } });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });
  if (league.ownerId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await prisma.league.delete({ where: { id } });
  return NextResponse.json({ message: "League deleted" });
}
