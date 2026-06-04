import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  country: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const predictionSchema = z.object({
  fixtureId: z.string().cuid(),
  predictedHome: z.number().int().min(0).max(20),
  predictedAway: z.number().int().min(0).max(20),
});

export const betSchema = z.object({
  fixtureId: z.string().cuid(),
  betType: z.enum(["MATCH_WINNER", "DRAW", "EXACT_SCORE", "TOURNAMENT_WINNER", "GROUP_WINNER", "GOLDEN_BOOT"]),
  amount: z.number().min(1, "Minimum bet is £1").max(10000, "Maximum bet is £10,000"),
  predictedHome: z.number().int().min(0).max(20).optional(),
  predictedAway: z.number().int().min(0).max(20).optional(),
  winnerTeamId: z.string().cuid().optional(),
});

export const createLeagueSchema = z.object({
  name: z.string().min(3, "League name must be at least 3 characters").max(50),
  description: z.string().max(200).optional(),
  isPublic: z.boolean().default(false),
  maxMembers: z.number().int().min(2).max(100).default(50),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  country: z.string().optional(),
  bio: z.string().max(200).optional(),
});

export const fixtureResultSchema = z.object({
  homeScore: z.number().int().min(0).max(30),
  awayScore: z.number().int().min(0).max(30),
  status: z.enum(["COMPLETED", "LIVE", "POSTPONED"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PredictionInput = z.infer<typeof predictionSchema>;
export type BetInput = z.infer<typeof betSchema>;
export type CreateLeagueInput = z.infer<typeof createLeagueSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
