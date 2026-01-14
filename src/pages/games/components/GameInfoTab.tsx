import { useState } from 'react'
import dayjs from 'dayjs'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateGame } from '@/hooks/useGames'
import type { Game, GameStatus, GameType } from '@/schemas/game.schema'

const gameTypes: GameType[] = ['spin', 'scratch', 'quiz', 'puzzle', 'match', 'lottery']
const gameStatuses: GameStatus[] = ['draft', 'active', 'paused', 'ended']

interface GameInfoTabProps {
  game: Game
}

export function GameInfoTab({ game }: GameInfoTabProps) {
  const updateGame = useUpdateGame()

  const [formData, setFormData] = useState({
    name: game.name,
    type: game.type,
    description: game.description || '',
    templateUrl: game.templateUrl || '',
    status: game.status || 'draft',
    startAt: game.startAt || null,
    endAt: game.endAt || null,
    timezone: game.timezone || 'Asia/Ho_Chi_Minh',
  })

  const handleSave = async () => {
    await updateGame.mutateAsync({
      id: game.gameId,
      data: {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        templateUrl: formData.templateUrl,
        status: formData.status,
        startAt: formData.startAt,
        endAt: formData.endAt,
        timezone: formData.timezone,
      },
    })
  }

  const hasChanges =
    formData.name !== game.name ||
    formData.type !== game.type ||
    formData.description !== (game.description || '') ||
    formData.templateUrl !== (game.templateUrl || '') ||
    formData.status !== (game.status || 'draft') ||
    formData.startAt !== (game.startAt || null) ||
    formData.endAt !== (game.endAt || null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Information</CardTitle>
        <CardDescription>Update game details and settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" value={game.code} disabled className="font-mono bg-muted" />
            <p className="text-xs text-muted-foreground">Code cannot be changed</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Game name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type || ''}
              onValueChange={(value) => setFormData({ ...formData, type: value as GameType })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {gameTypes.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status || 'draft'}
              onValueChange={(value) => setFormData({ ...formData, status: value as GameStatus })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {gameStatuses.map((status) => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <DatePicker
              value={formData.startAt ? dayjs(formData.startAt).toDate() : undefined}
              onChange={(date) =>
                setFormData({
                  ...formData,
                  startAt: date ? dayjs(date).format('YYYY-MM-DDTHH:mm:ss[Z]') : null,
                })
              }
              placeholder="Select start date"
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <DatePicker
              value={formData.endAt ? dayjs(formData.endAt).toDate() : undefined}
              onChange={(date) =>
                setFormData({
                  ...formData,
                  endAt: date ? dayjs(date).format('YYYY-MM-DDTHH:mm:ss[Z]') : null,
                })
              }
              placeholder="Select end date"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="templateUrl">Template URL</Label>
          <Input
            id="templateUrl"
            placeholder="https://..."
            value={formData.templateUrl}
            onChange={(e) => setFormData({ ...formData, templateUrl: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">URL to the game render template</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Game description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="min-h-24"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Created {dayjs(game.createdAt).format('MMMM D, YYYY')}
          </p>
          <Button onClick={handleSave} disabled={!hasChanges || updateGame.isPending}>
            {updateGame.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
