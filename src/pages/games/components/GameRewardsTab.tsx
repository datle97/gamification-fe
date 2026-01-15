import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useRewardsByGame,
  useCreateReward,
  useUpdateReward,
  useDeleteReward,
} from '@/hooks/useRewards'
import type {
  Reward,
  RewardCategory,
  HandlerType,
  CreateRewardInput,
} from '@/schemas/reward.schema'
import { BasicTab } from './reward-tabs/BasicTab'
import { ExpirationTab } from './reward-tabs/ExpirationTab'
import { HandlerConfigTab } from './reward-tabs/HandlerConfigTab'
import { ConditionsTab } from './reward-tabs/ConditionsTab'
import { SharingTab } from './reward-tabs/SharingTab'
import { AdvancedTab } from './reward-tabs/AdvancedTab'

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

const columns: ColumnDef<Reward>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
  },
  {
    accessorKey: 'rewardType',
    header: 'Category',
    cell: ({ row }) => {
      const type = row.getValue('rewardType') as RewardCategory | null
      return type ? (
        <Badge variant="secondary" className="capitalize">
          {rewardCategoryLabels[type] || type}
        </Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: 'handlerType',
    header: 'Handler',
    cell: ({ row }) => {
      const type = row.getValue('handlerType') as HandlerType
      return (
        <Badge variant="outline" className="font-mono text-xs">
          {type}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'probability',
    header: 'Probability',
    cell: ({ row }) => {
      const prob = row.getValue('probability') as number
      return <span className="text-sm tabular-nums">{prob}%</span>
    },
  },
  {
    id: 'quota',
    header: 'Quota',
    cell: ({ row }) => {
      const quota = row.original.quota
      const used = row.original.quotaUsed
      if (quota === null || quota === undefined) {
        return <span className="text-muted-foreground">Unlimited</span>
      }
      return (
        <span className="text-sm tabular-nums">
          {used} / {quota}
        </span>
      )
    },
  },
  {
    accessorKey: 'displayOrder',
    header: 'Order',
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">{row.getValue('displayOrder')}</span>
    ),
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
  },
]

type DialogMode = 'closed' | 'create' | 'edit'

interface FormData {
  // Basic
  name: string
  description: string
  imageUrl: string
  rewardType: RewardCategory | ''
  handlerType: HandlerType
  probability: number
  quota: number | null
  displayOrder: number
  isActive: boolean
  fallbackRewardId: string
  // Config (JSON for now, will be structured later)
  config: string
  conditions: string
  shareConfig: string
  expirationConfig: string
  metadata: string
}

const initialFormData: FormData = {
  name: '',
  description: '',
  imageUrl: '',
  rewardType: '',
  handlerType: 'system',
  probability: 0,
  quota: null,
  displayOrder: 0,
  isActive: true,
  fallbackRewardId: '',
  config: '{"type": "system"}',
  conditions: '',
  shareConfig: '',
  expirationConfig: '',
  metadata: '',
}

interface GameRewardsTabProps {
  gameId: string
}

export function GameRewardsTab({ gameId }: GameRewardsTabProps) {
  const { data: rewards = [], isLoading } = useRewardsByGame(gameId)
  const createReward = useCreateReward()
  const updateReward = useUpdateReward()
  const deleteReward = useDeleteReward()

  const [dialogMode, setDialogMode] = useState<DialogMode>('closed')
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [activeTab, setActiveTab] = useState('basic')

  const handleOpenCreate = () => {
    setDialogMode('create')
    setSelectedReward(null)
    setFormData(initialFormData)
    setActiveTab('basic')
  }

  const handleRowClick = (reward: Reward) => {
    setDialogMode('edit')
    setSelectedReward(reward)
    setFormData({
      name: reward.name,
      description: reward.description || '',
      imageUrl: reward.imageUrl || '',
      rewardType: reward.rewardType || '',
      handlerType: reward.handlerType,
      probability: reward.probability,
      quota: reward.quota ?? null,
      displayOrder: reward.displayOrder,
      isActive: reward.isActive ?? true,
      fallbackRewardId: reward.fallbackRewardId || '',
      config: reward.config ? JSON.stringify(reward.config, null, 2) : '{"type": "system"}',
      conditions: reward.conditions ? JSON.stringify(reward.conditions, null, 2) : '',
      shareConfig: reward.shareConfig ? JSON.stringify(reward.shareConfig, null, 2) : '',
      expirationConfig: reward.expirationConfig
        ? JSON.stringify(reward.expirationConfig, null, 2)
        : '',
      metadata: reward.metadata ? JSON.stringify(reward.metadata, null, 2) : '',
    })
    setActiveTab('basic')
  }

  const handleClose = () => {
    setDialogMode('closed')
    setSelectedReward(null)
    setFormData(initialFormData)
    setActiveTab('basic')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseJsonField = (value: string): any => {
    if (!value.trim()) return undefined
    try {
      return JSON.parse(value)
    } catch {
      return undefined
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.handlerType) return

    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      imageUrl: formData.imageUrl || undefined,
      rewardType: formData.rewardType || undefined,
      handlerType: formData.handlerType,
      probability: formData.probability,
      quota: formData.quota,
      displayOrder: formData.displayOrder,
      isActive: formData.isActive,
      fallbackRewardId: formData.fallbackRewardId || undefined,
      config: parseJsonField(formData.config) || { type: 'system' },
      conditions: parseJsonField(formData.conditions),
      shareConfig: parseJsonField(formData.shareConfig),
      expirationConfig: parseJsonField(formData.expirationConfig),
      metadata: parseJsonField(formData.metadata),
    }

    if (dialogMode === 'create') {
      await createReward.mutateAsync({
        ...payload,
        gameId,
      } as CreateRewardInput)
    } else if (dialogMode === 'edit' && selectedReward) {
      await updateReward.mutateAsync({
        id: selectedReward.rewardId,
        data: payload,
      })
    }

    handleClose()
  }

  const handleDelete = async () => {
    if (!selectedReward) return
    await deleteReward.mutateAsync(selectedReward.rewardId)
    handleClose()
  }

  const isPending = createReward.isPending || updateReward.isPending || deleteReward.isPending
  const isCreate = dialogMode === 'create'

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rewards</CardTitle>
              <CardDescription>Manage rewards for this game</CardDescription>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Reward
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rewards.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
              <p>No rewards yet. Create your first reward for this game.</p>
            </div>
          ) : (
            <DataTable columns={columns} data={rewards} onRowClick={handleRowClick} />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogMode !== 'closed'} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-6xl! w-[95vw] max-h-[90vh] flex flex-col p-0 sm:top-[5%] sm:translate-y-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>
              {isCreate ? 'Create Reward' : `Edit: ${selectedReward?.name}`}
            </DialogTitle>
            <DialogDescription>
              {isCreate
                ? 'Configure a new reward with handler, conditions, and probability settings'
                : 'Update reward configuration and allocation rules'}
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-6">
              <TabsList className="grid grid-cols-6 w-full h-auto">
                <TabsTrigger value="basic" className="data-[state=active]:border-b-2">
                  Basic
                </TabsTrigger>
                <TabsTrigger value="expiration" className="data-[state=active]:border-b-2">
                  Expiration
                </TabsTrigger>
                <TabsTrigger value="config" className="data-[state=active]:border-b-2">
                  Handler Config
                </TabsTrigger>
                <TabsTrigger value="conditions" className="data-[state=active]:border-b-2">
                  Conditions
                </TabsTrigger>
                <TabsTrigger value="sharing" className="data-[state=active]:border-b-2">
                  Sharing
                </TabsTrigger>
                <TabsTrigger value="advanced" className="data-[state=active]:border-b-2">
                  Advanced
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <TabsContent value="basic" className="mt-0">
                <BasicTab
                  formData={{
                    name: formData.name,
                    description: formData.description,
                    imageUrl: formData.imageUrl,
                    rewardType: formData.rewardType,
                    probability: formData.probability,
                    quota: formData.quota,
                    displayOrder: formData.displayOrder,
                    isActive: formData.isActive,
                  }}
                  onChange={(data) => setFormData({ ...formData, ...data })}
                  isCreate={isCreate}
                  selectedReward={selectedReward}
                />
              </TabsContent>

              <TabsContent value="expiration" className="mt-0">
                <ExpirationTab
                  expirationConfig={formData.expirationConfig}
                  onChange={(exp) => setFormData({ ...formData, expirationConfig: exp })}
                />
              </TabsContent>

              <TabsContent value="config" className="mt-0">
                <HandlerConfigTab
                  handlerType={formData.handlerType}
                  config={formData.config}
                  onChange={(cfg) => setFormData({ ...formData, config: cfg })}
                  onHandlerTypeChange={(type) => setFormData({ ...formData, handlerType: type })}
                />
              </TabsContent>

              <TabsContent value="conditions" className="mt-0">
                <ConditionsTab
                  conditions={formData.conditions}
                  onChange={(conds) => setFormData({ ...formData, conditions: conds })}
                  gameId={gameId}
                />
              </TabsContent>

              <TabsContent value="sharing" className="mt-0">
                <SharingTab
                  shareConfig={formData.shareConfig}
                  onChange={(share) => setFormData({ ...formData, shareConfig: share })}
                />
              </TabsContent>

              <TabsContent value="advanced" className="mt-0">
                <AdvancedTab
                  config={formData.config}
                  conditions={formData.conditions}
                  shareConfig={formData.shareConfig}
                  expirationConfig={formData.expirationConfig}
                  metadata={formData.metadata}
                  onChange={(field, value) => setFormData({ ...formData, [field]: value })}
                />
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="px-6 pb-6 flex-row gap-2">
            {!isCreate && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
                className="mr-auto"
              >
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || !formData.handlerType || isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isCreate ? 'Create Reward' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
