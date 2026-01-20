import { cn } from '@/lib/utils'

interface AvatarCellProps {
  name: string | null | undefined
  avatar?: string | null
  subtitle?: string | null
  className?: string
}

export function AvatarCell({ name, avatar, subtitle, className }: AvatarCellProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {avatar && (
        <img src={avatar} alt="" className="h-6 w-6 rounded-full object-cover flex-shrink-0" />
      )}
      <div className="min-w-0">
        <span className="block truncate">{name || '-'}</span>
        {subtitle && (
          <span className="block text-xs text-muted-foreground truncate">{subtitle}</span>
        )}
      </div>
    </div>
  )
}
