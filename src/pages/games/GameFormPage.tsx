import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import dayjs from 'dayjs'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useGame, useCreateGame, useUpdateGame } from '@/hooks/useGames'
import type { GameStatus, GameType, CreateGameInput } from '@/schemas/game.schema'

const gameTypes: GameType[] = ['spin', 'scratch', 'quiz', 'puzzle', 'match', 'lottery']
const gameStatuses: GameStatus[] = ['draft', 'active', 'paused', 'ended']

export function GameFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { data: existingGame, isLoading: gameLoading } = useGame(id || '')
  const createGame = useCreateGame()
  const updateGame = useUpdateGame()

  const [formData, setFormData] = useState<Partial<CreateGameInput>>({
    code: '',
    name: '',
    type: undefined,
    description: '',
    templateUrl: '',
    status: 'draft',
    startAt: null,
    endAt: null,
    timezone: 'Asia/Ho_Chi_Minh',
  })

  // Sync form data when existing game is loaded
  if (isEdit && existingGame && !formData.code && existingGame.code) {
    setFormData({
      code: existingGame.code,
      name: existingGame.name,
      type: existingGame.type,
      description: existingGame.description || '',
      templateUrl: existingGame.templateUrl || '',
      status: existingGame.status || 'draft',
      startAt: existingGame.startAt || null,
      endAt: existingGame.endAt || null,
      timezone: existingGame.timezone || 'Asia/Ho_Chi_Minh',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code || !formData.name) return

    if (isEdit && id) {
      await updateGame.mutateAsync({
        id,
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
    } else {
      await createGame.mutateAsync(formData as CreateGameInput)
    }

    navigate('/games')
  }

  const isPending = createGame.isPending || updateGame.isPending

  if (isEdit && gameLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/games')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Games
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Game' : 'Create Game'}</CardTitle>
          <CardDescription>
            {isEdit
              ? `Editing game: ${existingGame?.code}`
              : 'Create a new game template with status and schedule settings'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="e.g., golden-horse"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={isEdit}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier (lowercase, hyphens only)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Game name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as GameStatus })
                  }
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

            <div className="grid grid-cols-2 gap-4">
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
                value={formData.templateUrl || ''}
                onChange={(e) => setFormData({ ...formData, templateUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">URL to the game render template</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Game description..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={!formData.code || !formData.name || isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? 'Update Game' : 'Create Game'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/games')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
