import { Navigate, Outlet } from 'react-router'
import { useIsAuthenticated } from '@/stores/authStore'

export function AuthGuard() {
  const isAuthenticated = useIsAuthenticated()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
