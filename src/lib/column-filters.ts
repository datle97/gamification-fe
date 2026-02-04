import type {
  ColumnFiltersState as TanstackColumnFiltersState,
  FilterFn,
} from '@tanstack/react-table'
import dayjs from 'dayjs'

// ============================================================================
// Filter Type Definitions
// ============================================================================

export type FilterType = 'string' | 'number' | 'date' | 'enum' | 'boolean'

export type StringOperator =
  | 'is'
  | 'is_not'
  | 'contains'
  | 'does_not_contain'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'

export type NumberOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'is_empty'
  | 'is_not_empty'

export type DateOperator = 'is' | 'is_before' | 'is_after' | 'is_between'

export type EnumOperator = 'is' | 'is_not' | 'is_any_of'

export type BooleanOperator = 'is_true' | 'is_false'

export type FilterOperator =
  | StringOperator
  | NumberOperator
  | DateOperator
  | EnumOperator
  | BooleanOperator

// ============================================================================
// Operator Configuration
// ============================================================================

export const operatorLabels: Record<FilterOperator, string> = {
  is: 'is',
  is_not: 'is not',
  contains: 'contains',
  does_not_contain: 'does not contain',
  starts_with: 'starts with',
  ends_with: 'ends with',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
  eq: '=',
  neq: '\u2260',
  gt: '>',
  gte: '\u2265',
  lt: '<',
  lte: '\u2264',
  is_before: 'is before',
  is_after: 'is after',
  is_between: 'is between',
  is_any_of: 'is any of',
  is_true: 'is true',
  is_false: 'is false',
}

export const unaryOperators: Set<FilterOperator> = new Set([
  'is_empty',
  'is_not_empty',
  'is_true',
  'is_false',
])

export const operatorsByType: Record<FilterType, FilterOperator[]> = {
  string: [
    'is',
    'is_not',
    'contains',
    'does_not_contain',
    'starts_with',
    'ends_with',
    'is_empty',
    'is_not_empty',
  ],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'is_empty', 'is_not_empty'],
  date: ['is', 'is_before', 'is_after', 'is_between'],
  enum: ['is', 'is_not', 'is_any_of'],
  boolean: ['is_true', 'is_false'],
}

// ============================================================================
// Filter Enum Option (for badge/select columns)
// ============================================================================

export interface FilterEnumOption {
  value: string
  label: string
}

// ============================================================================
// Filter Value (active filter state for one column)
// ============================================================================

export interface ColumnFilterValue {
  operator: FilterOperator
  value?: string | number | string[] | null
  valueTo?: string | null
}

export type ColumnFiltersMap = Record<string, ColumnFilterValue>

// ============================================================================
// Bridge: Convert between our ColumnFiltersMap and TanStack's ColumnFiltersState
// ============================================================================

export function columnFiltersToTanstack(filters: ColumnFiltersMap): TanstackColumnFiltersState {
  return Object.entries(filters).map(([id, value]) => ({ id, value }))
}

export function tanstackToColumnFilters(tanstack: TanstackColumnFiltersState): ColumnFiltersMap {
  const result: ColumnFiltersMap = {}
  for (const { id, value } of tanstack) {
    result[id] = value as ColumnFilterValue
  }
  return result
}

// ============================================================================
// Custom Filter Function for TanStack Table
// ============================================================================

export const columnFilterFn: FilterFn<unknown> = (row, columnId, filterValue: ColumnFilterValue) => {
  if (!filterValue || !filterValue.operator) return true

  const cellValue = row.getValue(columnId)
  const { operator, value, valueTo } = filterValue

  // Unary operators
  if (operator === 'is_empty') return cellValue == null || cellValue === ''
  if (operator === 'is_not_empty') return cellValue != null && cellValue !== ''
  if (operator === 'is_true') return cellValue === true
  if (operator === 'is_false') return cellValue === false

  // String operators
  const stringOps: FilterOperator[] = [
    'is',
    'is_not',
    'contains',
    'does_not_contain',
    'starts_with',
    'ends_with',
  ]
  if (stringOps.includes(operator)) {
    const cellStr = String(cellValue ?? '').toLowerCase()
    const filterStr = String(value ?? '').toLowerCase()

    switch (operator) {
      case 'is':
        return cellStr === filterStr
      case 'is_not':
        return cellStr !== filterStr
      case 'contains':
        return cellStr.includes(filterStr)
      case 'does_not_contain':
        return !cellStr.includes(filterStr)
      case 'starts_with':
        return cellStr.startsWith(filterStr)
      case 'ends_with':
        return cellStr.endsWith(filterStr)
    }
  }

  // Number operators
  const numberOps: FilterOperator[] = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte']
  if (numberOps.includes(operator)) {
    const cellNum = Number(cellValue)
    const filterNum = Number(value)
    if (isNaN(cellNum) || isNaN(filterNum)) return true

    switch (operator) {
      case 'eq':
        return cellNum === filterNum
      case 'neq':
        return cellNum !== filterNum
      case 'gt':
        return cellNum > filterNum
      case 'gte':
        return cellNum >= filterNum
      case 'lt':
        return cellNum < filterNum
      case 'lte':
        return cellNum <= filterNum
    }
  }

  // Date operators
  const dateOps: FilterOperator[] = ['is_before', 'is_after', 'is_between']
  if (dateOps.includes(operator) || (operator === 'is' && typeof value === 'string')) {
    const cellDate = dayjs(cellValue as string)
    if (!cellDate.isValid()) return true

    switch (operator) {
      case 'is':
        return cellDate.isSame(dayjs(value as string), 'day')
      case 'is_before':
        return cellDate.isBefore(dayjs(value as string), 'day')
      case 'is_after':
        return cellDate.isAfter(dayjs(value as string), 'day')
      case 'is_between': {
        if (!value || !valueTo) return true
        return (
          cellDate.isAfter(dayjs(value as string).subtract(1, 'day'), 'day') &&
          cellDate.isBefore(dayjs(valueTo).add(1, 'day'), 'day')
        )
      }
    }
  }

  // Enum: is_any_of
  if (operator === 'is_any_of' && Array.isArray(value)) {
    return value.includes(String(cellValue))
  }

  return true
}
