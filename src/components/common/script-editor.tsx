import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete'
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript'
import { linter, lintGutter } from '@codemirror/lint'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { EditorView, basicSetup } from 'codemirror'
import { useCallback, useEffect, useRef } from 'react'

// TODO: remove this component when monaca editor is ok
// Helper to get CSS variable value (supports oklch format)
const getCssVar = (name: string): string => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!value) return '#888888'
  // oklch values like "0.55 0.22 280" need to be wrapped
  if (/^[\d.]+\s+[\d.]+\s+[\d.]+$/.test(value)) {
    return `oklch(${value})`
  }
  // Already a full color value (oklch(...), hsl(...), #hex, etc.)
  return value
}

// Theme that uses CSS variables - auto adapts to light/dark mode
const createAppTheme = () =>
  EditorView.theme({
    '&': {
      backgroundColor: 'var(--background)',
      color: 'var(--foreground)',
    },
    '.cm-content': {
      caretColor: 'var(--foreground)',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'var(--foreground)',
    },
    // Selection - use dedicated selection color
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: 'var(--code-selection) !important',
    },
    '.cm-selectionBackground': {
      backgroundColor: 'var(--code-selection) !important',
    },
    '::selection': {
      backgroundColor: 'var(--code-selection) !important',
    },
    '.cm-panels': {
      backgroundColor: 'var(--muted)',
      color: 'var(--muted-foreground)',
    },
    '.cm-panels.cm-panels-top': {
      borderBottom: '1px solid var(--border)',
    },
    '.cm-panels.cm-panels-bottom': {
      borderTop: '1px solid var(--border)',
    },
    '.cm-searchMatch': {
      backgroundColor: 'var(--code-selection)',
      outline: '1px solid var(--border)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'var(--code-selection)',
    },
    '.cm-activeLine': {
      backgroundColor: 'color-mix(in oklch, var(--muted) 50%, transparent)',
    },
    '.cm-selectionMatch': {
      backgroundColor: 'color-mix(in oklch, var(--code-selection) 60%, transparent)',
    },
    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
      backgroundColor: 'var(--code-selection)',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--muted)',
      color: 'var(--muted-foreground)',
      border: 'none',
      borderRight: '1px solid var(--border)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'color-mix(in oklch, var(--code-selection) 40%, transparent)',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'transparent',
      border: 'none',
      color: 'var(--muted-foreground)',
    },
    // Tooltip/autocomplete popup
    '.cm-tooltip': {
      border: '1px solid var(--border)',
      backgroundColor: 'var(--popover)',
      color: 'var(--popover-foreground)',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      fontSize: '13px',
    },
    '.cm-tooltip.cm-tooltip-autocomplete': {
      backgroundColor: 'var(--popover)',
      border: '1px solid var(--border)',
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul': {
      backgroundColor: 'var(--popover)',
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxHeight: '300px',
      padding: '4px',
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
      padding: '6px 8px',
      backgroundColor: 'var(--popover)',
      color: 'var(--popover-foreground)',
      borderRadius: 'calc(var(--radius) - 2px)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
      backgroundColor: 'var(--accent)',
      color: 'var(--accent-foreground)',
    },
    '.cm-completionIcon': {
      display: 'none',
    },
    '.cm-completionLabel': {
      color: 'var(--popover-foreground)',
      fontFamily: 'var(--font-mono)',
      fontSize: '12px',
      fontWeight: '500',
    },
    '.cm-completionDetail': {
      color: 'var(--muted-foreground)',
      fontSize: '11px',
      marginLeft: 'auto',
      fontFamily: 'var(--font-mono)',
    },
    '.cm-completionInfo': {
      backgroundColor: 'var(--popover)',
      border: '1px solid var(--border)',
      padding: '8px 12px',
      borderRadius: 'var(--radius)',
      fontSize: '12px',
      lineHeight: '1.5',
    },
  })

// Syntax highlighting - uses dedicated code-* CSS variables
const createHighlightStyle = () => {
  // Read colors from CSS variables at runtime
  const colors = {
    keyword: getCssVar('--code-keyword'),
    variable: getCssVar('--code-variable'),
    property: getCssVar('--code-property'),
    function: getCssVar('--code-function'),
    constant: getCssVar('--code-constant'),
    number: getCssVar('--code-number'),
    operator: getCssVar('--code-operator'),
    comment: getCssVar('--code-comment'),
    string: getCssVar('--code-string'),
    invalid: getCssVar('--destructive'),
  }

  return HighlightStyle.define([
    { tag: tags.keyword, color: colors.keyword },
    { tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: colors.variable },
    { tag: [tags.propertyName], color: colors.property },
    { tag: [tags.function(tags.variableName), tags.labelName], color: colors.function },
    { tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: colors.constant },
    { tag: [tags.definition(tags.name), tags.separator], color: colors.variable },
    { tag: [tags.typeName, tags.className, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace], color: colors.property },
    { tag: [tags.number], color: colors.number },
    { tag: [tags.operator, tags.operatorKeyword], color: colors.operator },
    { tag: [tags.url, tags.escape, tags.regexp, tags.link, tags.special(tags.string)], color: colors.string },
    { tag: [tags.meta, tags.comment], color: colors.comment, fontStyle: 'italic' },
    { tag: tags.strong, fontWeight: 'bold' },
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: tags.strikethrough, textDecoration: 'line-through' },
    { tag: tags.link, color: colors.function, textDecoration: 'underline' },
    { tag: tags.heading, fontWeight: 'bold' },
    { tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: colors.constant },
    { tag: [tags.processingInstruction, tags.string, tags.inserted], color: colors.string },
    { tag: tags.invalid, color: colors.invalid },
  ])
}

// Type definitions for script environment
const SCRIPT_ENV = {
  $context: {
    doc: 'Context object containing game and user information',
    properties: {
      gameId: { type: 'string', doc: 'Current game ID' },
      reward: {
        type: 'Reward',
        doc: 'Full Reward entity',
        properties: {
          rewardId: { type: 'string', doc: 'Reward ID' },
          name: { type: 'string', doc: 'Reward name' },
          rewardType: { type: 'string', doc: 'Type of reward' },
          imageUrl: { type: 'string', doc: 'Reward image URL' },
          config: { type: 'object', doc: 'Reward configuration' },
        },
      },
      auth: {
        type: 'JWTPayload',
        doc: 'JWT payload with user info',
        properties: {
          portalId: { type: 'string', doc: 'Portal ID' },
          appId: { type: 'string', doc: 'App ID' },
          userId: { type: 'string', doc: 'User ID' },
          phone: { type: 'string', doc: 'User phone number' },
          customerId: { type: 'string', doc: 'Customer ID (if available)' },
        },
      },
      metadata: { type: 'object', doc: 'Additional metadata' },
      timezone: { type: 'string', doc: 'Timezone string (e.g., "Asia/Ho_Chi_Minh")' },
      extra: { type: 'object', doc: 'Extra config from script reward' },
    },
  },
  $services: {
    doc: 'Available services for external calls',
    properties: {
      httpClient: {
        type: 'HttpClientService',
        doc: 'HTTP client for API calls',
        methods: {
          get: { args: '(url: string, options?: object)', returns: 'Promise<Response>', doc: 'GET request' },
          post: { args: '(url: string, data?: object, options?: object)', returns: 'Promise<Response>', doc: 'POST request' },
          put: { args: '(url: string, data?: object, options?: object)', returns: 'Promise<Response>', doc: 'PUT request' },
          delete: { args: '(url: string, options?: object)', returns: 'Promise<Response>', doc: 'DELETE request' },
        },
      },
      redis: {
        type: 'RedisClient',
        doc: 'Redis client for caching',
        methods: {
          get: { args: '(key: string)', returns: 'Promise<string | null>', doc: 'Get value by key' },
          set: { args: '(key: string, value: string, ttl?: number)', returns: 'Promise<void>', doc: 'Set value with optional TTL' },
          del: { args: '(key: string)', returns: 'Promise<void>', doc: 'Delete key' },
          incr: { args: '(key: string)', returns: 'Promise<number>', doc: 'Increment value' },
          expire: { args: '(key: string, seconds: number)', returns: 'Promise<void>', doc: 'Set expiry on key' },
        },
      },
      rabbitmq: {
        type: 'RabbitMQService',
        doc: 'RabbitMQ for message queuing',
        methods: {
          publish: { args: '(queue: string, message: object)', returns: 'Promise<void>', doc: 'Publish message to queue' },
        },
      },
    },
  },
  $helpers: {
    doc: 'Helper functions',
    properties: {
      randomPercentage: { type: 'function', args: '()', returns: 'number', doc: 'Generate random percentage (0-100)' },
      toLocalPhone: { type: 'function', args: '(phone: string)', returns: 'string', doc: 'Convert to local phone format' },
      toIntlPhone: { type: 'function', args: '(phone: string)', returns: 'string', doc: 'Convert to international phone format' },
      calculateJourneyExpiry: { type: 'function', args: '(timezone: string)', returns: 'Date', doc: 'Calculate journey expiry date' },
      logger: {
        type: 'Logger',
        doc: 'Logger instance',
        methods: {
          info: { args: '(message: string, context?: object)', returns: 'void', doc: 'Log info message' },
          warn: { args: '(message: string, context?: object)', returns: 'void', doc: 'Log warning message' },
          error: { args: '(message: string, context?: object)', returns: 'void', doc: 'Log error message' },
          debug: { args: '(message: string, context?: object)', returns: 'void', doc: 'Log debug message' },
        },
      },
      crypto: {
        type: 'Crypto',
        doc: 'Node.js crypto module',
        methods: {
          randomUUID: { args: '()', returns: 'string', doc: 'Generate random UUID' },
          createHash: { args: '(algorithm: string)', returns: 'Hash', doc: 'Create hash object' },
        },
      },
    },
  },
  $constants: {
    doc: 'Available constants',
    properties: {
      RABBITMQ_QUEUES: { type: 'object', doc: 'RabbitMQ queue names' },
    },
  },
}

// Build completions from SCRIPT_ENV
function buildCompletions(
  obj: Record<string, unknown>,
  path: string[] = []
): { label: string; type: string; info?: string; detail?: string }[] {
  const completions: { label: string; type: string; info?: string; detail?: string }[] = []

  for (const [key, value] of Object.entries(obj)) {
    const val = value as { doc?: string; type?: string; properties?: object; methods?: object; args?: string; returns?: string }
    const fullPath = [...path, key].join('.')

    if (val.properties || val.methods) {
      // Object with nested properties/methods
      completions.push({
        label: fullPath,
        type: 'variable',
        info: val.doc,
        detail: val.type,
      })

      if (val.properties) {
        completions.push(...buildCompletions(val.properties as Record<string, unknown>, [...path, key]))
      }
      if (val.methods) {
        for (const [methodName, methodVal] of Object.entries(val.methods as Record<string, unknown>)) {
          const method = methodVal as { args?: string; returns?: string; doc?: string }
          completions.push({
            label: `${fullPath}.${methodName}`,
            type: 'method',
            info: method.doc,
            detail: `${method.args} => ${method.returns}`,
          })
        }
      }
    } else if (val.args) {
      // Function
      completions.push({
        label: fullPath,
        type: 'function',
        info: val.doc,
        detail: `${val.args} => ${val.returns}`,
      })
    } else {
      // Simple property
      completions.push({
        label: fullPath,
        type: 'property',
        info: val.doc,
        detail: val.type,
      })
    }
  }

  return completions
}

const ALL_COMPLETIONS = buildCompletions(SCRIPT_ENV)

// Custom completion source
function scriptCompletions(context: CompletionContext): CompletionResult | null {
  // Match $ followed by word characters and dots
  const word = context.matchBefore(/\$[\w.]*/)
  if (!word) return null

  const typed = word.text

  // Filter completions that start with what user typed
  const options = ALL_COMPLETIONS.filter((c) => c.label.startsWith(typed)).map((c) => ({
    label: c.label,
    type: c.type,
    info: c.info,
    detail: c.detail,
  }))

  if (options.length === 0) return null

  return {
    from: word.from,
    options,
    validFor: /^[\w.]*$/,
  }
}

// Return type suggestions
const RETURN_TYPE_COMPLETIONS = [
  {
    label: 'return { success: true }',
    type: 'snippet',
    info: 'Return successful result',
    apply: `return {
  success: true,
  persistedTo: 'vouchers',
  reward: {
    rewardId: $context.reward.rewardId,
    name: $context.reward.name,
    rewardValue: '',
    metadata: {}
  }
};`,
  },
  {
    label: 'return { success: false }',
    type: 'snippet',
    info: 'Return failed result',
    apply: `return {
  success: false,
  needsFallback: true,
  message: 'Error message'
};`,
  },
]

function returnCompletions(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/return\s*/)
  if (!word) return null

  return {
    from: word.from,
    options: RETURN_TYPE_COMPLETIONS,
  }
}

// Simple syntax linter
const scriptLinter = linter((view) => {
  const diagnostics: { from: number; to: number; severity: 'error' | 'warning'; message: string }[] = []
  const text = view.state.doc.toString()

  // Check for return statement
  if (!text.includes('return')) {
    diagnostics.push({
      from: 0,
      to: 0,
      severity: 'warning',
      message: 'Script should return a RewardResult object',
    })
  }

  return diagnostics
})

interface ScriptEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  height?: string
}

export function ScriptEditor({
  value,
  onChange,
  className,
  disabled = false,
  height = '300px',
}: ScriptEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced onChange to reduce parent re-renders
  const debouncedOnChange = useCallback(
    (newValue: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        onChange(newValue)
      }, 150)
    },
    [onChange]
  )

  useEffect(() => {
    if (!containerRef.current) return

    const view = new EditorView({
      doc: value,
      extensions: [
        basicSetup,
        javascript(),
        createAppTheme(),
        syntaxHighlighting(createHighlightStyle()),
        autocompletion({
          activateOnTyping: true,
        }),
        // Add custom completions for $ variables alongside default JS completions
        javascriptLanguage.data.of({
          autocomplete: scriptCompletions,
        }),
        javascriptLanguage.data.of({
          autocomplete: returnCompletions,
        }),
        lintGutter(),
        scriptLinter,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            debouncedOnChange(update.state.doc.toString())
          }
        }),
        EditorView.editable.of(!disabled),
        EditorView.theme({
          '&': { height },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update content when value changes externally
  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const currentValue = view.state.doc.toString()
    if (value !== currentValue) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value },
      })
    }
  }, [value])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        border: '1px solid hsl(var(--border))',
        borderRadius: '0.375rem',
        overflow: 'hidden',
      }}
    />
  )
}
