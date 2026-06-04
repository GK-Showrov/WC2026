import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createLeagueSchema } from "@/lib/validations";
import { generateLeagueCode } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leagues = await prisma.league.findMany({
    where: {
      members: { some: { userId: session.user.id } },
    },
    include: {
      owner: { select: { id: true, name: true, username: true, image: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ leagues });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const validated = createLeagueSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.errors[0].message }, { status: 400 });
    }

    let code = generateLeagueCode();
    let codeExists = await prisma.league.findUnique({ where: { code } });
    while (codeExists) {
      code = generateLeagueCode();
      codeExists = await prisma.league.findUnique({ where: { code } });
    }

    const league = await prisma.$transaction(async (tx) => {
      const newLeague = await tx.league.create({
        data: {
          name: validated.data.name,
          description: validated.data.description,
          code,
          ownerId: session.user.id,
          isPublic: validated.data.isPublic,
          maxMembers: validated.data.maxMembers,
        },
      });

      await tx.leagueMember.create({
        data: { leagueId: newLeague.id, userId: session.user.id },
      });

      return newLeague;
    });

    return NextResponse.json({ league }, { status: 201 });
  } catch (error) {
    console.error("Create league error:", error);
    return NextResponse.json({ error: "Failed to create league" }, { status: 500 });
  }
}
