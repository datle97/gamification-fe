import { cn } from '@/lib/utils'
import { Suspense, lazy } from 'react'

const RichTextEditorInner = lazy(() =>
  import('./rich-text-editor').then((mod) => ({ default: mod.RichTextEditor }))
)

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

function RichTextEditorLoading({ className }: { className?: string }) {
  return <div className={cn('h-32 animate-pulse bg-muted rounded-md border', className)} />
}

export function RichTextEditor(props: RichTextEditorProps) {
  return (
    <Suspense fallback={<RichTextEditorLoading className={props.className} />}>
      <RichTextEditorInner {...props} />
    </Suspense>
  )
}

export { RichTextEditorLoading }
