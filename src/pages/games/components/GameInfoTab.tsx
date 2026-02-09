import { MetadataEditor } from '@/components/common/MetadataEditor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RichTextEditor } from '@/components/common/lazy-rich-text-editor'
import { useUpdateGame } from '@/hooks/queries'
import {
  gameStatusLabels,
  gameTypeLabels,
  type Game,
  type GameStatus,
  type GameType,
} from '@/schemas/game.schema'
import dayjs from 'dayjs'
import { Loader2 } from 'lucide-react'
import { useCallback, useState } from 'react'

const gameTypes: GameType[] = ['spin', 'scratch', 'quiz', 'puzzle', 'match', 'lottery', 'catch']
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
    iconUrl: game.iconUrl || '',
    templateUrl: game.templateUrl || '',
    status: game.status || 'draft',
    startAt: game.startAt || null,
    endAt: game.endAt || null,
    timezone: game.timezone || 'Asia/Ho_Chi_Minh',
    metadata: game.metadata ? JSON.stringify(game.metadata, null, 2) : '',
  })

  // Memoize metadata onChange to prevent JsonEditor re-renders
  const handleMetadataChange = useCallback(
    (value: string) => setFormData((prev) => ({ ...prev, metadata: value })),
    []
  )

  const parseJsonField = (value: string) => {
    if (!value.trim()) return undefined
    try {
      return JSON.parse(value)
    } catch {
      return undefined
    }
  }

  const handleSave = async () => {
    await updateGame.mutateAsync({
      id: game.gameId,
      data: {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        iconUrl: formData.iconUrl,
        templateUrl: formData.templateUrl,
        status: formData.status,
        startAt: formData.startAt,
        endAt: formData.endAt,
        timezone: formData.timezone,
        metadata: parseJsonField(formData.metadata),
      },
    })
  }

  const hasChanges =
    formData.name !== game.name ||
    formData.type !== game.type ||
    formData.description !== (game.description || '') ||
    formData.iconUrl !== (game.iconUrl || '') ||
    formData.templateUrl !== (game.templateUrl || '') ||
    formData.status !== (game.status || 'draft') ||
    formData.startAt !== (game.startAt || null) ||
    formData.endAt !== (game.endAt || null) ||
    formData.metadata !== (game.metadata ? JSON.stringify(game.metadata, null, 2) : '')

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
                  <SelectItem key={type} value={type}>
                    {gameTypeLabels[type]}
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
                  <SelectItem key={status} value={status}>
                    {gameStatusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Duration</Label>
          <DateRangePicker
            value={{
              from: formData.startAt ? dayjs(formData.startAt).toDate() : undefined,
              to: formData.endAt ? dayjs(formData.endAt).toDate() : undefined,
            }}
            onChange={(range) =>
              setFormData({
                ...formData,
                startAt: range?.from ? dayjs(range.from).toISOString() : null,
                endAt: range?.to ? dayjs(range.to).toISOString() : null,
              })
            }
            placeholder="Select date range"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="iconUrl">Icon URL</Label>
            <Input
              id="iconUrl"
              placeholder="https://..."
              value={formData.iconUrl}
              onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="templateUrl">Template URL</Label>
            <Input
              id="templateUrl"
              placeholder="https://..."
              value={formData.templateUrl}
              onChange={(e) => setFormData({ ...formData, templateUrl: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <RichTextEditor
            placeholder="Game description..."
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="metadata">Metadata (JSON)</Label>
          <MetadataEditor
            value={formData.metadata}
            onChange={handleMetadataChange}
          />
          <p className="text-xs text-muted-foreground">
            Custom metadata for frontend display (e.g., icons, labels, extra info)
          </p>
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
