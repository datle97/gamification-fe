import { Fragment } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { LogOut, Moon, Sun } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/stores/authStore'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/games': 'Games',
  '/games/new': 'New Game',
  '/apps': 'Apps',
  '/apps/new': 'New App',
  '/app-games': 'App Games',
  '/app-games/new': 'Link Game',
  '/settings': 'Settings',
}

// Truncate long IDs (UUIDs) for display
function truncateId(id: string, maxLength = 12): string {
  if (id.length <= maxLength) return id
  return `${id.slice(0, 6)}...${id.slice(-4)}`
}

// Check if string looks like a UUID
function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: { label: string; href?: string }[] = []

  let currentPath = ''
  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`
    const isLast = i === segments.length - 1
    const segment = segments[i]

    // Special case: /games/:gameId/users/:userId - "Users" should link to ?tab=users
    if (segment === 'users' && i >= 2 && segments[i - 2] === 'games') {
      const gameId = segments[i - 1]
      breadcrumbs.push({
        label: 'Users',
        href: isLast ? undefined : `/games/${gameId}?tab=users`,
      })
      continue
    }

    // Get title from pageTitles or format segment
    let title = pageTitles[currentPath]
    if (!title) {
      // Truncate UUIDs for display
      if (isUuid(segment)) {
        title = truncateId(segment)
      } else {
        title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
      }
    }

    breadcrumbs.push({
      label: title,
      href: isLast ? undefined : currentPath,
    })
  }

  return breadcrumbs
}

export function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const breadcrumbs = getBreadcrumbs(location.pathname)
  const { theme, toggleTheme } = useTheme()
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

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
                <Fragment key={crumb.label}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {crumb.href ? (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="font-medium">{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
