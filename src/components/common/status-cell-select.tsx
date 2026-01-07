import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive'

interface StatusCellSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: readonly string[]
  variants?: Record<string, BadgeVariant>
}

export function StatusCellSelect({
  value,
  onValueChange,
  options,
  variants,
}: StatusCellSelectProps) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-auto w-auto border-0 bg-background! px-0 py-0 shadow-none hover:bg-transparent focus:ring-0">
          <span className="sr-only"><SelectValue /></span>
          <Badge variant={variants?.[value] || 'secondary'} className="capitalize rounded-sm">
            {value}
          </Badge>
        </SelectTrigger>
        <SelectContent align="start">
          {options.map((opt) => (
            <SelectItem key={opt} value={opt} className="capitalize">
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
