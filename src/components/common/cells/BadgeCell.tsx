import { Badge } from '@/components/ui/badge'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

interface BadgeCellProps<T extends string> {
  value: T | null | undefined
  labels: Record<T, string>
  variants?: Partial<Record<T, BadgeVariant>>
  defaultVariant?: BadgeVariant
}

export function BadgeCell<T extends string>({
  value,
  labels,
  variants,
  defaultVariant = 'secondary',
}: BadgeCellProps<T>) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>
  }

  const variant = variants?.[value] ?? defaultVariant

  return <Badge variant={variant}>{labels[value] ?? value}</Badge>
}
