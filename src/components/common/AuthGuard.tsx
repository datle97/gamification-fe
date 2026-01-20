import { useIsAuthenticated } from '@/stores/authStore'
import { Navigate, Outlet } from 'react-router'

export function AuthGuard() {
  const isAuthenticated = useIsAuthenticated()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
