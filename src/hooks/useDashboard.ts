import { useQuery } from '@tanstack/react-query'
import { gamesService } from '@/services/games.service'
import { appsService } from '@/services/apps.service'
import { linksService } from '@/services/links.service'
import type { Game } from '@/schemas/game.schema'

interface GameStats {
  totalUsers: number
  activeToday: number
  activeLast7Days: number
}

interface GameWithStats extends Game {
  stats: GameStats
}

interface DashboardStats {
  totalGames: number
  activeGames: number
  totalApps: number
  totalLinks: number
  totalUsers: number
  activeUsersToday: number
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
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  // Fetch all basic data in parallel
  const [games, apps, links] = await Promise.all([
    gamesService.getAll(),
    appsService.getAll(),
    linksService.getAll(),
  ])

  // Fetch stats for each game in parallel
  const gamesWithStats = await Promise.all(
    games.map(async (game): Promise<GameWithStats> => {
      try {
        const stats = await gamesService.getGameStats(game.gameId)
        return { ...game, stats }
      } catch {
        // If stats fetch fails, return zero stats
        return {
          ...game,
          stats: { totalUsers: 0, activeToday: 0, activeLast7Days: 0 },
        }
      }
    })
  )

  // Calculate aggregated stats
  const totalUsers = gamesWithStats.reduce((sum, game) => sum + game.stats.totalUsers, 0)
  const activeUsersToday = gamesWithStats.reduce((sum, game) => sum + game.stats.activeToday, 0)

  // Determine active games (has start date before now and either no end date or end date after now)
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
        type: game.type,
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
    totalLinks: links.length,
    totalUsers,
    activeUsersToday,
    topGames,
  }
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
