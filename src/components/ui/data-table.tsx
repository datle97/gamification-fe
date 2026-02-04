import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  type VisibilityState,
} from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns2,
  Loader2,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'

import {
  ActiveFilterChips,
  ColumnFilterPopover,
} from '@/components/common/column-filter-popover'
import { Checkbox } from '@/components/ui/checkbox'

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
import {
  columnFilterFn,
  columnFiltersToTanstack,
  tanstackToColumnFilters,
  type ColumnFilterValue,
  type ColumnFiltersMap,
} from '@/lib/column-filters'
import { cn } from '@/lib/utils'
import { useCompactTables, useTablePageSize } from '@/stores/settingsStore'
import {
  useSetTableColumnFilters,
  useSetTableColumnVisibility,
  useSetTableSorting,
  useTableColumnFilters,
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
  /** Enable row selection with checkboxes */
  enableRowSelection?: boolean
  /** Selection toolbar content - rendered when rows are selected */
  selectionActions?: (selectedCount: number) => ReactNode
  /** Enable column-level filters */
  enableColumnFilters?: boolean
  /** Current column filters state */
  columnFilters?: ColumnFiltersMap
  /** Callback when a column filter changes */
  onColumnFilterChange?: (columnId: string, value: ColumnFilterValue | null) => void
  /** Callback to clear all column filters */
  onClearAllColumnFilters?: () => void
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
  enableRowSelection = false,
  selectionActions,
  enableColumnFilters = false,
  columnFilters,
  onColumnFilterChange,
  onClearAllColumnFilters,
}: DataTableBaseProps<TData>) {
  const compactTables = useCompactTables()
  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex + 1
  const hasToolbar = enableSearch || enableColumnVisibility || actions || enableColumnFilters
  const selectedCount = enableRowSelection
    ? Object.keys(table.getState().rowSelection ?? {}).length
    : 0
  const activeFilterCount = columnFilters ? Object.keys(columnFilters).length : 0

  return (
    <div className="space-y-4">
      {/* Selection toolbar */}
      {enableRowSelection && selectedCount > 0 && selectionActions && (
        <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <div className="flex-1" />
          {selectionActions(selectedCount)}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetRowSelection()}
            className="text-xs"
          >
            Clear selection
          </Button>
        </div>
      )}

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

          {/* Active filter chips */}
          {enableColumnFilters && columnFilters && activeFilterCount > 0 && onColumnFilterChange && onClearAllColumnFilters && (
            <ActiveFilterChips
              table={table}
              columnFilters={columnFilters}
              onRemove={(columnId) => onColumnFilterChange(columnId, null)}
              onClearAll={onClearAllColumnFilters}
            />
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
                  const hasFilter =
                    enableColumnFilters &&
                    onColumnFilterChange &&
                    columnFilters &&
                    !!header.column.columnDef.meta?.filterType

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(compactTables && 'h-8 py-1 text-xs')}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="group/header flex items-center gap-1">
                          <div
                            className={cn(
                              'flex items-center gap-1',
                              canSort && 'cursor-pointer select-none hover:text-foreground'
                            )}
                            onClick={
                              canSort ? header.column.getToggleSortingHandler() : undefined
                            }
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {sorted && (
                              <span className="ml-0.5">
                                {sorted === 'asc' ? (
                                  <ArrowUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ArrowDown className="h-3.5 w-3.5" />
                                )}
                              </span>
                            )}
                          </div>

                          {/* Column filter popover — visible on hover, always visible when active */}
                          {hasFilter && (
                            <span
                              className={cn(
                                'relative transition-opacity',
                                !columnFilters[header.column.id] &&
                                  'opacity-0 group-hover/header:opacity-100'
                              )}
                            >
                              <ColumnFilterPopover
                                column={header.column}
                                columnFilters={columnFilters}
                                onFilterChange={onColumnFilterChange}
                              />
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
        <div className="flex items-center justify-end gap-4 px-2">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {pageCount}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.firstPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.lastPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
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
  /** Enable row selection with checkboxes */
  enableRowSelection?: boolean
  /** Controlled row selection state */
  rowSelection?: RowSelectionState
  /** Callback when row selection changes */
  onRowSelectionChange?: (state: RowSelectionState) => void
  /** Custom row ID accessor (defaults to row index) */
  getRowId?: (row: TData) => string
  /** Selection toolbar content - rendered when rows are selected */
  selectionActions?: (selectedCount: number) => ReactNode
  /** Enable column-level filters */
  enableColumnFilters?: boolean
}

// Stable default values to prevent infinite re-renders
const EMPTY_SORTING: SortingState = []
const EMPTY_VISIBILITY: VisibilityState = {}
const EMPTY_COLUMN_FILTERS: ColumnFiltersMap = {}

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
  enableColumnFilters = false,
  searchPlaceholder,
  initialColumnVisibility = EMPTY_VISIBILITY,
  actions,
  tableId,
  enableRowSelection = false,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  getRowId,
  selectionActions,
}: DataTableProps<TData, TValue>) {
  const defaultPageSize = useTablePageSize()
  const effectivePageSize = pageSize ?? defaultPageSize

  // Persisted state from store (when tableId is provided)
  const persistedSorting = useTableSorting(tableId)
  const persistedColumnVisibility = useTableColumnVisibility(tableId)
  const persistedColumnFilters = useTableColumnFilters(tableId)
  const setPersistedSorting = useSetTableSorting()
  const setPersistedColumnVisibility = useSetTableColumnVisibility()
  const setPersistedColumnFilters = useSetTableColumnFilters()

  // Local state (fallback when tableId is not provided)
  const [localSorting, setLocalSorting] = useState<SortingState>(EMPTY_SORTING)
  const [localColumnVisibility, setLocalColumnVisibility] =
    useState<VisibilityState>(initialColumnVisibility)
  const [globalFilter, setGlobalFilter] = useState('')
  const [localRowSelection, setLocalRowSelection] = useState<RowSelectionState>({})
  const [localColumnFilters, setLocalColumnFilters] =
    useState<ColumnFiltersMap>(EMPTY_COLUMN_FILTERS)

  // Use persisted state if tableId is provided, otherwise use local state
  const sorting = tableId ? (persistedSorting ?? EMPTY_SORTING) : localSorting
  const columnVisibility = tableId
    ? (persistedColumnVisibility ?? initialColumnVisibility)
    : localColumnVisibility
  const rowSelection = controlledRowSelection ?? localRowSelection
  const columnFiltersMap = tableId
    ? (persistedColumnFilters ?? EMPTY_COLUMN_FILTERS)
    : localColumnFilters

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

  const handleRowSelectionChange = (
    updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)
  ) => {
    const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater
    if (onRowSelectionChange) {
      onRowSelectionChange(newSelection)
    } else {
      setLocalRowSelection(newSelection)
    }
  }

  // Column filter change handler
  const handleColumnFilterChange = useCallback(
    (columnId: string, value: ColumnFilterValue | null) => {
      const next = { ...columnFiltersMap }
      if (value === null) {
        delete next[columnId]
      } else {
        next[columnId] = value
      }
      if (tableId) {
        setPersistedColumnFilters(tableId, next)
      } else {
        setLocalColumnFilters(next)
      }
    },
    [columnFiltersMap, tableId, setPersistedColumnFilters]
  )

  const handleClearAllColumnFilters = useCallback(() => {
    if (tableId) {
      setPersistedColumnFilters(tableId, {})
    } else {
      setLocalColumnFilters(EMPTY_COLUMN_FILTERS)
    }
  }, [tableId, setPersistedColumnFilters])

  // Prepend checkbox column when row selection is enabled
  const allColumns = useMemo(() => {
    if (!enableRowSelection) return columns
    const selectColumn: ColumnDef<TData, TValue> = {
      id: '_select',
      header: ({ table: t }) => (
        <Checkbox
          checked={t.getIsAllPageRowsSelected()}
          onCheckedChange={(checked) => t.toggleAllPageRowsSelected(!!checked)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(!!checked)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }
    return [selectColumn, ...columns]
  }, [columns, enableRowSelection])

  // Convert our filter map to TanStack's format
  const tanstackColumnFilters = useMemo(
    () => (enableColumnFilters ? columnFiltersToTanstack(columnFiltersMap) : []),
    [enableColumnFilters, columnFiltersMap]
  )

  const needsFilteredModel = enableSearch || enableColumnFilters

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    ...(enableSorting ? { getSortedRowModel: getSortedRowModel() } : {}),
    ...(needsFilteredModel ? { getFilteredRowModel: getFilteredRowModel() } : {}),
    enableMultiSort: true,
    enableRowSelection,
    ...(getRowId ? { getRowId } : {}),
    filterFns: {
      columnFilter: columnFilterFn,
    },
    initialState: {
      pagination: { pageIndex: 0, pageSize: effectivePageSize },
    },
    state: {
      sorting,
      columnVisibility,
      globalFilter,
      ...(enableColumnFilters ? { columnFilters: tanstackColumnFilters } : {}),
      ...(enableRowSelection ? { rowSelection } : {}),
    },
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onGlobalFilterChange: setGlobalFilter,
    ...(enableColumnFilters
      ? {
          onColumnFiltersChange: (updater) => {
            const currentTanstack = tanstackColumnFilters
            const newTanstack =
              typeof updater === 'function' ? updater(currentTanstack) : updater
            const newMap = tanstackToColumnFilters(newTanstack)
            if (tableId) {
              setPersistedColumnFilters(tableId, newMap)
            } else {
              setLocalColumnFilters(newMap)
            }
          },
        }
      : {}),
    ...(enableRowSelection ? { onRowSelectionChange: handleRowSelectionChange } : {}),
  })

  return (
    <DataTableBase
      table={table}
      columns={allColumns as ColumnDef<TData, unknown>[]}
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
      enableRowSelection={enableRowSelection}
      selectionActions={selectionActions}
      enableColumnFilters={enableColumnFilters}
      columnFilters={columnFiltersMap}
      onColumnFilterChange={handleColumnFilterChange}
      onClearAllColumnFilters={handleClearAllColumnFilters}
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
  /** Enable column-level filters (controlled via columnFilters + onColumnFilterChange) */
  enableColumnFilters?: boolean
  /** Controlled column filters state */
  columnFilters?: ColumnFiltersMap
  /** Callback when column filters change */
  onColumnFilterChange?: (filters: ColumnFiltersMap) => void
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
  enableColumnFilters = false,
  columnFilters: controlledColumnFilters,
  onColumnFilterChange: onControlledColumnFilterChange,
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

  const columnFiltersMap = controlledColumnFilters ?? EMPTY_COLUMN_FILTERS

  const handleColumnFilterChange = useCallback(
    (columnId: string, value: ColumnFilterValue | null) => {
      if (!onControlledColumnFilterChange) return
      const next = { ...columnFiltersMap }
      if (value === null) {
        delete next[columnId]
      } else {
        next[columnId] = value
      }
      onControlledColumnFilterChange(next)
    },
    [columnFiltersMap, onControlledColumnFilterChange]
  )

  const handleClearAllColumnFilters = useCallback(() => {
    onControlledColumnFilterChange?.({})
  }, [onControlledColumnFilterChange])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: enableSorting,
    enableMultiSort: true,
    pageCount: pagination.totalPages,
    filterFns: {
      columnFilter: columnFilterFn,
    },
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
      enableColumnFilters={enableColumnFilters}
      columnFilters={columnFiltersMap}
      onColumnFilterChange={handleColumnFilterChange}
      onClearAllColumnFilters={handleClearAllColumnFilters}
    />
  )
}
