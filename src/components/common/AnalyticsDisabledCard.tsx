import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, Settings } from 'lucide-react'
import { useNavigate } from 'react-router'

interface AnalyticsDisabledCardProps {
  description?: string
}

export function AnalyticsDisabledCard({
  description = 'Enable analytics to see charts and detailed statistics.',
}: AnalyticsDisabledCardProps) {
  const navigate = useNavigate()

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">Analytics Disabled</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
          <Settings className="h-4 w-4 mr-2" />
          Enable in Settings
        </Button>
      </CardContent>
    </Card>
  )
}
