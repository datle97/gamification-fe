import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type Table as TanstackTable,
  type VisibilityState,
} from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Loader2,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useCompactTables, useTablePageSize } from '@/stores/settingsStore'
import {
  useSetTableColumnVisibility,
  useSetTableSorting,
  useTableColumnVisibility,
  useTableSorting,
} from '@/stores/tableStateStore'

// ============================================================================
// Action Button Type
// ============================================================================

export interface DataTableAction {
  label: string
  icon?: LucideIcon
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

// ============================================================================
// Shared Base Component (UI only)
// ============================================================================

interface DataTableBaseProps<TData> {
  table: TanstackTable<TData>
  columns: ColumnDef<TData, unknown>[]
  loading?: boolean
  emptyMessage?: ReactNode
  onRowClick?: (row: TData) => void
  enableSorting?: boolean
  enableColumnVisibility?: boolean
  enableSearch?: boolean
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  /** Actions to render in the toolbar - array of button configs or custom ReactNodes */
  actions?: (DataTableAction | ReactNode)[]
}

// Helper to check if an item is a DataTableAction
function isDataTableAction(item: DataTableAction | ReactNode): item is DataTableAction {
  return typeof item === 'object' && item !== null && 'onClick' in item && 'label' in item
}

function DataTableBase<TData>({
  table,
  columns,
  loading,
  emptyMessage = 'No results.',
  onRowClick,
  enableSorting = false,
  enableColumnVisibility = false,
  enableSearch = false,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  actions,
}: DataTableBaseProps<TData>) {
  const compactTables = useCompactTables()
  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex + 1
  const hasToolbar = enableSearch || enableColumnVisibility || actions

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {hasToolbar && (
        <div className="flex items-center justify-between gap-2">
          {/* Search */}
          {enableSearch && onSearchChange && (
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          )}

          <div className="flex-1" />

          {/* Column Visibility */}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  // TODO: size="sm"
                  // size="sm"
                >
                  <Columns2 className="mr-2 h-4 w-4" />
                  Customize Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {typeof column.columnDef.header === 'string'
                        ? column.columnDef.header
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Custom Actions */}
          {actions?.map((action, index) =>
            isDataTableAction(action) ? (
              <Button
                key={index}
                variant={action.variant ?? 'outline'}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
              </Button>
            ) : (
              action
            )
          )}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = enableSorting && header.column.getCanSort()
                  const sorted = header.column.getIsSorted()

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        compactTables && 'h-8 py-1 text-xs',
                        canSort && 'cursor-pointer select-none hover:bg-muted/50'
                      )}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted && (
                            <span className="ml-1">
                              {sorted === 'asc' ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => onRowClick?.(row.original)}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cn(compactTables && 'py-1 text-xs')}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {pageCount}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// DataTable - Client-side (default)
// ============================================================================

interface DataTableProps<TData, TValue> {
  /** Unique ID for persisting table state (sorting, column visibility) */
  tableId?: string
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
  onRowClick?: (row: TData) => void
  loading?: boolean
  emptyMessage?: ReactNode
  /** Enable sorting */
  enableSorting?: boolean
  /** Enable column visibility toggle */
  enableColumnVisibility?: boolean
  /** Enable global search filter */
  enableSearch?: boolean
  /** Search placeholder text */
  searchPlaceholder?: string
  /** Initial column visibility state */
  initialColumnVisibility?: VisibilityState
  /** Actions to render in the toolbar (e.g., create button) */
  actions?: (DataTableAction | ReactNode)[]
}

// Stable default values to prevent infinite re-renders
const EMPTY_SORTING: SortingState = []
const EMPTY_VISIBILITY: VisibilityState = {}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize,
  onRowClick,
  loading,
  emptyMessage,
  enableSorting = false,
  enableColumnVisibility = false,
  enableSearch = false,
  searchPlaceholder,
  initialColumnVisibility = EMPTY_VISIBILITY,
  actions,
  tableId,
}: DataTableProps<TData, TValue>) {
  const defaultPageSize = useTablePageSize()
  const effectivePageSize = pageSize ?? defaultPageSize

  // Persisted state from store (when tableId is provided)
  const persistedSorting = useTableSorting(tableId)
  const persistedColumnVisibility = useTableColumnVisibility(tableId)
  const setPersistedSorting = useSetTableSorting()
  const setPersistedColumnVisibility = useSetTableColumnVisibility()

  // Local state (fallback when tableId is not provided)
  const [localSorting, setLocalSorting] = useState<SortingState>(EMPTY_SORTING)
  const [localColumnVisibility, setLocalColumnVisibility] =
    useState<VisibilityState>(initialColumnVisibility)
  const [globalFilter, setGlobalFilter] = useState('')

  // Use persisted state if tableId is provided, otherwise use local state
  const sorting = tableId ? (persistedSorting ?? EMPTY_SORTING) : localSorting
  const columnVisibility = tableId
    ? (persistedColumnVisibility ?? initialColumnVisibility)
    : localColumnVisibility

  const handleSortingChange = (updater: SortingState | ((old: SortingState) => SortingState)) => {
    const newSorting = typeof updater === 'function' ? updater(sorting) : updater
    if (tableId) {
      setPersistedSorting(tableId, newSorting)
    } else {
      setLocalSorting(newSorting)
    }
  }

  const handleColumnVisibilityChange = (
    updater: VisibilityState | ((old: VisibilityState) => VisibilityState)
  ) => {
    const newVisibility = typeof updater === 'function' ? updater(columnVisibility) : updater
    if (tableId) {
      setPersistedColumnVisibility(tableId, newVisibility)
    } else {
      setLocalColumnVisibility(newVisibility)
    }
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    ...(enableSorting ? { getSortedRowModel: getSortedRowModel() } : {}),
    ...(enableSearch ? { getFilteredRowModel: getFilteredRowModel() } : {}),
    enableMultiSort: true,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
      pagination: { pageIndex: 0, pageSize: effectivePageSize },
    },
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onGlobalFilterChange: setGlobalFilter,
  })

  return (
    <DataTableBase
      table={table}
      columns={columns as ColumnDef<TData, unknown>[]}
      loading={loading}
      emptyMessage={emptyMessage}
      onRowClick={onRowClick}
      enableSorting={enableSorting}
      enableColumnVisibility={enableColumnVisibility}
      enableSearch={enableSearch}
      searchPlaceholder={searchPlaceholder}
      searchValue={globalFilter}
      onSearchChange={setGlobalFilter}
      actions={actions}
    />
  )
}

// ============================================================================
// ServerDataTable - Server-side pagination/sorting/search
// ============================================================================

interface ServerPagination {
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
}

interface ServerDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pagination: ServerPagination
  onRowClick?: (row: TData) => void
  loading?: boolean
  emptyMessage?: ReactNode
  /** Enable sorting (will call onSortChange) */
  enableSorting?: boolean
  /** Callback when sort changes */
  onSortChange?: (sortBy: string | undefined, sortOrder: 'ASC' | 'DESC' | undefined) => void
  /** Enable column visibility toggle */
  enableColumnVisibility?: boolean
  /** Enable search (controlled via searchValue + onSearchChange) */
  enableSearch?: boolean
  /** Search placeholder text */
  searchPlaceholder?: string
  /** Current search value */
  searchValue?: string
  /** Callback when search changes */
  onSearchChange?: (value: string) => void
  /** Initial column visibility state */
  initialColumnVisibility?: VisibilityState
  /** Actions to render in the toolbar (e.g., create button) */
  actions?: (DataTableAction | ReactNode)[]
  /** Unique ID for persisting table state (sorting, column visibility) */
  tableId?: string
}

export function ServerDataTable<TData, TValue>({
  columns,
  data,
  pagination,
  onRowClick,
  loading,
  emptyMessage,
  enableSorting = false,
  onSortChange,
  enableColumnVisibility = false,
  enableSearch = false,
  searchPlaceholder,
  searchValue = '',
  onSearchChange,
  initialColumnVisibility = EMPTY_VISIBILITY,
  actions,
  tableId,
}: ServerDataTableProps<TData, TValue>) {
  // Persisted state from store (when tableId is provided)
  const persistedSorting = useTableSorting(tableId)
  const persistedColumnVisibility = useTableColumnVisibility(tableId)
  const setPersistedSorting = useSetTableSorting()
  const setPersistedColumnVisibility = useSetTableColumnVisibility()

  // Local state (fallback when tableId is not provided)
  const [localSorting, setLocalSorting] = useState<SortingState>(EMPTY_SORTING)
  const [localColumnVisibility, setLocalColumnVisibility] =
    useState<VisibilityState>(initialColumnVisibility)

  // Use persisted state if tableId is provided, otherwise use local state
  const sorting = tableId ? (persistedSorting ?? EMPTY_SORTING) : localSorting
  const columnVisibility = tableId
    ? (persistedColumnVisibility ?? initialColumnVisibility)
    : localColumnVisibility

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: enableSorting,
    enableMultiSort: true,
    pageCount: pagination.totalPages,
    state: {
      sorting,
      columnVisibility,
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize: pagination.pageSize,
      },
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater

      if (tableId) {
        setPersistedSorting(tableId, newSorting)
      } else {
        setLocalSorting(newSorting)
      }

      if (onSortChange) {
        if (newSorting.length > 0) {
          const sort = newSorting[0]
          onSortChange(sort.id, sort.desc ? 'DESC' : 'ASC')
        } else {
          onSortChange(undefined, undefined)
        }
      }
    },
    onColumnVisibilityChange: (updater) => {
      const newVisibility = typeof updater === 'function' ? updater(columnVisibility) : updater
      if (tableId) {
        setPersistedColumnVisibility(tableId, newVisibility)
      } else {
        setLocalColumnVisibility(newVisibility)
      }
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const currentState = {
          pageIndex: pagination.page - 1,
          pageSize: pagination.pageSize,
        }
        const newState = updater(currentState)
        pagination.onPageChange(newState.pageIndex + 1)
      }
    },
  })

  return (
    <DataTableBase
      table={table}
      columns={columns as ColumnDef<TData, unknown>[]}
      loading={loading}
      emptyMessage={emptyMessage}
      onRowClick={onRowClick}
      enableSorting={enableSorting}
      enableColumnVisibility={enableColumnVisibility}
      enableSearch={enableSearch}
      searchPlaceholder={searchPlaceholder}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={actions}
    />
  )
}
