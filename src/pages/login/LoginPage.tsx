import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/authStore'
import { AlertCircle, Lock } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

export function LoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Small delay to prevent brute force
    setTimeout(() => {
      const success = login(pin)
      if (success) {
        navigate('/dashboard', { replace: true })
      } else {
        setError('Invalid PIN')
        setPin('')
      }
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Gamification Admin</CardTitle>
          <CardDescription>Enter your PIN to access the admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!pin || isLoading}>
              {isLoading ? 'Verifying...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
