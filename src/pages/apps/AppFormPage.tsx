import { useParams, useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function AppFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/apps')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Apps
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit App' : 'Create App'}</CardTitle>
          <CardDescription>
            {isEdit
              ? `Editing app: ${id}`
              : 'Create a new app that can have games linked to it'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appId">App ID</Label>
            <Input
              id="appId"
              placeholder="e.g., ggg-ma-dao"
              disabled={isEdit}
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier (lowercase, hyphens only)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="portalId">Portal ID</Label>
            <Input
              id="portalId"
              type="number"
              placeholder="Portal ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="App name"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="isActive" />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit">
              {isEdit ? 'Update App' : 'Create App'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/apps')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
