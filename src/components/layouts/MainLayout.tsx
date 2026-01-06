import { Outlet, useLocation } from 'react-router'
import { Moon, Sun } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
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

const pageTitles: Record<string, string> = {
  '/games': 'Games',
  '/games/new': 'New Game',
  '/apps': 'Apps',
  '/apps/new': 'New App',
  '/app-games': 'App Games',
  '/app-games/new': 'Link Game',
  '/settings': 'Settings',
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: { label: string; href?: string }[] = []

  let currentPath = ''
  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`
    const isLast = i === segments.length - 1

    // Get title from pageTitles or capitalize segment
    const title =
      pageTitles[currentPath] ||
      segments[i].charAt(0).toUpperCase() + segments[i].slice(1).replace(/-/g, ' ')

    breadcrumbs.push({
      label: title,
      href: isLast ? undefined : currentPath,
    })
  }

  return breadcrumbs
}

export function MainLayout() {
  const location = useLocation()
  const breadcrumbs = getBreadcrumbs(location.pathname)
  const { theme, toggleTheme } = useTheme()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <BreadcrumbItem key={crumb.label}>
                  {index > 0 && <BreadcrumbSeparator />}
                  {crumb.href ? (
                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
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
