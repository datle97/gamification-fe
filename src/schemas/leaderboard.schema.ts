import { z } from 'zod'

// Leaderboard entry schema
export const leaderboardEntrySchema = z.object({
  rank: z.number(),
  userId: z.string(),
  userName: z.string().optional(),
  userEmail: z.string().optional(),
  score: z.number(),
  plays: z.number(),
  lastActiveAt: z.string().optional(),
})

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>

// Period info schema
export const periodInfoSchema = z.object({
  period: z.string(), // e.g., "2026-W03", "2026-01", "2026-01-16"
  periodType: z.string(), // daily, weekly_mon, monthly, etc.
  startDate: z.string(),
  endDate: z.string(),
  isCurrent: z.boolean().default(false),
})

export type PeriodInfo = z.infer<typeof periodInfoSchema>

// Leaderboard response schema
export const leaderboardResponseSchema = z.object({
  period: periodInfoSchema,
  entries: z.array(leaderboardEntrySchema),
  stats: z.object({
    totalParticipants: z.number(),
    topScore: z.number(),
    averageScore: z.number(),
    mostActivePlayer: z
      .object({
        userId: z.string(),
        userName: z.string().optional(),
        plays: z.number(),
      })
      .optional(),
  }),
})

export type LeaderboardResponse = z.infer<typeof leaderboardResponseSchema>

// Historical periods list
export const historicalPeriodsSchema = z.array(periodInfoSchema)

export type HistoricalPeriods = z.infer<typeof historicalPeriodsSchema>
