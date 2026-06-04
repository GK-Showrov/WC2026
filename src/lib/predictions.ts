import { prisma } from "@/lib/db";
import { getPredictionPoints, getMatchResult } from "@/lib/utils";

export async function awardPredictionPoints(fixtureId: string) {
  const fixture = await prisma.fixture.findUnique({
    where: { id: fixtureId },
    include: { predictions: true },
  });

  if (!fixture || fixture.homeScore === null || fixture.awayScore === null) {
    return;
  }

  const predictions = await prisma.prediction.findMany({
    where: { fixtureId, pointsAwarded: false },
  });

  for (const prediction of predictions) {
    const points = getPredictionPoints(
      prediction.predictedHome,
      prediction.predictedAway,
      fixture.homeScore,
      fixture.awayScore
    );

    await prisma.prediction.update({
      where: { id: prediction.id },
      data: { points, pointsAwarded: true },
    });
  }

  await checkAchievements(fixtureId);
}

export async function getUserPredictionStats(userId: string) {
  const predictions = await prisma.prediction.findMany({
    where: { userId, pointsAwarded: true },
    include: { fixture: true },
  });

  const totalPredictions = predictions.length;
  const correctWinner = predictions.filter((p) => {
    if (p.fixture.homeScore === null || p.fixture.awayScore === null) return false;
    const predicted = getMatchResult(p.predictedHome, p.predictedAway);
    const actual = getMatchResult(p.fixture.homeScore, p.fixture.awayScore);
    return predicted === actual;
  }).length;

  const exactScores = predictions.filter(
    (p) =>
      p.fixture.homeScore !== null &&
      p.fixture.awayScore !== null &&
      p.predictedHome === p.fixture.homeScore &&
      p.predictedAway === p.fixture.awayScore
  ).length;

  const totalPoints = predictions.reduce((sum, p) => sum + p.points, 0);
  const accuracy =
    totalPredictions > 0 ? Math.round((correctWinner / totalPredictions) * 100) : 0;

  return {
    totalPredictions,
    correctWinner,
    exactScores,
    totalPoints,
    accuracy,
  };
}

export async function calculateCurrentStreak(userId: string): Promise<number> {
  const predictions = await prisma.prediction.findMany({
    where: { userId, pointsAwarded: true },
    include: { fixture: true },
    orderBy: { fixture: { matchDate: "desc" } },
  });

  let streak = 0;
  for (const prediction of predictions) {
    if (prediction.fixture.homeScore === null || prediction.fixture.awayScore === null) {
      continue;
    }
    const predicted = getMatchResult(prediction.predictedHome, prediction.predictedAway);
    const actual = getMatchResult(prediction.fixture.homeScore, prediction.fixture.awayScore);
    if (predicted === actual) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

async function checkAchievements(fixtureId: string) {
  const predictions = await prisma.prediction.findMany({
    where: { fixtureId },
    select: { userId: true },
    distinct: ["userId"],
  });

  for (const { userId } of predictions) {
    const stats = await getUserPredictionStats(userId);
    const streak = await calculateCurrentStreak(userId);

    const achievements = await prisma.achievement.findMany({
      where: { category: "PREDICTIONS" },
    });

    for (const achievement of achievements) {
      const alreadyUnlocked = await prisma.userAchievement.findFirst({
        where: { userId, achievementId: achievement.id },
      });
      if (alreadyUnlocked) continue;

      let shouldUnlock = false;
      if (achievement.name === "First Prediction" && stats.totalPredictions >= 1) shouldUnlock = true;
      if (achievement.name === "Prediction Rookie" && stats.correctWinner >= 10) shouldUnlock = true;
      if (achievement.name === "Prediction Pro" && stats.correctWinner >= 25) shouldUnlock = true;
      if (achievement.name === "Hot Streak" && streak >= 5) shouldUnlock = true;
      if (achievement.name === "Unstoppable" && streak >= 10) shouldUnlock = true;
      if (achievement.name === "Exact Score King" && stats.exactScores >= 5) shouldUnlock = true;
      if (achievement.name === "World Cup Expert" && stats.totalPoints >= 1000) shouldUnlock = true;

      if (shouldUnlock) {
        await prisma.userAchievement.create({
          data: { userId, achievementId: achievement.id },
        });
      }
    }
  }
}
