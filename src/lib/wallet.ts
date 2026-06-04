import { prisma } from "@/lib/db";

/**
 * Get a user's wallet, creating it with £1,000 if it doesn't exist.
 * Safe to call multiple times — uses a transaction to avoid race conditions.
 */
export async function ensureWallet(userId: string) {
  const existing = await prisma.wallet.findUnique({ where: { userId } });
  if (existing) return existing;

  return prisma.$transaction(async (tx) => {
    // Double-check inside the transaction
    const check = await tx.wallet.findUnique({ where: { userId } });
    if (check) return check;

    const wallet = await tx.wallet.create({
      data: { userId, balance: 1000 },
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: "INITIAL_DEPOSIT",
        amount: 1000,
        balance: 1000,
        description: "Welcome bonus — £1,000 virtual currency",
      },
    });

    return wallet;
  });
}
