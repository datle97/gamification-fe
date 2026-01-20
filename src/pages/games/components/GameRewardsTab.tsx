import { useState, useMemo, useCallback } from 'react'
import { Plus, Loader2, Sliders } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createColumnHelper } from '@/lib/column-helper'
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
  useBatchUpdateRewards,
} from '@/hooks/queries'
import { useAnalytics } from '@/stores/settingsStore'
import {
  rewardCategoryLabels,
  handlerTypeLabels,
  type Reward,
  type RewardCategory,
  type HandlerType,
  type CreateRewardInput,
} from '@/schemas/reward.schema'
import { BasicTab } from './reward-tabs/BasicTab'
import { ExpirationTab } from './reward-tabs/ExpirationTab'
import { HandlerConfigTab } from './reward-tabs/HandlerConfigTab'
import { ConditionsTab } from './reward-tabs/ConditionsTab'
import { SharingTab } from './reward-tabs/SharingTab'
import { AdvancedTab } from './reward-tabs/AdvancedTab'
import { ProbabilityManagerDialog } from './ProbabilityManagerDialog'
import { RewardsDistributionCard } from './RewardsDistributionCard'
import { AnalyticsDisabledCard } from '@/components/common/AnalyticsDisabledCard'

const columnHelper = createColumnHelper<Reward>()

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
  const showAnalytics = useAnalytics()
  const { data: rewards = [], isLoading } = useRewardsByGame(gameId)
  const createReward = useCreateReward()
  const updateReward = useUpdateReward()
  const deleteReward = useDeleteReward()
  const batchUpdateRewards = useBatchUpdateRewards()

  const [dialogMode, setDialogMode] = useState<DialogMode>('closed')
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [activeTab, setActiveTab] = useState('basic')
  const [probabilityDialogOpen, setProbabilityDialogOpen] = useState(false)

  const handleInlineUpdate = useCallback(
    async (reward: Reward, field: string, value: unknown) => {
      await updateReward.mutateAsync({
        id: reward.rewardId,
        data: { [field]: value },
      })
    },
    [updateReward]
  )

  const columns = useMemo(
    () => [
      columnHelper.text('name', 'Name', { variant: 'primary' }),
      columnHelper.badge('rewardType', 'Category', { labels: rewardCategoryLabels }),
      columnHelper.badge('handlerType', 'Handler', {
        labels: handlerTypeLabels,
        variants: { api: 'outline', script: 'outline' },
      }),
      columnHelper.editable.number(
        'probability',
        'Probability',
        (row, value) => handleInlineUpdate(row, 'probability', value),
        { min: 0, max: 100 }
      ),
      columnHelper.text('quotaUsed', 'Used', { variant: 'tabular' }),
      columnHelper.editable.number(
        'quota',
        'Quota',
        (row, value) => handleInlineUpdate(row, 'quota', value),
        { min: 0 }
      ),
      columnHelper.editable.number(
        'displayOrder',
        'Order',
        (row, value) => handleInlineUpdate(row, 'displayOrder', value),
        { min: 0 }
      ),
      columnHelper.editable.toggle('isActive', 'Active', (row, value) =>
        handleInlineUpdate(row, 'isActive', value)
      ),
    ],
    [handleInlineUpdate]
  )

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

  const handleProbabilityApply = async (updates: { rewardId: string; probability: number }[]) => {
    // Batch update all rewards with new probabilities in a single transaction
    await batchUpdateRewards.mutateAsync(
      updates.map((u) => ({
        rewardId: u.rewardId,
        data: { probability: u.probability },
      }))
    )
  }

  const isPending = createReward.isPending || updateReward.isPending || deleteReward.isPending
  const isCreate = dialogMode === 'create'

  return (
    <div className="space-y-6">
      {showAnalytics ? (
        <RewardsDistributionCard gameId={gameId} />
      ) : (
        <AnalyticsDisabledCard description="Enable analytics to see rewards distribution chart." />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rewards</CardTitle>
              <CardDescription>Manage rewards for this game</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setProbabilityDialogOpen(true)}
                disabled={rewards.length === 0}
              >
                <Sliders className="h-4 w-4 mr-2" />
                Manage Probabilities
              </Button>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                New Reward
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={rewards}
            loading={isLoading}
            emptyMessage="No rewards yet. Create your first reward for this game."
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogMode !== 'closed'} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-6xl! w-[95vw] max-h-[90vh] flex flex-col p-0 top-[5%] translate-y-0">
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
                    metadata: formData.metadata,
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

      <ProbabilityManagerDialog
        open={probabilityDialogOpen}
        onOpenChange={setProbabilityDialogOpen}
        rewards={rewards}
        onApply={handleProbabilityApply}
      />
    </div>
  )
}
