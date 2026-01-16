import dayjs from 'dayjs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { RewardCategory, Reward } from '@/schemas/reward.schema'

const rewardCategories: RewardCategory[] = [
  'voucher',
  'collectable',
  'coins',
  'points',
  'turn',
  'physical',
  'no_reward',
  'other',
]

const rewardCategoryLabels: Record<RewardCategory, string> = {
  voucher: 'Voucher',
  collectable: 'Collectable',
  coins: 'Coins',
  points: 'Points',
  turn: 'Turn',
  physical: 'Physical',
  no_reward: 'No Reward',
  other: 'Other',
}

interface FormData {
  name: string
  description: string
  imageUrl: string
  rewardType: RewardCategory | ''
  probability: number
  quota: number | null
  displayOrder: number
  isActive: boolean
  metadata: string
}

interface BasicTabProps {
  formData: FormData
  onChange: (data: Partial<FormData>) => void
  isCreate: boolean
  selectedReward?: Reward | null
}

export function BasicTab({ formData, onChange, isCreate, selectedReward }: BasicTabProps) {
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Reward name"
            value={formData.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Reward description..."
            value={formData.description}
            onChange={(e) => onChange({ description: e.target.value })}
            className="min-h-20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            placeholder="https://..."
            value={formData.imageUrl}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="metadata">Metadata (JSON)</Label>
          <Textarea
            id="metadata"
            placeholder='{"tnc": "Terms and conditions..."}'
            value={formData.metadata}
            onChange={(e) => onChange({ metadata: e.target.value })}
            className="min-h-20 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Custom metadata for frontend display (e.g., terms, icons, extra info)
          </p>
        </div>
      </div>

      {/* Category */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-semibold">Category</h4>
        <div className="space-y-2">
          <Label>Reward Category</Label>
          <Select
            value={formData.rewardType}
            onValueChange={(value) => onChange({ rewardType: value as RewardCategory })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {rewardCategories.map((type) => (
                <SelectItem key={type} value={type}>
                  {rewardCategoryLabels[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">For display and filtering purposes</p>
        </div>
      </div>

      {/* Probability & Quota */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-semibold">Probability & Quota</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="probability">Probability (%)</Label>
            <Input
              id="probability"
              type="number"
              min={0}
              max={100}
              step={0.000001}
              value={formData.probability}
              onChange={(e) => onChange({ probability: parseFloat(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground">
              Chance to win (0-100, up to 6 decimal places)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quota">Quota</Label>
            <Input
              id="quota"
              type="number"
              min={0}
              placeholder="Unlimited"
              value={formData.quota ?? ''}
              onChange={(e) =>
                onChange({ quota: e.target.value ? parseInt(e.target.value) : null })
              }
            />
            <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
          </div>
        </div>
        {!isCreate && selectedReward && (
          <div className="text-sm text-muted-foreground">
            Quota used: {selectedReward.quotaUsed || 0}
            {selectedReward.quota && ` / ${selectedReward.quota}`}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-semibold">Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              value={formData.displayOrder}
              onChange={(e) => onChange({ displayOrder: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => onChange({ isActive: !!checked })}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active
            </Label>
          </div>
        </div>
      </div>

      {!isCreate && selectedReward?.createdAt && (
        <div className="text-xs text-muted-foreground pt-4 border-t">
          Created {dayjs(selectedReward.createdAt).format('MMMM D, YYYY')}
        </div>
      )}
    </div>
  )
}
