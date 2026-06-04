import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureWallet } from "@/lib/wallet";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wallet = await ensureWallet(session.user.id);
  return NextResponse.json({ balance: wallet.balance });
}
