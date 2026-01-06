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

export function GameFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/games')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Games
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Game' : 'Create Game'}</CardTitle>
          <CardDescription>
            {isEdit
              ? `Editing game: ${id}`
              : 'Create a new game template that can be linked to apps'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              placeholder="e.g., golden-horse"
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spin">Spin</SelectItem>
                <SelectItem value="scratch">Scratch</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="lottery">Lottery</SelectItem>
                <SelectItem value="collection">Collection</SelectItem>
                <SelectItem value="gacha">Gacha</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateUrl">Template URL</Label>
            <Input
              id="templateUrl"
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              URL to the game render template
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Game description..."
              className="w-full min-h-[80px] px-3 py-2 text-sm border border-input rounded-md bg-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit">
              {isEdit ? 'Update Game' : 'Create Game'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/games')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
