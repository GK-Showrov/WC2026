import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      country: true,
      createdAt: true,
      wallet: { select: { balance: true, totalBets: true } },
      _count: { select: { predictions: true, bets: true } },
    },
  });

  return NextResponse.json({ users });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, action, value } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action required" }, { status: 400 });
    }

    switch (action) {
      case "SET_ROLE": {
        if (!["USER", "ADMIN"].includes(value)) {
          return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }
        await prisma.user.update({
          where: { id: userId },
          data: { role: value },
        });
        return NextResponse.json({ message: "Role updated" });
      }
      case "ADJUST_BALANCE": {
        const amount = parseFloat(value);
        if (isNaN(amount)) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        const wallet = await prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
        const newBalance = wallet.balance + amount;
        await prisma.wallet.update({
          where: { userId },
          data: { balance: newBalance },
        });
        await prisma.transaction.create({
          data: {
            walletId: wallet.id,
            userId,
            type: "ADMIN_ADJUSTMENT",
            amount,
            balance: newBalance,
            description: `Admin balance adjustment: ${amount > 0 ? "+" : ""}£${amount}`,
          },
        });
        return NextResponse.json({ message: "Balance adjusted" });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
