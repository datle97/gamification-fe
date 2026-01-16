import { useQuery } from '@tanstack/react-query'
import { gamesService } from '@/services/games.service'
import { appsService } from '@/services/apps.service'
import { rewardsService } from '@/services/rewards.service'
import type { Game } from '@/schemas/game.schema'
import { useRefetchInterval } from '@/hooks/useAutoRefresh'

interface GameStats {
  totalUsers: number
  activeToday: number
  activeLast7Days: number
}

interface GameWithStats extends Game {
  stats: GameStats
}

interface RecentWinner {
  gameId: string
  gameName: string
  gameCode: string
  userId: string
  userName: string | null
  score: number
  period: string
  periodType: string
}

interface RewardsDistributionSummary {
  totalDistributed: number
  byGame: Array<{
    gameId: string
    gameName: string
    gameCode: string
    count: number
    quota: number | null
    quotaUsage: number | null // percentage of quota used
  }>
}

interface DashboardStats {
  totalGames: number
  activeGames: number
  totalApps: number
  totalUsers: number
  activeUsersToday: number
  activeUsersLast7Days: number
  topGames: Array<{
    gameId: string
    code: string
    name: string
    type: string
    totalUsers: number
    activeToday: number
    activeLast7Days: number
    isActive: boolean
  }>
  recentWinners: RecentWinner[]
  rewardsDistribution: RewardsDistributionSummary
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  // Fetch all basic data in parallel
  const [games, apps] = await Promise.all([
    gamesService.getAll(),
    appsService.getAll(),
  ])

  // Fetch stats for each game in parallel
  const gamesWithStats = await Promise.all(
    games.map(async (game): Promise<GameWithStats> => {
      try {
        const stats = await gamesService.getGameStats(game.gameId)
        return { ...game, stats }
      } catch {
        return {
          ...game,
          stats: { totalUsers: 0, activeToday: 0, activeLast7Days: 0 },
        }
      }
    })
  )

  // Fetch leaderboard winners for games with leaderboard config
  const gamesWithLeaderboard = games.filter((g) => g.config?.leaderboard)
  const leaderboardResults = await Promise.all(
    gamesWithLeaderboard.map(async (game) => {
      try {
        const leaderboard = await gamesService.getLeaderboard(game.gameId)
        if (leaderboard?.entries?.length > 0) {
          const winner = leaderboard.entries[0]
          return {
            gameId: game.gameId,
            gameName: game.name,
            gameCode: game.code,
            userId: winner.userId,
            userName: winner.userName,
            score: winner.score,
            period: leaderboard.period.period,
            periodType: leaderboard.period.periodType,
          } as RecentWinner
        }
        return null
      } catch {
        return null
      }
    })
  )
  const recentWinners = leaderboardResults.filter((w): w is RecentWinner => w !== null)

  // Fetch rewards distribution for all games and aggregate by game
  const distributionResults = await Promise.all(
    games.map(async (game) => {
      try {
        const distribution = await rewardsService.getDistribution(game.gameId)
        const gameTotal = distribution.reduce((sum, d) => sum + d.actualCount, 0)
        // Sum quota (only for rewards that have quota set)
        const totalQuota = distribution.reduce((sum, d) => sum + (d.quota || 0), 0)
        const hasQuota = distribution.some((d) => d.quota !== null && d.quota > 0)
        // Calculate usage percentage based on actualCount vs quota
        const usagePercent = hasQuota && totalQuota > 0 ? (gameTotal / totalQuota) * 100 : null

        return {
          gameId: game.gameId,
          gameName: game.name,
          gameCode: game.code,
          count: gameTotal,
          quota: hasQuota ? totalQuota : null,
          quotaUsage: usagePercent !== null ? (usagePercent < 1 && usagePercent > 0 ? 1 : Math.round(usagePercent)) : null,
        }
      } catch {
        return {
          gameId: game.gameId,
          gameName: game.name,
          gameCode: game.code,
          count: 0,
          quota: null,
          quotaUsage: null,
        }
      }
    })
  )

  // Calculate total
  const totalDistributed = distributionResults.reduce((sum, g) => sum + g.count, 0)

  const byGame = distributionResults
    .filter((g) => g.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Calculate aggregated stats
  const totalUsers = gamesWithStats.reduce((sum, game) => sum + game.stats.totalUsers, 0)
  const activeUsersToday = gamesWithStats.reduce((sum, game) => sum + game.stats.activeToday, 0)
  const activeUsersLast7Days = gamesWithStats.reduce((sum, game) => sum + game.stats.activeLast7Days, 0)

  // Determine active games
  const now = new Date()
  const activeGames = games.filter((game) => {
    const hasStarted = !game.startAt || new Date(game.startAt) <= now
    const notEnded = !game.endAt || new Date(game.endAt) >= now
    return hasStarted && notEnded
  }).length

  // Sort games by total users and get top games
  const topGames = gamesWithStats
    .sort((a, b) => b.stats.totalUsers - a.stats.totalUsers)
    .slice(0, 10)
    .map((game) => {
      const hasStarted = !game.startAt || new Date(game.startAt) <= now
      const notEnded = !game.endAt || new Date(game.endAt) >= now
      return {
        gameId: game.gameId,
        code: game.code,
        name: game.name,
        type: game.type || '',
        totalUsers: game.stats.totalUsers,
        activeToday: game.stats.activeToday,
        activeLast7Days: game.stats.activeLast7Days,
        isActive: hasStarted && notEnded,
      }
    })

  return {
    totalGames: games.length,
    activeGames,
    totalApps: apps.length,
    totalUsers,
    activeUsersToday,
    activeUsersLast7Days,
    topGames,
    recentWinners,
    rewardsDistribution: {
      totalDistributed,
      byGame,
    },
  }
}

export function useDashboardStats() {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval,
  })
}
