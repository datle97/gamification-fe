import { useParams, useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function AppGameFormPage() {
  const { appId, gameId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(appId && gameId)

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/app-games')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to App Games
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit App Game' : 'Link Game to App'}</CardTitle>
          <CardDescription>
            {isEdit
              ? `Editing link: ${appId} - ${gameId}`
              : 'Link a game template to an app to create a campaign'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app">App</Label>
            <Select disabled={isEdit}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select app" />
              </SelectTrigger>
              <SelectContent>
                {/* Apps will be loaded from API */}
                <SelectItem value="placeholder">Select an app</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="game">Game</Label>
            <Select disabled={isEdit}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select game" />
              </SelectTrigger>
              <SelectContent>
                {/* Games will be loaded from API */}
                <SelectItem value="placeholder">Select a game</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select defaultValue="draft">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="datetime-local"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="datetime-local"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit">
              {isEdit ? 'Update Link' : 'Create Link'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/app-games')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
