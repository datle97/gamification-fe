import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Plus, Loader2 } from 'lucide-react'
import { Link as RouterLink } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusCellSelect } from '@/components/common/status-cell-select'
import { useLinks, useUpdateLink } from '@/hooks/useLinks'
import type { Link, LinkStatus } from '@/schemas/link.schema'

const statusOptions = ['draft', 'active', 'paused', 'ended'] as const

const statusVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  draft: 'outline',
  paused: 'secondary',
  ended: 'secondary',
}

const columns: ColumnDef<Link>[] = [
  {
    accessorKey: 'app',
    header: 'App',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.app?.name || '-'}</div>
        <div className="text-xs text-muted-foreground font-mono">
          {row.original.appId}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'game',
    header: 'Game',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.game?.name || '-'}</div>
        <div className="text-xs text-muted-foreground font-mono">
          {row.original.game?.code || row.original.gameId}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <StatusCellSelect
        value={row.getValue('status') as string}
        onValueChange={(newStatus: string) => {
          // Status change is handled via inline update
          console.log('Changing status to:', newStatus)
        }}
        options={statusOptions}
        variants={statusVariants}
      />
    ),
  },
  {
    accessorKey: 'startAt',
    header: 'Start Date',
    cell: ({ row }) => {
      const date = row.getValue('startAt') as string
      return (
        <span className="text-muted-foreground">
          {date ? format(new Date(date), 'yyyy-MM-dd') : '-'}
        </span>
      )
    },
  },
  {
    accessorKey: 'endAt',
    header: 'End Date',
    cell: ({ row }) => {
      const date = row.getValue('endAt') as string
      return (
        <span className="text-muted-foreground">
          {date ? format(new Date(date), 'yyyy-MM-dd') : '-'}
        </span>
      )
    },
  },
]

export function AppGamesPage() {
  const { data: links = [], isLoading, error } = useLinks()
  const updateLink = useUpdateLink()

  const [selectedLink, setSelectedLink] = useState<Link | null>(null)
  const [editedLink, setEditedLink] = useState<Link | null>(null)

  const handleRowClick = (link: Link) => {
    setSelectedLink(link)
    setEditedLink({ ...link })
  }

  const handleSave = async () => {
    if (!editedLink || !selectedLink) return

    await updateLink.mutateAsync({
      appId: selectedLink.appId,
      gameId: selectedLink.gameId,
      status: editedLink.status as LinkStatus,
      startAt: editedLink.startAt,
      endAt: editedLink.endAt,
    })

    setSelectedLink(null)
    setEditedLink(null)
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-destructive">
          Failed to load app games: {error.message}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>App Games</CardTitle>
              <CardDescription>
                Link games to apps and manage campaign settings
              </CardDescription>
            </div>
            <Button asChild>
              <RouterLink to="/app-games/new">
                <Plus className="h-4 w-4 mr-2" />
                Link Game
              </RouterLink>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : links.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
              <p>No app-game links yet. Link a game to an app to create a campaign.</p>
            </div>
          ) : (
            <DataTable columns={columns} data={links} onRowClick={handleRowClick} />
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedLink} onOpenChange={(open) => !open && setSelectedLink(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Campaign Details</SheetTitle>
            <SheetDescription>
              View and edit app-game link settings
            </SheetDescription>
          </SheetHeader>
          {editedLink && (
            <div className="flex-1 space-y-4 overflow-auto px-4">
              <div className="space-y-2">
                <Label>App</Label>
                <Input value={editedLink.app?.name || ''} disabled />
                <p className="text-xs text-muted-foreground font-mono">{editedLink.appId}</p>
              </div>
              <div className="space-y-2">
                <Label>Game</Label>
                <Input value={editedLink.game?.name || ''} disabled />
                <p className="text-xs text-muted-foreground font-mono">
                  {editedLink.game?.code || editedLink.gameId}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editedLink.status}
                  onValueChange={(value) => setEditedLink({ ...editedLink, status: value as LinkStatus })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <DatePicker
                    value={editedLink.startAt ? parseISO(editedLink.startAt) : undefined}
                    onChange={(date) => setEditedLink({
                      ...editedLink,
                      startAt: date ? format(date, "yyyy-MM-dd'T'HH:mm:ss'Z'") : null
                    })}
                    placeholder="Select start date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <DatePicker
                    value={editedLink.endAt ? parseISO(editedLink.endAt) : undefined}
                    onChange={(date) => setEditedLink({
                      ...editedLink,
                      endAt: date ? format(date, "yyyy-MM-dd'T'HH:mm:ss'Z'") : null
                    })}
                    placeholder="Select end date"
                  />
                </div>
              </div>
            </div>
          )}
          <SheetFooter>
            <Button variant="outline" onClick={() => setSelectedLink(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateLink.isPending}>
              {updateLink.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
