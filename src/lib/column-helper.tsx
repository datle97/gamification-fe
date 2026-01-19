import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { TextCell, DateCell, DateRangeCell, LinkCell, BadgeCell } from '@/components/common/cells'
import {
  EditableTextCell,
  EditableNumberCell,
  EditableToggleCell,
  EditableSelectCell,
} from '@/components/common/editable-cells'

type UpdateFn<T, V> = (row: T, value: V) => Promise<void>
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

// Text column variants
type TextVariant = 'default' | 'primary' | 'secondary' | 'muted'

const textVariantStyles: Record<TextVariant, string> = {
  default: '',
  primary: 'font-medium',
  secondary: 'text-sm text-muted-foreground',
  muted: 'text-muted-foreground',
}

interface EditableSelectOptions<T extends string> {
  options: { value: T; label: string }[]
  labels: Record<T, string>
  variants?: Partial<Record<T, BadgeVariant>>
}

export function createColumnHelper<TData extends Record<string, unknown>>() {
  return {
    // Display columns
    text: <TKey extends keyof TData & string>(
      key: TKey,
      header: string,
      options?: { variant?: TextVariant }
    ): ColumnDef<TData> => ({
      accessorKey: key,
      header,
      cell: ({ row }) => (
        <TextCell
          value={row.original[key] as string}
          className={textVariantStyles[options?.variant ?? 'default']}
        />
      ),
    }),

    date: <TKey extends keyof TData & string>(
      key: TKey,
      header: string,
      options?: { showTime?: boolean }
    ): ColumnDef<TData> => ({
      accessorKey: key,
      header,
      cell: ({ row }) => (
        <DateCell value={row.original[key] as string} showTime={options?.showTime} />
      ),
    }),

    dateRange: <TStartKey extends keyof TData & string, TEndKey extends keyof TData & string>(
      startKey: TStartKey,
      endKey: TEndKey,
      header: string,
      options?: { showTime?: boolean }
    ): ColumnDef<TData> => ({
      id: `${startKey}_${endKey}`,
      header,
      cell: ({ row }) => (
        <DateRangeCell
          startAt={row.original[startKey] as string}
          endAt={row.original[endKey] as string}
          showTime={options?.showTime}
        />
      ),
    }),

    link: <TKey extends keyof TData & string>(
      key: TKey,
      header: string,
      options?: { label?: string }
    ): ColumnDef<TData> => ({
      accessorKey: key,
      header,
      cell: ({ row }) => (
        <LinkCell href={row.original[key] as string} label={options?.label} />
      ),
    }),

    badge: <TKey extends keyof TData & string, TValue extends string>(
      key: TKey,
      header: string,
      options: {
        labels: Record<TValue, string>
        variants?: Partial<Record<TValue, BadgeVariant>>
      }
    ): ColumnDef<TData> => ({
      accessorKey: key,
      header,
      cell: ({ row }) => (
        <BadgeCell
          value={row.original[key] as TValue}
          labels={options.labels}
          variants={options.variants}
        />
      ),
    }),

    stacked: (
      id: string,
      header: string,
      options: {
        primary: (row: TData) => string | undefined | null
        secondary: (row: TData) => string | undefined | null
      }
    ): ColumnDef<TData> => ({
      id,
      header,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{options.primary(row.original) || '-'}</div>
          <div className="text-xs text-muted-foreground">
            {options.secondary(row.original) || '-'}
          </div>
        </div>
      ),
    }),

    // Editable columns
    editable: {
      text: <TKey extends keyof TData & string>(
        key: TKey,
        header: string,
        onUpdate: UpdateFn<TData, string>,
        options?: { variant?: TextVariant }
      ): ColumnDef<TData> => ({
        accessorKey: key,
        header,
        cell: ({ row }) => (
          <EditableTextCell
            value={row.original[key] as string}
            onSave={(value) => onUpdate(row.original, value)}
            className={textVariantStyles[options?.variant ?? 'default']}
          />
        ),
      }),

      number: <TKey extends keyof TData & string>(
        key: TKey,
        header: string,
        onUpdate: UpdateFn<TData, number>,
        options?: { min?: number; max?: number }
      ): ColumnDef<TData> => ({
        accessorKey: key,
        header,
        cell: ({ row }) => (
          <EditableNumberCell
            value={row.original[key] as number}
            onSave={(value) => onUpdate(row.original, value)}
            min={options?.min}
            max={options?.max}
          />
        ),
      }),

      toggle: <TKey extends keyof TData & string>(
        key: TKey,
        header: string,
        onUpdate: UpdateFn<TData, boolean>,
        options?: { defaultValue?: boolean }
      ): ColumnDef<TData> => ({
        accessorKey: key,
        header,
        cell: ({ row }) => (
          <EditableToggleCell
            value={(row.original[key] as boolean) ?? options?.defaultValue ?? true}
            onSave={(value) => onUpdate(row.original, value)}
          />
        ),
      }),

      select: <TKey extends keyof TData & string, TValue extends string>(
        key: TKey,
        header: string,
        onUpdate: UpdateFn<TData, TValue>,
        options: EditableSelectOptions<TValue>
      ): ColumnDef<TData> => ({
        accessorKey: key,
        header,
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <EditableSelectCell
              value={row.original[key] as TValue}
              options={options.options}
              onSave={(value) => onUpdate(row.original, value)}
              renderValue={(value) => (
                <Badge variant={options.variants?.[value] ?? 'secondary'}>
                  {options.labels[value]}
                </Badge>
              )}
            />
          </div>
        ),
      }),
    },

    // Custom column for complex cases
    custom: <TKey extends keyof TData & string>(
      key: TKey | string,
      header: string,
      cell: ColumnDef<TData>['cell']
    ): ColumnDef<TData> => ({
      accessorKey: key,
      header,
      cell,
    }),
  }
}
