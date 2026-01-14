interface CollectionHandlerFormProps {
  config: string
  onChange: (config: string) => void
}

export function CollectionHandlerForm({
  config,
  onChange,
}: CollectionHandlerFormProps) {
  // Initialize empty config if needed
  if (!config || config === '{}') {
    onChange(
      JSON.stringify(
        {
          type: 'collection',
        },
        null,
        2
      )
    )
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Collection Handler Configuration</h4>
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          Collection rewards are managed by the collection service. No additional
          configuration is required here.
        </p>
      </div>
    </div>
  )
}
