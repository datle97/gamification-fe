import Editor, { Monaco, OnMount } from '@monaco-editor/react'
import { useCallback, useEffect, useRef } from 'react'

// Type definitions for script environment - will be added to Monaco
const SCRIPT_ENV_TYPES = `
interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

interface HttpClientService {
  get<T = unknown>(url: string, options?: object): Promise<HttpResponse<T>>;
  post<T = unknown>(url: string, data?: object, options?: object): Promise<HttpResponse<T>>;
  put<T = unknown>(url: string, data?: object, options?: object): Promise<HttpResponse<T>>;
  delete<T = unknown>(url: string, options?: object): Promise<HttpResponse<T>>;
}

interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
}

interface RabbitMQService {
  publish(queue: string, message: object): Promise<void>;
}

interface Logger {
  info(message: string, context?: object): void;
  warn(message: string, context?: object): void;
  error(message: string, context?: object): void;
  debug(message: string, context?: object): void;
}

interface CryptoHelper {
  randomUUID(): string;
  createHash(algorithm: string): object;
}

interface Reward {
  rewardId: string;
  name: string;
  rewardType: string;
  imageUrl?: string;
  config: object;
}

interface JWTPayload {
  portalId: string;
  appId: string;
  userId: string;
  phone?: string;
  customerId?: string;
  zaloUid?: string;
  [key: string]: unknown;
}

interface ScriptContext {
  gameId: string;
  reward: Reward;
  auth: JWTPayload;
  metadata: Record<string, unknown>;
  timezone: string;
  extra?: Record<string, unknown>;
}

interface ScriptServices {
  httpClient: HttpClientService;
  redis: RedisClient;
  rabbitmq: RabbitMQService;
}

interface ScriptHelpers {
  randomPercentage(): number;
  toLocalPhone(phone: string): string;
  toIntlPhone(phone: string): string;
  calculateJourneyExpiry(timezone: string): Date;
  logger: Logger;
  crypto: CryptoHelper;
}

interface ScriptConstants {
  RABBITMQ_QUEUES: Record<string, string>;
}

interface RewardResultSuccess {
  success: true;
  persistedTo?: 'vouchers' | 'rewards' | 'external';
  reward?: {
    rewardId: string;
    name: string;
    rewardValue?: string;
    metadata?: Record<string, unknown>;
  };
}

interface RewardResultFailure {
  success: false;
  needsFallback?: boolean;
  needsRollback?: boolean;
  message?: string;
}

type RewardResult = RewardResultSuccess | RewardResultFailure;

declare const $context: ScriptContext;
declare const $services: ScriptServices;
declare const $helpers: ScriptHelpers;
declare const $constants: ScriptConstants;
`

// Loading placeholder - exported for use with Suspense
export function MonacoScriptEditorLoading({ height = '400px' }: { height?: string }) {
  return (
    <div
      className="border rounded-md bg-muted/50 flex items-center justify-center w-full"
      style={{ height }}
    >
      <span className="text-muted-foreground text-sm">Loading editor...</span>
    </div>
  )
}

interface MonacoScriptEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  height?: string
}

export function MonacoScriptEditor({
  value,
  onChange,
  className,
  disabled = false,
  height = '400px',
}: MonacoScriptEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Inject custom CSS for Monaco widgets
  useEffect(() => {
    const styleId = 'monaco-custom-styles'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .monaco-editor .suggest-widget {
        font-family: "SF Mono", "Fira Code", "JetBrains Mono", Menlo, Monaco, Consolas, monospace !important;
        font-size: 13px !important;
      }
      .monaco-editor .suggest-widget .monaco-list .monaco-list-row {
        font-family: inherit !important;
      }
      .monaco-editor .suggest-widget .details {
        font-family: inherit !important;
      }
      .monaco-editor .monaco-hover {
        font-family: "SF Mono", "Fira Code", "JetBrains Mono", Menlo, Monaco, Consolas, monospace !important;
        font-size: 13px !important;
      }
      .monaco-editor .parameter-hints-widget {
        font-family: "SF Mono", "Fira Code", "JetBrains Mono", Menlo, Monaco, Consolas, monospace !important;
        font-size: 13px !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      const existingStyle = document.getElementById(styleId)
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [])

  // Debounced onChange
  const debouncedOnChange = useCallback(
    (newValue: string | undefined) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        onChange(newValue || '')
      }, 150)
    },
    [onChange]
  )

  // Convert CSS variable to hex color
  const cssVarToHex = useCallback((varName: string, fallback: string): string => {
    try {
      const temp = document.createElement('div')
      temp.style.color = `var(${varName})`
      temp.style.display = 'none'
      document.body.appendChild(temp)
      const computed = getComputedStyle(temp).color
      document.body.removeChild(temp)

      // Match rgb(r, g, b) or rgba(r, g, b, a) format - integers 0-255
      const rgbMatch = computed.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
      if (rgbMatch) {
        const r = Math.min(255, parseInt(rgbMatch[1])).toString(16).padStart(2, '0')
        const g = Math.min(255, parseInt(rgbMatch[2])).toString(16).padStart(2, '0')
        const b = Math.min(255, parseInt(rgbMatch[3])).toString(16).padStart(2, '0')
        return `#${r}${g}${b}`
      }
    } catch {
      // Fallback on any error
    }
    return fallback
  }, [])

  // Define/update Monaco theme based on current CSS variables
  const updateMonacoTheme = useCallback(
    (monaco: Monaco) => {
      const isDark = document.documentElement.classList.contains('dark')

      // Fallback colors for light/dark modes
      const fallbacks = isDark
        ? {
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            muted: '#2d2d2d',
            mutedForeground: '#808080',
            border: '#404040',
            popover: '#252526',
            primary: '#e07028',
          }
        : {
            background: '#ffffff',
            foreground: '#1f2937',
            muted: '#f3f4f6',
            mutedForeground: '#6b7280',
            border: '#e5e7eb',
            popover: '#ffffff',
            primary: '#c2410c',
          }

      const colors = {
        background: cssVarToHex('--background', fallbacks.background),
        foreground: cssVarToHex('--foreground', fallbacks.foreground),
        muted: cssVarToHex('--muted', fallbacks.muted),
        mutedForeground: cssVarToHex('--muted-foreground', fallbacks.mutedForeground),
        border: cssVarToHex('--border', fallbacks.border),
        popover: cssVarToHex('--popover', fallbacks.popover),
        primary: cssVarToHex('--primary', fallbacks.primary),
        codeKeyword: cssVarToHex('--code-keyword', isDark ? '#c586c0' : '#7c3aed'),
        codeString: cssVarToHex('--code-string', isDark ? '#ce9178' : '#16a34a'),
        codeNumber: cssVarToHex('--code-number', isDark ? '#b5cea8' : '#c2410c'),
        codeComment: cssVarToHex('--code-comment', isDark ? '#6a9955' : '#6b7280'),
        codeFunction: cssVarToHex('--code-function', isDark ? '#dcdcaa' : '#2563eb'),
        codeVariable: cssVarToHex('--code-variable', isDark ? '#9cdcfe' : '#92400e'),
        codeProperty: cssVarToHex('--code-property', isDark ? '#4ec9b0' : '#0891b2'),
        codeOperator: cssVarToHex('--code-operator', isDark ? '#d4d4d4' : '#7c3aed'),
        codeSelection: cssVarToHex('--code-selection', isDark ? '#264f78' : '#c7d2fe'),
      }

    // Selected suggestion background - more visible
      const selectedBg = isDark ? '#3b4252' : '#e5e7eb'

    // Define custom theme using CSS variables
      monaco.editor.defineTheme('app-theme', {
        base: isDark ? 'vs-dark' : 'vs',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: colors.codeKeyword.slice(1) },
          { token: 'keyword.control', foreground: colors.codeKeyword.slice(1) },
          { token: 'storage', foreground: colors.codeKeyword.slice(1) },
          { token: 'string', foreground: colors.codeString.slice(1) },
          { token: 'string.quoted', foreground: colors.codeString.slice(1) },
          { token: 'number', foreground: colors.codeNumber.slice(1) },
          { token: 'comment', foreground: colors.codeComment.slice(1), fontStyle: 'italic' },
          { token: 'type', foreground: colors.codeProperty.slice(1) },
          { token: 'type.identifier', foreground: colors.codeProperty.slice(1) },
          { token: 'function', foreground: colors.codeFunction.slice(1) },
          { token: 'variable', foreground: colors.codeVariable.slice(1) },
          { token: 'variable.predefined', foreground: colors.codeNumber.slice(1) },
          { token: 'operator', foreground: colors.codeOperator.slice(1) },
          { token: 'delimiter', foreground: colors.foreground.slice(1) },
          { token: 'identifier', foreground: colors.foreground.slice(1) },
        ],
        colors: {
          'editor.background': colors.background,
          'editor.foreground': colors.foreground,
          'editor.lineHighlightBackground': colors.muted + '80',
          'editor.selectionBackground': colors.codeSelection,
          'editorCursor.foreground': colors.foreground,
          'editorLineNumber.foreground': colors.mutedForeground,
          'editorLineNumber.activeForeground': colors.foreground,
          'editorGutter.background': colors.muted,
          'editorWidget.background': colors.popover,
          'editorWidget.border': colors.border,
          'editorSuggestWidget.background': colors.popover,
          'editorSuggestWidget.border': colors.border,
          'editorSuggestWidget.foreground': colors.foreground,
          'editorSuggestWidget.selectedBackground': selectedBg,
          'editorSuggestWidget.selectedForeground': colors.foreground,
          'editorSuggestWidget.highlightForeground': colors.primary,
          'editorSuggestWidget.focusHighlightForeground': colors.primary,
          'editorHoverWidget.background': colors.popover,
          'editorHoverWidget.border': colors.border,
          'editorHoverWidget.foreground': colors.foreground,
          'list.hoverBackground': colors.muted,
          'list.focusBackground': selectedBg,
        },
      })

      // Apply theme
      monaco.editor.setTheme('app-theme')
    },
    [cssVarToHex]
  )

  // Listen for dark mode changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' && monacoRef.current) {
          updateMonacoTheme(monacoRef.current)
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })

    return () => observer.disconnect()
  }, [updateMonacoTheme])

  const handleEditorWillMount = (monaco: Monaco) => {
    // Store monaco reference for theme updates
    monacoRef.current = monaco

    // Configure TypeScript/JavaScript compiler options
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      strict: false,
      allowJs: true,
      checkJs: false,
    })

    // Add custom type definitions
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      SCRIPT_ENV_TYPES,
      'file:///node_modules/@types/script-env/index.d.ts'
    )

    // Disable some validations for a cleaner experience
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })

    // Define initial theme
    updateMonacoTheme(monaco)
  }

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Ensure theme is applied after mount
    updateMonacoTheme(monaco)

    // Focus editor to ensure it receives keyboard events
    editor.focus()
  }

  // Handle container click to focus editor
  const handleContainerClick = () => {
    editorRef.current?.focus()
  }

  return (
    <div
      className={className}
      onClick={handleContainerClick}
      style={{
        position: 'relative',
        border: `1px solid ${cssVarToHex('--border', '#e5e7eb')}`,
        borderRadius: '0.375rem',
      }}
    >
      <Editor
        height={height}
        defaultLanguage="javascript"
        value={value}
        onChange={debouncedOnChange}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorMount}
        theme="app-theme"
        loading={<MonacoScriptEditorLoading height={height} />}
        options={{
          readOnly: disabled,
          minimap: { enabled: false },
          fontSize: 13,
          lineHeight: 20,
          fontFamily: '"SF Mono", "Fira Code", "JetBrains Mono", Menlo, Monaco, Consolas, monospace',
          fontWeight: '400',
          fontLigatures: false,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          padding: { top: 8, bottom: 8 },
          suggest: {
            showKeywords: true,
            showSnippets: true,
            showClasses: true,
            showFunctions: true,
            showVariables: true,
            showModules: true,
            showIcons: true,
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          parameterHints: {
            enabled: true,
          },
          folding: true,
          bracketPairColorization: {
            enabled: true,
          },
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            useShadows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        }}
      />
    </div>
  )
}
