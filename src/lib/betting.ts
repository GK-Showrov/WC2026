import { prisma } from "@/lib/db";
import { calculateOdds, getMatchResult } from "@/lib/utils";
import { BetType, BetStatus, TransactionType, MatchStatus } from "@prisma/client";

export async function placeBet(
  userId: string,
  fixtureId: string,
  betType: BetType,
  amount: number,
  additionalData?: {
    predictedHome?: number;
    predictedAway?: number;
    winnerTeamId?: string;
  }
) {
  const fixture = await prisma.fixture.findUnique({
    where: { id: fixtureId },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  if (!fixture) throw new Error("Fixture not found");
  if (fixture.status !== MatchStatus.SCHEDULED) throw new Error("Betting is closed for this match");

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error("Wallet not found");
  if (wallet.balance < amount) throw new Error("Insufficient balance");
  if (amount < 1) throw new Error("Minimum bet is £1");
  if (amount > 10000) throw new Error("Maximum bet is £10,000");

  const odds = calculateOdds(
    fixture.homeTeam.strength,
    fixture.awayTeam.strength,
    betType === BetType.MATCH_WINNER ? "HOME_WIN" :
    betType === BetType.DRAW ? "DRAW" :
    betType === BetType.EXACT_SCORE ? "EXACT_SCORE" : "HOME_WIN"
  );

  const potentialWinning = +(amount * odds).toFixed(2);

  const bet = await prisma.$transaction(async (tx) => {
    const newBet = await tx.bet.create({
      data: {
        userId,
        fixtureId,
        betType,
        amount,
        odds,
        potentialWinning,
        predictedHome: additionalData?.predictedHome ?? null,
        predictedAway: additionalData?.predictedAway ?? null,
        winnerTeamId: additionalData?.winnerTeamId ?? null,
        status: BetStatus.PENDING,
      },
    });

    const newBalance = wallet.balance - amount;
    await tx.wallet.update({
      where: { userId },
      data: {
        balance: newBalance,
        totalBets: { increment: 1 },
      },
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: TransactionType.BET_PLACED,
        amount: -amount,
        balance: newBalance,
        description: `Bet placed on ${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`,
        betId: newBet.id,
      },
    });

    return newBet;
  });

  return bet;
}

export async function settleBets(fixtureId: string) {
  const fixture = await prisma.fixture.findUnique({
    where: { id: fixtureId },
    include: { homeTeam: true, awayTeam: true },
  });

  if (!fixture || fixture.homeScore === null || fixture.awayScore === null) {
    return;
  }

  const bets = await prisma.bet.findMany({
    where: { fixtureId, status: BetStatus.PENDING },
  });

  const actualResult = getMatchResult(fixture.homeScore, fixture.awayScore);

  for (const bet of bets) {
    let won = false;

    switch (bet.betType) {
      case BetType.MATCH_WINNER:
        if (actualResult === "HOME") won = bet.winnerTeamId === fixture.homeTeamId;
        if (actualResult === "AWAY") won = bet.winnerTeamId === fixture.awayTeamId;
        break;
      case BetType.DRAW:
        won = actualResult === "DRAW";
        break;
      case BetType.EXACT_SCORE:
        won =
          bet.predictedHome === fixture.homeScore &&
          bet.predictedAway === fixture.awayScore;
        break;
    }

    const status = won ? BetStatus.WON : BetStatus.LOST;

    await prisma.$transaction(async (tx) => {
      await tx.bet.update({
        where: { id: bet.id },
        data: { status, settledAt: new Date() },
      });

      const wallet = await tx.wallet.findUnique({ where: { userId: bet.userId } });
      if (!wallet) return;

      if (won) {
        const newBalance = wallet.balance + bet.potentialWinning;
        const profit = bet.potentialWinning - bet.amount;
        await tx.wallet.update({
          where: { userId: bet.userId },
          data: {
            balance: newBalance,
            totalWinnings: { increment: bet.potentialWinning },
            wonBets: { increment: 1 },
          },
        });
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            userId: bet.userId,
            type: TransactionType.BET_WON,
            amount: bet.potentialWinning,
            balance: newBalance,
            description: `Bet won: ${fixture.homeTeam.name} vs ${fixture.awayTeam.name} (+£${profit.toFixed(2)} profit)`,
            betId: bet.id,
          },
        });
      } else {
        await tx.wallet.update({
          where: { userId: bet.userId },
          data: { totalLosses: { increment: bet.amount } },
        });
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            userId: bet.userId,
            type: TransactionType.BET_LOST,
            amount: 0,
            balance: wallet.balance,
            description: `Bet lost: ${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`,
            betId: bet.id,
          },
        });
      }
    });
  }

  await checkBettingAchievements(fixtureId);
}

async function checkBettingAchievements(fixtureId: string) {
  const bets = await prisma.bet.findMany({
    where: { fixtureId },
    select: { userId: true },
    distinct: ["userId"],
  });

  for (const { userId } of bets) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) continue;

    const achievements = await prisma.achievement.findMany({
      where: { category: "BETTING" },
    });

    for (const achievement of achievements) {
      const alreadyUnlocked = await prisma.userAchievement.findFirst({
        where: { userId, achievementId: achievement.id },
      });
      if (alreadyUnlocked) continue;

      let shouldUnlock = false;
      if (achievement.name === "First Bet" && wallet.totalBets >= 1) shouldUnlock = true;
      if (achievement.name === "Millionaire" && wallet.balance >= 2000) shouldUnlock = true;

      if (shouldUnlock) {
        await prisma.userAchievement.create({
          data: { userId, achievementId: achievement.id },
        });
      }
    }
  }
}
