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
import { useCallback, useEffect, useRef, useState } from 'react'

// ============================================================================
// Helpers
// ============================================================================

/** Check if the active filter has an empty multi-select value → should be cleared */
function isEmptyMultiSelect(filter: ColumnFilterValue | undefined): boolean {
  return !!filter && Array.isArray(filter.value) && filter.value.length === 0
}

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

  // Get faceted unique values for string is/is_not multi-select
  const facetedUniqueValues = column.getFacetedUniqueValues()

  return (
    <ColumnFilterPopoverWrapper
      columnId={columnId}
      filterType={filterType}
      operators={operators}
      filterOptions={filterOptions}
      facetedUniqueValues={facetedUniqueValues}
      activeFilter={activeFilter}
      onFilterChange={onFilterChange}
    />
  )
}

// ============================================================================
// Shared props for filter content
// ============================================================================

interface ColumnFilterContentProps {
  columnId: string
  filterType: FilterType
  operators: FilterOperator[]
  filterOptions?: { value: string; label: string }[]
  facetedUniqueValues: Map<unknown, number>
  activeFilter?: ColumnFilterValue
  onFilterChange: (columnId: string, value: ColumnFilterValue | null) => void
}

// ============================================================================
// ColumnFilterPopoverWrapper — Popover with filter icon trigger (used in headers)
// ============================================================================

function ColumnFilterPopoverWrapper({
  columnId,
  filterType,
  operators,
  filterOptions,
  facetedUniqueValues,
  activeFilter,
  onFilterChange,
}: ColumnFilterContentProps) {
  const isActive = !!activeFilter
  const activeFilterRef = useRef(activeFilter)
  useEffect(() => { activeFilterRef.current = activeFilter }, [activeFilter])

  const handleOpenChange = (open: boolean) => {
    // On close: clear filter if multi-select value is empty
    if (!open && isEmptyMultiSelect(activeFilterRef.current)) {
      onFilterChange(columnId, null)
    }
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
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
        <ColumnFilterContent
          columnId={columnId}
          filterType={filterType}
          operators={operators}
          filterOptions={filterOptions}
          facetedUniqueValues={facetedUniqueValues}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
        />
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// ColumnFilterContent — Reusable filter form (operator + value + clear)
// ============================================================================

function ColumnFilterContent({
  columnId,
  filterType,
  operators,
  filterOptions,
  facetedUniqueValues,
  activeFilter,
  onFilterChange,
}: ColumnFilterContentProps) {
  const isMultiSelectOp = (op: FilterOperator) =>
    filterType === 'enum' || ((op === 'is' || op === 'is_not') && filterType === 'string')
  const getEmptyValue = (op: FilterOperator): string | string[] =>
    isMultiSelectOp(op) ? [] : ''

  const initialOp = activeFilter?.operator ?? operators[0]
  const [operator, setOperator] = useState<FilterOperator>(initialOp)
  const [value, setValue] = useState<string | number | string[]>(activeFilter?.value ?? getEmptyValue(initialOp))
  const [valueTo, setValueTo] = useState<string>(activeFilter?.valueTo ?? '')
  const isActive = !!activeFilter

  // Debounce timer for text/number inputs
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const applyFilter = useCallback(
    (op: FilterOperator, val?: string | number | string[] | null, valTo?: string | null) => {
      if (unaryOperators.has(op)) {
        onFilterChange(columnId, { operator: op })
      } else {
        onFilterChange(columnId, {
          operator: op,
          value: val || null,
          ...(op === 'is_between' ? { valueTo: valTo || null } : {}),
        })
      }
    },
    [columnId, onFilterChange]
  )

  const applyDebounced = useCallback(
    (op: FilterOperator, val: string | number | string[] | null, valTo?: string | null) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => applyFilter(op, val, valTo), 300)
    },
    [applyFilter]
  )

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const handleOperatorChange = (newOp: string) => {
    const op = newOp as FilterOperator
    setOperator(op)

    if (unaryOperators.has(op)) {
      // Unary → instant apply
      setValue('')
      setValueTo('')
      applyFilter(op)
    } else if (isMultiSelectOp(op) !== Array.isArray(value)) {
      // Switching between multi-select and text → reset value, clear filter
      const empty = getEmptyValue(op)
      setValue(empty)
      onFilterChange(columnId, null)
    }
  }

  // Instant apply handler for multi-select (checkbox) changes
  const handleMultiSelectChange = (newValue: string[]) => {
    setValue(newValue)
    applyFilter(operator, newValue)
  }

  // Instant apply handler for date changes
  const handleDateChange = (newValue: string) => {
    setValue(newValue)
    if (newValue) applyFilter(operator, newValue, valueTo)
    else onFilterChange(columnId, null)
  }

  const handleDateToChange = (newValueTo: string) => {
    setValueTo(newValueTo)
    if (value && newValueTo) applyFilter(operator, value, newValueTo)
  }

  // Debounced handler for text/number input
  const handleTextChange = (newValue: string | number) => {
    setValue(newValue)
    if (newValue === '' || newValue === null) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      onFilterChange(columnId, null)
    } else {
      applyDebounced(operator, newValue)
    }
  }

  return (
    <>
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
      {!unaryOperators.has(operator) && (
        <FilterValueInput
          filterType={filterType}
          operator={operator}
          value={value}
          valueTo={valueTo}
          onTextChange={handleTextChange}
          onMultiSelectChange={handleMultiSelectChange}
          onDateChange={handleDateChange}
          onDateToChange={handleDateToChange}
          filterOptions={filterOptions}
          facetedUniqueValues={facetedUniqueValues}
        />
      )}

      {/* Clear filter link when active */}
      {isActive && (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => {
            onFilterChange(columnId, null)
            setOperator(operators[0])
            setValue(getEmptyValue(operators[0]))
            setValueTo('')
          }}
        >
          Clear filter
        </button>
      )}
    </>
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
  onTextChange: (value: string | number) => void
  onMultiSelectChange: (value: string[]) => void
  onDateChange: (value: string) => void
  onDateToChange: (value: string) => void
  filterOptions?: { value: string; label: string }[]
  facetedUniqueValues: Map<unknown, number>
}

function CheckboxList({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (value: string[]) => void
}) {
  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {options.map((opt) => (
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
          <span className="text-sm truncate">{opt.label}</span>
        </label>
      ))}
    </div>
  )
}

function FilterValueInput({
  filterType,
  operator,
  value,
  valueTo,
  onTextChange,
  onMultiSelectChange,
  onDateChange,
  onDateToChange,
  filterOptions,
  facetedUniqueValues,
}: FilterValueInputProps) {
  if (filterType === 'string') {
    if (operator === 'is' || operator === 'is_not') {
      const selected = Array.isArray(value) ? value : []
      const options = Array.from(facetedUniqueValues.keys())
        .filter((v): v is string => typeof v === 'string' && v !== '')
        .sort()
        .map((v) => ({ value: v, label: v }))
      return <CheckboxList options={options} selected={selected} onChange={onMultiSelectChange} />
    }
    return (
      <Input
        placeholder="Filter value..."
        value={String(value ?? '')}
        onChange={(e) => onTextChange(e.target.value)}
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
        onChange={(e) => onTextChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
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
            onChange={(d) => onDateChange(d ? dayjs(d).format('YYYY-MM-DD') : '')}
            placeholder="From date"
          />
          <DatePicker
            value={valueTo ? dayjs(valueTo).toDate() : undefined}
            onChange={(d) => onDateToChange(d ? dayjs(d).format('YYYY-MM-DD') : '')}
            placeholder="To date"
          />
        </div>
      )
    }
    return (
      <DatePicker
        value={value ? dayjs(value as string).toDate() : undefined}
        onChange={(d) => onDateChange(d ? dayjs(d).format('YYYY-MM-DD') : '')}
        placeholder="Pick a date"
      />
    )
  }

  if (filterType === 'enum' && filterOptions) {
    const selected = Array.isArray(value) ? value : []
    return <CheckboxList options={filterOptions} selected={selected} onChange={onMultiSelectChange} />
  }

  return null
}

// ============================================================================
// ActiveFilterChips — Shows active filters as removable badges in toolbar
// ============================================================================

interface ActiveFilterChipsProps<TData> {
  table: TanstackTable<TData>
  columnFilters: ColumnFiltersMap
  onFilterChange: (columnId: string, value: ColumnFilterValue | null) => void
  onClearAll: () => void
}

export function ActiveFilterChips<TData>({
  table,
  columnFilters,
  onFilterChange,
  onClearAll,
}: ActiveFilterChipsProps<TData>) {
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
        if (filter.value.length === 0) return null
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

  const entries = Object.entries(columnFilters)
  if (entries.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {entries.map(([columnId, filter]) => (
        <FilterChip
          key={columnId}
          columnId={columnId}
          filter={filter}
          table={table}
          getHeaderText={getHeaderText}
          formatValue={formatValue}
          onFilterChange={onFilterChange}
        />
      ))}
      {entries.length > 1 && (
        <Button variant="ghost" size="sm" onClick={onClearAll} className="text-xs h-6 px-2">
          Clear all
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// FilterChip — Single filter chip with popover
// ============================================================================

function FilterChip<TData>({
  columnId,
  filter,
  table,
  getHeaderText,
  formatValue,
  onFilterChange,
}: {
  columnId: string
  filter: ColumnFilterValue
  table: TanstackTable<TData>
  getHeaderText: (columnId: string) => string
  formatValue: (columnId: string, filter: ColumnFilterValue) => string | null
  onFilterChange: (columnId: string, value: ColumnFilterValue | null) => void
}) {
  const column = table.getColumn(columnId)
  const filterType = column?.columnDef.meta?.filterType as FilterType | undefined
  const filterOptions = column?.columnDef.meta?.filterOptions as { value: string; label: string }[] | undefined
  const operators = filterType ? operatorsByType[filterType] : []
  const facetedUniqueValues = column?.getFacetedUniqueValues() ?? new Map()
  const displayValue = formatValue(columnId, filter)

  // Use ref to access latest filter in onOpenChange without stale closure
  const filterRef = useRef(filter)
  useEffect(() => { filterRef.current = filter }, [filter])

  const handleOpenChange = (open: boolean) => {
    // On close: clear filter if multi-select value is empty
    if (!open && isEmptyMultiSelect(filterRef.current)) {
      onFilterChange(columnId, null)
    }
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
      <Badge variant="secondary" className="gap-1 pr-1 font-normal hover:bg-secondary/70 transition-colors">
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
          >
            <span className="font-medium">{getHeaderText(columnId)}</span>
            <span className="text-muted-foreground">{operatorLabels[filter.operator]}</span>
            {displayValue && (
              <span className="max-w-32 truncate">{displayValue}</span>
            )}
          </button>
        </PopoverTrigger>
        <button
          type="button"
          className="ml-0.5 rounded-sm p-0.5 hover:bg-accent"
          onClick={() => onFilterChange(columnId, null)}
        >
          <X className="h-3 w-3" />
        </button>
      </Badge>
      {filterType && (
        <PopoverContent
          className="w-72 p-3 space-y-3"
          align="start"
          onClick={(e) => e.stopPropagation()}
        >
          <ColumnFilterContent
            columnId={columnId}
            filterType={filterType}
            operators={operators}
            filterOptions={filterOptions}
            facetedUniqueValues={facetedUniqueValues}
            activeFilter={filter}
            onFilterChange={onFilterChange}
          />
        </PopoverContent>
      )}
    </Popover>
  )
}
