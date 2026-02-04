import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

export interface RowActionItem {
  label: string
  icon?: ComponentType<SVGProps<SVGSVGElement> & { className?: string }>
  onClick: () => void
  variant?: 'default' | 'destructive'
}

export type RowActionItems = (RowActionItem | 'separator')[]

export function RowActions({ items }: { items: RowActionItems }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {items.map((item, i) =>
          item === 'separator' ? (
            <DropdownMenuSeparator key={i} />
          ) : (
            <DropdownMenuItem
              key={i}
              variant={item.variant}
              onClick={item.onClick}
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              {item.label}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
