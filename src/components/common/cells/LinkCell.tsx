import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LinkCellProps {
  href: string | null | undefined
  label?: string
  external?: boolean
  className?: string
}

export function LinkCell({
  href,
  label = 'Open',
  external = true,
  className,
}: LinkCellProps) {
  if (!href) {
    return <span className="text-muted-foreground">-</span>
  }

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={cn(
        'inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {external && <ExternalLink className="h-3 w-3 mr-1" />}
      {label}
    </a>
  )
}
