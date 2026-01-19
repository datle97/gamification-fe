import { cn } from '@/lib/utils'

interface TextCellProps {
  value: string | number | null | undefined
  className?: string
}

export function TextCell({ value, className }: TextCellProps) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">-</span>
  }

  return <span className={cn(className)}>{value}</span>
}
