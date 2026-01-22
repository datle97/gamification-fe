import { Suspense, lazy } from 'react'

const MonacoScriptEditorInner = lazy(() =>
  import('./monaco-script-editor').then((mod) => ({ default: mod.MonacoScriptEditor }))
)

interface MonacoScriptEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  height?: string
}

function MonacoScriptEditorLoading({ height = '400px' }: { height?: string }) {
  return (
    <div
      className="border rounded-md bg-muted/50 flex items-center justify-center w-full"
      style={{ height }}
    >
      <span className="text-muted-foreground text-sm">Loading editor...</span>
    </div>
  )
}

export function MonacoScriptEditor(props: MonacoScriptEditorProps) {
  return (
    <Suspense fallback={<MonacoScriptEditorLoading height={props.height} />}>
      <MonacoScriptEditorInner {...props} />
    </Suspense>
  )
}

export { MonacoScriptEditorLoading }
