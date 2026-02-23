import { AppSidebar } from '@/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useApp } from '@/hooks/queries/useApps'
import { useGameUserDetail } from '@/hooks/queries/useGameUsers'
import { useGame } from '@/hooks/queries/useGames'
import type { App } from '@/schemas/app.schema'
import type { Game } from '@/schemas/game.schema'
import type { GameUser } from '@/services/game-users.service'
import { Fragment, useMemo } from 'react'
import { Link, Outlet, useLocation } from 'react-router'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/games': 'Games',
  '/games/new': 'New Game',
  '/apps': 'Apps',
  '/apps/new': 'New App',
  '/settings': 'Settings',
}

// Check if string looks like a UUID or long hash
function isLongId(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) || str.length > 32
}

// Entity resolver configuration - maps parent segment to display name extraction
const entityResolvers: Record<
  string,
  {
    getDisplayName: (data: { game?: Game; app?: App; user?: GameUser }) => string | undefined
    getFullName: (data: { game?: Game; app?: App; user?: GameUser }) => string | undefined
    isLoading: (loading: { game: boolean; app: boolean; user: boolean }) => boolean
    // Optional: custom href for the parent "list" segment (e.g., "users" -> game?tab=users)
    parentHref?: (segments: string[], index: number) => string | undefined
    // Optional: custom ID detection (for short IDs like appId)
    isId?: (segment: string) => boolean
  }
> = {
  games: {
    getDisplayName: ({ game }) => game?.name || game?.code,
    getFullName: ({ game }) => (game?.name ? `${game.name} (${game.code})` : undefined),
    isLoading: ({ game }) => game,
  },
  apps: {
    getDisplayName: ({ app }) => app?.name,
    getFullName: () => undefined,
    isLoading: ({ app }) => app,
    isId: (segment) => !['new'].includes(segment),
  },
  users: {
    getDisplayName: ({ user }) => user?.user?.displayName || user?.user?.phone,
    getFullName: ({ user }) =>
      user?.user?.displayName
        ? `${user.user.displayName}${user.user.phone ? ` (${user.user.phone})` : ''}`
        : undefined,
    isLoading: ({ user }) => user,
    parentHref: (segments, index) => {
      // "users" segment should link to game?tab=users
      if (index >= 2 && segments[index - 2] === 'games') {
        return `/games/${segments[index - 1]}?tab=users`
      }
      return undefined
    },
  },
}

// Parse pathname to extract entity IDs dynamically
function parsePathIds(pathname: string): Record<string, string> {
  const segments = pathname.split('/').filter(Boolean)
  const ids: Record<string, string> = {}

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const prevSegment = segments[i - 1]

    if (prevSegment && entityResolvers[prevSegment]) {
      const resolver = entityResolvers[prevSegment]
      const matchesId = resolver.isId ? resolver.isId(segment) : isLongId(segment)
      if (matchesId) {
        ids[prevSegment] = segment
      }
    }
  }

  return ids
}

interface BreadcrumbData {
  label: string | null // null means loading
  fullLabel?: string
  href?: string
}

function useBreadcrumbs(pathname: string): BreadcrumbData[] {
  const ids = parsePathIds(pathname)

  // Use queries - enabled only when ID exists
  const { data: game, isLoading: gameLoading } = useGame(ids.games || '')
  const { data: app, isLoading: appLoading } = useApp(ids.apps || '')
  const { data: user, isLoading: userLoading } = useGameUserDetail(ids.games || '', ids.users || '')

  return useMemo(() => {
    const loadingState = {
      game: gameLoading && !!ids.games,
      app: appLoading && !!ids.apps,
      user: userLoading && !!ids.users,
    }
    const entityData = { game, app, user }
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbData[] = []

    let currentPath = ''
    for (let i = 0; i < segments.length; i++) {
      currentPath += `/${segments[i]}`
      const isLast = i === segments.length - 1
      const segment = segments[i]
      const prevSegment = segments[i - 1]

      // Check if this is a "list" segment that has a custom parent href
      const resolver = entityResolvers[segment]
      if (resolver?.parentHref) {
        const customHref = resolver.parentHref(segments, i)
        if (customHref) {
          breadcrumbs.push({
            label: segment.charAt(0).toUpperCase() + segment.slice(1),
            href: isLast ? undefined : customHref,
          })
          continue
        }
      }

      // Get title from pageTitles or resolve dynamically
      let title: string | null = pageTitles[currentPath] || null
      let fullTitle: string | undefined

      if (!title) {
        if (prevSegment && entityResolvers[prevSegment]) {
          const entityResolver = entityResolvers[prevSegment]
          const matchesId = entityResolver.isId ? entityResolver.isId(segment) : isLongId(segment)

          if (matchesId) {
            // Check if loading
            if (entityResolver.isLoading(loadingState)) {
              breadcrumbs.push({
                label: null, // Loading state
                href: isLast ? undefined : currentPath,
              })
              continue
            }

            // Get display name from entity data
            title = entityResolver.getDisplayName(entityData) || null
            fullTitle = entityResolver.getFullName(entityData)
          }
        }

        if (!title) {
          // Regular segment - capitalize
          title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
        }
      }

      breadcrumbs.push({
        label: title,
        fullLabel: fullTitle,
        href: isLast ? undefined : currentPath,
      })
    }

    return breadcrumbs
  }, [pathname, ids, game, app, user, gameLoading, appLoading, userLoading])
}

export function MainLayout() {
  const location = useLocation()
  const breadcrumbs = useBreadcrumbs(location.pathname)

  return (
    <SidebarProvider className="bg-sidebar">
      <AppSidebar className="border-none" />
      <SidebarInset className="bg-background rounded-xl overflow-hidden my-2 mr-2">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="text-muted-foreground h-7 w-7" />
          <Separator orientation="vertical" className="!h-4 data-[orientation=vertical]:w-px" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <Fragment key={`${index}-${crumb.label ?? 'loading'}`}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {crumb.label === null ? (
                      <Skeleton className="h-4 w-20" />
                    ) : crumb.href ? (
                      crumb.fullLabel ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <BreadcrumbLink asChild>
                              <Link to={crumb.href}>{crumb.label}</Link>
                            </BreadcrumbLink>
                          </TooltipTrigger>
                          <TooltipContent>{crumb.fullLabel}</TooltipContent>
                        </Tooltip>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.href}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      )
                    ) : crumb.fullLabel ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <BreadcrumbPage className="font-medium">{crumb.label}</BreadcrumbPage>
                        </TooltipTrigger>
                        <TooltipContent>{crumb.fullLabel}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <BreadcrumbPage className="font-medium">{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
