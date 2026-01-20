import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
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

interface ServerPagination {
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
  onRowClick?: (row: TData) => void
  loading?: boolean
  emptyMessage?: ReactNode
  pagination?: ServerPagination
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize,
  onRowClick,
  loading,
  emptyMessage = 'No results.',
  pagination: serverPagination,
}: DataTableProps<TData, TValue>) {
  const compactTables = useCompactTables()
  const defaultPageSize = useTablePageSize()
  const effectivePageSize = serverPagination?.pageSize ?? pageSize ?? defaultPageSize

  const isManualPagination = !!serverPagination

  // Internal state for client-side pagination
  const [clientPageIndex, setClientPageIndex] = useState(0)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Only use client-side pagination when not manual
    ...(isManualPagination
      ? {
          manualPagination: true,
          pageCount: serverPagination.totalPages,
        }
      : {
          getPaginationRowModel: getPaginationRowModel(),
        }),
    state: {
      pagination: {
        pageIndex: isManualPagination ? serverPagination.page - 1 : clientPageIndex,
        pageSize: effectivePageSize,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const currentState = {
          pageIndex: isManualPagination ? serverPagination.page - 1 : clientPageIndex,
          pageSize: effectivePageSize,
        }
        const newState = updater(currentState)

        if (isManualPagination) {
          serverPagination.onPageChange(newState.pageIndex + 1)
        } else {
          setClientPageIndex(newState.pageIndex)
        }
      }
    },
  })

  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex + 1

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={cn(compactTables && 'h-8 py-1 text-xs')}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
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

      {/* Unified Pagination */}
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
