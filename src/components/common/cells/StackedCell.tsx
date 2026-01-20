import { Link } from 'react-router'

interface StackedCellProps {
  primary: string | null | undefined
  secondary?: string | null
  href?: string
  onClick?: () => void
}

export function StackedCell({ primary, secondary, href, onClick }: StackedCellProps) {
  const primaryContent = primary || '-'

  const renderPrimary = () => {
    if (href) {
      return (
        <Link
          to={href}
          className="font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {primaryContent}
        </Link>
      )
    }

    if (onClick) {
      return (
        <button
          type="button"
          className="font-medium hover:underline text-left"
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          {primaryContent}
        </button>
      )
    }

    return <div className="font-medium">{primaryContent}</div>
  }

  return (
    <div>
      {renderPrimary()}
      {secondary && <div className="text-xs text-muted-foreground">{secondary}</div>}
    </div>
  )
}
