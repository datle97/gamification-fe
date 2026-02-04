import type { FilterEnumOption, FilterType } from '@/lib/column-filters'
import type { FilterFn, RowData } from '@tanstack/react-table'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    filterType?: FilterType
    filterOptions?: FilterEnumOption[]
  }

  interface FilterFns {
    columnFilter: FilterFn<unknown>
  }
}
