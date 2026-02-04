import {
  AvatarCell,
  BadgeCell,
  DateCell,
  DateRangeCell,
  LinkCell,
  StackedCell,
  TextCell,
} from '@/components/common/cells'
import {
  EditableDateRangeCell,
  EditableNumberCell,
  EditableSelectCell,
  EditableStackedCell,
  EditableTextCell,
  EditableToggleCell,
} from '@/components/common/editable-cells'
import { Badge } from '@/components/ui/badge'
import type { ColumnDef } from '@tanstack/react-table'
import type { FilterEnumOption, FilterType } from '@/lib/column-filters'

type UpdateFn<T, V> = (row: T, value: V) => Promise<void>
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

// Text column variants
type TextVariant = 'default' | 'primary' | 'secondary' | 'muted' | 'tabular'

const textVariantStyles: Record<TextVariant, string> = {
  default: '',
  primary: 'font-medium',
  secondary: 'text-sm text-muted-foreground',
  muted: 'text-muted-foreground',
  tabular: 'tabular-nums',
}

interface EditableSelectOptions<T extends string> {
  options: { value: T; label: string }[]
  labels: Record<T, string>
  variants?: Partial<Record<T, BadgeVariant>>
}

function filterMeta(filterType: FilterType, filterOptions?: FilterEnumOption[]) {
  return {
    meta: { filterType, ...(filterOptions ? { filterOptions } : {}) },
    filterFn: 'columnFilter' as const,
  } as const
}

function enumOptionsFromLabels<T extends string>(labels: Record<T, string>): FilterEnumOption[] {
  return Object.entries(labels).map(([value, label]) => ({
    value,
    label: label as string,
  }))
}

export function createColumnHelper<TData>() {
  return {
    // Display columns
    text: <TKey extends keyof TData & string>(
      key: TKey,
      header: string,
      options?: {
        variant?: TextVariant
        format?: (value: TData[TKey]) => string
        render?: (row: TData) => string | null | undefined
      }
    ): ColumnDef<TData> => ({
      accessorKey: key,
      header,
      ...filterMeta('string'),
      cell: ({ row }) => {
        const rawValue = row.original[key] as string | number | null | undefined
        let value: string | number | null | undefined
        if (options?.render) {
          value = options.render(row.original)
        } else if (options?.format && rawValue != null) {
          value = options.format(row.original[key])
        } else {
          value = rawValue
        }
        return (
          <TextCell value={value} className={textVariantStyles[options?.variant ?? 'default']} />
        )
      },
    }),

    date: <TKey extends keyof TData & string>(
      key: TKey,
      header: string,
      options?: { showTime?: boolean; relative?: boolean }
    ): ColumnDef<TData> => ({
      accessorKey: key,
      header,
      ...filterMeta('date'),
      cell: ({ row }) => (
        <DateCell
          value={row.original[key] as string}
          showTime={options?.showTime}
          relative={options?.relative}
        />
      ),
    }),

    dateRange: <TStartKey extends keyof TData & string, TEndKey extends keyof TData & string>(
      startKey: TStartKey,
      endKey: TEndKey,
      header: string,
      options?: { showTime?: boolean }
    ): ColumnDef<TData> => ({
      id: `${startKey}_${endKey}`,
      accessorKey: startKey,
      header,
      ...filterMeta('date'),
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
      ...filterMeta('string'),
      cell: ({ row }) => <LinkCell href={row.original[key] as string} label={options?.label} />,
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
      ...filterMeta('enum', enumOptionsFromLabels(options.labels)),
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
        href?: (row: TData) => string
        onClick?: (row: TData) => void
      }
    ): ColumnDef<TData> => ({
      id,
      header,
      ...filterMeta('string'),
      // Accessor for global filter to search primary + secondary text
      accessorFn: (row) =>
        [options.primary(row), options.secondary(row)].filter(Boolean).join(' '),
      cell: ({ row }) => (
        <StackedCell
          primary={options.primary(row.original)}
          secondary={options.secondary(row.original)}
          href={options.href?.(row.original)}
          onClick={options.onClick ? () => options.onClick!(row.original) : undefined}
        />
      ),
    }),

    avatar: (
      id: string,
      header: string,
      options: {
        name: (row: TData) => string | undefined | null
        avatar?: (row: TData) => string | undefined | null
        subtitle?: (row: TData) => string | undefined | null
      }
    ): ColumnDef<TData> => ({
      id,
      header,
      ...filterMeta('string'),
      // Accessor for global filter to search name + subtitle
      accessorFn: (row) =>
        [options.name(row), options.subtitle?.(row)].filter(Boolean).join(' '),
      cell: ({ row }) => (
        <AvatarCell
          name={options.name(row.original)}
          avatar={options.avatar?.(row.original)}
          subtitle={options.subtitle?.(row.original)}
        />
      ),
    }),

    // Boolean status as badge (e.g., Active/Inactive)
    status: <TKey extends keyof TData & string>(
      key: TKey,
      header: string,
      options?: {
        trueLabel?: string
        falseLabel?: string
        trueVariant?: BadgeVariant
        falseVariant?: BadgeVariant
      }
    ): ColumnDef<TData> => ({
      accessorKey: key,
      header,
      ...filterMeta('boolean'),
      cell: ({ row }) => {
        const value = row.original[key] as boolean
        const label = value ? (options?.trueLabel ?? 'Active') : (options?.falseLabel ?? 'Inactive')
        const variant = value
          ? (options?.trueVariant ?? 'default')
          : (options?.falseVariant ?? 'secondary')
        return <Badge variant={variant}>{label}</Badge>
      },
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
        ...filterMeta('string'),
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
        onUpdate: UpdateFn<TData, number | null>,
        options?: { min?: number; max?: number; emptyDisplay?: string }
      ): ColumnDef<TData> => ({
        accessorKey: key,
        header,
        ...filterMeta('number'),
        cell: ({ row }) => (
          <EditableNumberCell
            value={row.original[key] as number | null}
            onSave={(value) => onUpdate(row.original, value)}
            min={options?.min}
            max={options?.max}
            emptyDisplay={options?.emptyDisplay}
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
        ...filterMeta('boolean'),
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
        ...filterMeta('enum', enumOptionsFromLabels(options.labels)),
        cell: ({ row }) => (
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
        ),
      }),

      stacked: (
        id: string,
        header: string,
        onUpdate: UpdateFn<TData, string>,
        options: {
          primary: (row: TData) => string | undefined | null
          secondary: (row: TData) => string | undefined | null
        }
      ): ColumnDef<TData> => ({
        id,
        header,
        ...filterMeta('string'),
        // Accessor for global filter to search primary + secondary text
        accessorFn: (row) =>
          [options.primary(row), options.secondary(row)].filter(Boolean).join(' '),
        cell: ({ row }) => (
          <EditableStackedCell
            primary={options.primary(row.original) || ''}
            secondary={options.secondary(row.original)}
            onSave={(value) => onUpdate(row.original, value)}
          />
        ),
      }),

      dateRange: <TStartKey extends keyof TData & string, TEndKey extends keyof TData & string>(
        startKey: TStartKey,
        endKey: TEndKey,
        header: string,
        onUpdate: (row: TData, startAt: string | null, endAt: string | null) => Promise<void>,
        options?: { showTime?: boolean }
      ): ColumnDef<TData> => ({
        id: `${startKey}_${endKey}`,
        accessorKey: startKey,
        header,
        ...filterMeta('date'),
        cell: ({ row }) => (
          <EditableDateRangeCell
            startAt={row.original[startKey] as string}
            endAt={row.original[endKey] as string}
            onSave={(startAt, endAt) => onUpdate(row.original, startAt, endAt)}
            showTime={options?.showTime}
          />
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
