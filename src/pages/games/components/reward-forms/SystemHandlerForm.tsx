interface SystemHandlerFormProps {
  config: string
  onChange: (config: string) => void
}

export function SystemHandlerForm({ config, onChange }: SystemHandlerFormProps) {
  // Initialize empty config if needed
  if (!config || config === '{}') {
    onChange(
      JSON.stringify(
        {
          type: 'system',
        },
        null,
        2
      )
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          System handler allocates rewards internally without external API calls. Minimal
          configuration required.
        </p>
      </div>
    </div>
  )
}
