import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  operatorLabels,
  operatorsByType,
  unaryOperators,
  type ColumnFilterValue,
  type ColumnFiltersMap,
  type FilterOperator,
  type FilterType,
} from '@/lib/column-filters'
import { cn } from '@/lib/utils'
import type { Column, Table as TanstackTable } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { Filter, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

// ============================================================================
// ColumnFilterPopover — Filter UI per column header
// ============================================================================

interface ColumnFilterPopoverProps<TData> {
  column: Column<TData, unknown>
  columnFilters: ColumnFiltersMap
  onFilterChange: (columnId: string, value: ColumnFilterValue | null) => void
}

export function ColumnFilterPopover<TData>({
  column,
  columnFilters,
  onFilterChange,
}: ColumnFilterPopoverProps<TData>) {
  const filterType = column.columnDef.meta?.filterType as FilterType | undefined
  if (!filterType) return null

  const columnId = column.id
  const activeFilter = columnFilters[columnId]
  const operators = operatorsByType[filterType]
  const filterOptions = column.columnDef.meta?.filterOptions

  return (
    <ColumnFilterPopoverInner
      columnId={columnId}
      filterType={filterType}
      operators={operators}
      filterOptions={filterOptions}
      activeFilter={activeFilter}
      onFilterChange={onFilterChange}
    />
  )
}

interface ColumnFilterPopoverInnerProps {
  columnId: string
  filterType: FilterType
  operators: FilterOperator[]
  filterOptions?: { value: string; label: string }[]
  activeFilter?: ColumnFilterValue
  onFilterChange: (columnId: string, value: ColumnFilterValue | null) => void
}

function ColumnFilterPopoverInner({
  columnId,
  filterType,
  operators,
  filterOptions,
  activeFilter,
  onFilterChange,
}: ColumnFilterPopoverInnerProps) {
  const [open, setOpen] = useState(false)
  const [operator, setOperator] = useState<FilterOperator>(activeFilter?.operator ?? operators[0])
  const [value, setValue] = useState<string | number | string[]>(activeFilter?.value ?? '')
  const [valueTo, setValueTo] = useState<string>(activeFilter?.valueTo ?? '')

  // Sync local state when activeFilter changes externally
  useEffect(() => {
    if (activeFilter) {
      setOperator(activeFilter.operator)
      setValue(activeFilter.value ?? '')
      setValueTo(activeFilter.valueTo ?? '')
    } else {
      setOperator(operators[0])
      setValue('')
      setValueTo('')
    }
  }, [activeFilter, operators])

  const isUnary = unaryOperators.has(operator)
  const isActive = !!activeFilter

  const handleApply = () => {
    if (isUnary) {
      onFilterChange(columnId, { operator })
    } else {
      onFilterChange(columnId, {
        operator,
        value: value || null,
        ...(operator === 'is_between' ? { valueTo: valueTo || null } : {}),
      })
    }
    setOpen(false)
  }

  const handleClear = () => {
    onFilterChange(columnId, null)
    setOperator(operators[0])
    setValue('')
    setValueTo('')
    setOpen(false)
  }

  const handleOperatorChange = (newOp: string) => {
    const op = newOp as FilterOperator
    setOperator(op)
    // Reset value when switching to/from unary or changing type
    if (unaryOperators.has(op)) {
      setValue('')
      setValueTo('')
    }
    // Reset to single value when switching away from is_any_of
    if (op !== 'is_any_of' && Array.isArray(value)) {
      setValue('')
    }
    // Initialize array for is_any_of
    if (op === 'is_any_of' && !Array.isArray(value)) {
      setValue([])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center rounded p-0.5 transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            isActive && 'text-primary'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Filter className="h-3 w-3" />
          {isActive && (
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-3 space-y-3"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Operator selector */}
        <Select value={operator} onValueChange={handleOperatorChange}>
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operators.map((op) => (
              <SelectItem key={op} value={op}>
                {operatorLabels[op]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Value input — conditional on filterType + operator */}
        {!isUnary && (
          <FilterValueInput
            filterType={filterType}
            operator={operator}
            value={value}
            valueTo={valueTo}
            onChange={setValue}
            onChangeValueTo={setValueTo}
            filterOptions={filterOptions}
          />
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" size="sm" onClick={handleClear}>
            Clear
          </Button>
          <Button size="sm" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// FilterValueInput — Renders the correct input for each filter type
// ============================================================================

interface FilterValueInputProps {
  filterType: FilterType
  operator: FilterOperator
  value: string | number | string[]
  valueTo: string
  onChange: (value: string | number | string[]) => void
  onChangeValueTo: (value: string) => void
  filterOptions?: { value: string; label: string }[]
}

function FilterValueInput({
  filterType,
  operator,
  value,
  valueTo,
  onChange,
  onChangeValueTo,
  filterOptions,
}: FilterValueInputProps) {
  if (filterType === 'string') {
    return (
      <Input
        placeholder="Filter value..."
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
      />
    )
  }

  if (filterType === 'number') {
    return (
      <Input
        type="number"
        placeholder="Filter value..."
        value={value === '' ? '' : Number(value)}
        onChange={(e) => onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
        autoFocus
      />
    )
  }

  if (filterType === 'date') {
    if (operator === 'is_between') {
      return (
        <div className="space-y-2">
          <DatePicker
            value={value ? dayjs(value as string).toDate() : undefined}
            onChange={(d) => onChange(d ? dayjs(d).format('YYYY-MM-DD') : '')}
            placeholder="From date"
          />
          <DatePicker
            value={valueTo ? dayjs(valueTo).toDate() : undefined}
            onChange={(d) => onChangeValueTo(d ? dayjs(d).format('YYYY-MM-DD') : '')}
            placeholder="To date"
          />
        </div>
      )
    }
    return (
      <DatePicker
        value={value ? dayjs(value as string).toDate() : undefined}
        onChange={(d) => onChange(d ? dayjs(d).format('YYYY-MM-DD') : '')}
        placeholder="Pick a date"
      />
    )
  }

  if (filterType === 'enum' && filterOptions) {
    if (operator === 'is_any_of') {
      const selected = Array.isArray(value) ? value : []
      return (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {filterOptions.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 py-1 px-1 rounded hover:bg-accent cursor-pointer"
            >
              <Checkbox
                checked={selected.includes(opt.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChange([...selected, opt.value])
                  } else {
                    onChange(selected.filter((v) => v !== opt.value))
                  }
                }}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      )
    }
    return (
      <Select value={String(value ?? '')} onValueChange={onChange}>
        <SelectTrigger size="sm" className="w-full">
          <SelectValue placeholder="Select value..." />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return null
}

// ============================================================================
// ActiveFilterChips — Shows active filters as removable badges in toolbar
// ============================================================================

interface ActiveFilterChipsProps<TData> {
  table: TanstackTable<TData>
  columnFilters: ColumnFiltersMap
  onRemove: (columnId: string) => void
  onClearAll: () => void
}

export function ActiveFilterChips<TData>({
  table,
  columnFilters,
  onRemove,
  onClearAll,
}: ActiveFilterChipsProps<TData>) {
  const entries = Object.entries(columnFilters)
  if (entries.length === 0) return null

  const getHeaderText = useCallback(
    (columnId: string) => {
      const column = table.getColumn(columnId)
      const header = column?.columnDef.header
      return typeof header === 'string' ? header : columnId
    },
    [table]
  )

  const formatValue = useCallback(
    (columnId: string, filter: ColumnFilterValue) => {
      if (unaryOperators.has(filter.operator)) return null

      const column = table.getColumn(columnId)
      const filterOptions = column?.columnDef.meta?.filterOptions

      if (Array.isArray(filter.value)) {
        if (filterOptions) {
          const labels = filter.value
            .map((v) => filterOptions.find((o) => o.value === v)?.label ?? v)
            .join(', ')
          return labels
        }
        return filter.value.join(', ')
      }

      if (filterOptions && filter.value) {
        return filterOptions.find((o) => o.value === String(filter.value))?.label ?? String(filter.value)
      }

      if (filter.operator === 'is_between' && filter.value && filter.valueTo) {
        return `${filter.value} — ${filter.valueTo}`
      }

      return filter.value != null ? String(filter.value) : null
    },
    [table]
  )

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {entries.map(([columnId, filter]) => (
        <Badge key={columnId} variant="secondary" className="gap-1 pr-1 font-normal">
          <span className="font-medium">{getHeaderText(columnId)}</span>
          <span className="text-muted-foreground">{operatorLabels[filter.operator]}</span>
          {formatValue(columnId, filter) && (
            <span className="max-w-32 truncate">{formatValue(columnId, filter)}</span>
          )}
          <button
            type="button"
            className="ml-0.5 rounded-sm p-0.5 hover:bg-accent"
            onClick={() => onRemove(columnId)}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {entries.length > 1 && (
        <Button variant="ghost" size="sm" onClick={onClearAll} className="text-xs h-6 px-2">
          Clear all
        </Button>
      )}
    </div>
  )
}
