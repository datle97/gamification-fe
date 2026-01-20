import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, ChevronRight, Code, Pencil, Plus, Trash2, TreeDeciduous, X } from 'lucide-react'
import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Lazy load heavy RichTextEditor
const RichTextEditor = lazy(() =>
  import('@/components/ui/rich-text-editor').then((m) => ({ default: m.RichTextEditor }))
)

// ============================================================================
// Types
// ============================================================================

export type JsonValue = string | number | boolean | null | JsonObject | JsonArray
export type JsonObject = { [key: string]: JsonValue }
export type JsonArray = JsonValue[]

export type ValueType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array' | 'html'

export interface JsonEditorProps {
  value: string // JSON string
  onChange: (value: string) => void
  className?: string
}

// ============================================================================
// Utilities
// ============================================================================

function parseJson(jsonStr: string): JsonObject {
  try {
    const parsed = JSON.parse(jsonStr || '{}')
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function isHtmlContent(str: string): boolean {
  if (!str || typeof str !== 'string') return false
  return /<[a-z][\s\S]*>/i.test(str)
}

function detectType(value: JsonValue): ValueType {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'string' && isHtmlContent(value)) return 'html'
  return 'string'
}

function getDefaultValue(type: ValueType): JsonValue {
  switch (type) {
    case 'string':
      return ''
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'null':
      return null
    case 'object':
      return {}
    case 'array':
      return []
    case 'html':
      return '<p></p>'
    default:
      return ''
  }
}

function updateNestedValue(obj: JsonObject, path: string[], value: JsonValue): JsonObject {
  if (path.length === 0) return obj
  if (path.length === 1) {
    return { ...obj, [path[0]]: value }
  }
  const [first, ...rest] = path
  const nested = obj[first]
  if (typeof nested === 'object' && nested !== null && !Array.isArray(nested)) {
    return { ...obj, [first]: updateNestedValue(nested as JsonObject, rest, value) }
  }
  return obj
}

function deleteNestedKey(obj: JsonObject, path: string[]): JsonObject {
  if (path.length === 0) return obj
  if (path.length === 1) {
    const result = { ...obj }
    delete result[path[0]]
    return result
  }
  const [first, ...restPath] = path
  const nested = obj[first]
  if (typeof nested === 'object' && nested !== null && !Array.isArray(nested)) {
    return { ...obj, [first]: deleteNestedKey(nested as JsonObject, restPath) }
  }
  return obj
}

function renameNestedKey(obj: JsonObject, path: string[], newKey: string): JsonObject {
  if (path.length === 0) return obj
  if (path.length === 1) {
    const oldKey = path[0]
    if (oldKey === newKey) return obj
    const { [oldKey]: value, ...rest } = obj
    return { ...rest, [newKey]: value }
  }
  const [first, ...restPath] = path
  const nested = obj[first]
  if (typeof nested === 'object' && nested !== null && !Array.isArray(nested)) {
    return { ...obj, [first]: renameNestedKey(nested as JsonObject, restPath, newKey) }
  }
  return obj
}

// ============================================================================
// Sub Components (Memoized)
// ============================================================================

interface TypeSelectorProps {
  value: ValueType
  onChange: (type: ValueType) => void
}

const TypeSelector = memo(function TypeSelector({ value, onChange }: TypeSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ValueType)}>
      <SelectTrigger className="h-8! w-24 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="string">String</SelectItem>
        <SelectItem value="number">Number</SelectItem>
        <SelectItem value="boolean">Boolean</SelectItem>
        <SelectItem value="null">Null</SelectItem>
        <SelectItem value="object">Object</SelectItem>
        <SelectItem value="array">Array</SelectItem>
        <SelectItem value="html">HTML</SelectItem>
      </SelectContent>
    </Select>
  )
})

interface ValueEditorProps {
  value: JsonValue
  type: ValueType
  onChange: (value: JsonValue) => void
  onCancel?: () => void
  autoFocus?: boolean
}

const ValueEditor = memo(function ValueEditor({
  value,
  type,
  onChange,
  onCancel,
  autoFocus,
}: ValueEditorProps) {
  const stringValue = String(value ?? '')

  if (type === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        <Switch checked={Boolean(value)} onCheckedChange={(checked) => onChange(checked)} />
        <span className="text-sm text-muted-foreground">{value ? 'true' : 'false'}</span>
      </div>
    )
  }

  if (type === 'null') {
    return <span className="text-sm text-muted-foreground italic">null</span>
  }

  if (type === 'html') {
    return (
      <div className="w-full">
        <Suspense fallback={<div className="h-24 animate-pulse bg-muted rounded" />}>
          <RichTextEditor
            value={stringValue}
            onChange={onChange}
            placeholder="Enter HTML content..."
            className="min-h-24"
          />
        </Suspense>
      </div>
    )
  }

  if (type === 'number') {
    return (
      <Input
        type="number"
        value={stringValue}
        onChange={(e) => {
          const num = parseFloat(e.target.value)
          onChange(isNaN(num) ? 0 : num)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel?.()
        }}
        className="h-8 w-32"
        autoFocus={autoFocus}
      />
    )
  }

  // String
  return (
    <Input
      value={stringValue}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel?.()
      }}
      className="h-8 flex-1"
      autoFocus={autoFocus}
    />
  )
})

interface ValueDisplayProps {
  value: JsonValue
  type: ValueType
  onDoubleClick?: () => void
}

const typeLabels: Record<ValueType, string> = {
  string: 'str',
  number: 'num',
  boolean: 'bool',
  null: 'null',
  object: 'obj',
  array: 'arr',
  html: 'html',
}

const TypeBadge = memo(function TypeBadge({ type }: { type: ValueType }) {
  return (
    <Badge
      variant="outline"
      className="text-[10px] px-1.5 py-0 h-4 font-medium uppercase text-muted-foreground"
    >
      {typeLabels[type]}
    </Badge>
  )
})

const ValueDisplay = memo(function ValueDisplay({ value, type, onDoubleClick }: ValueDisplayProps) {
  if (type === 'boolean') {
    return (
      <span
        className="inline-flex items-center gap-2 cursor-pointer min-w-0"
        onDoubleClick={onDoubleClick}
      >
        <TypeBadge type={type} />
        <span className="text-sm text-muted-foreground">{value ? 'true' : 'false'}</span>
      </span>
    )
  }

  if (type === 'null') {
    return (
      <span
        className="inline-flex items-center gap-2 cursor-pointer min-w-0"
        onDoubleClick={onDoubleClick}
      >
        <TypeBadge type={type} />
        <span className="text-sm text-muted-foreground italic">null</span>
      </span>
    )
  }

  if (type === 'number') {
    return (
      <span
        className="inline-flex items-center gap-2 cursor-pointer min-w-0"
        onDoubleClick={onDoubleClick}
      >
        <TypeBadge type={type} />
        <span className="text-sm text-muted-foreground">{String(value)}</span>
      </span>
    )
  }

  if (type === 'html') {
    const strVal = String(value)
    return (
      <span
        className="inline-flex items-center gap-2 cursor-pointer min-w-0 flex-1"
        onDoubleClick={onDoubleClick}
      >
        <TypeBadge type={type} />
        {strVal ? (
          <span
            className="text-sm prose prose-sm max-w-none [&>*]:my-0 line-clamp-1"
            dangerouslySetInnerHTML={{ __html: strVal }}
          />
        ) : (
          <span className="text-sm text-muted-foreground italic">empty</span>
        )}
      </span>
    )
  }

  // String
  const strVal = String(value)
  return (
    <span
      className="inline-flex items-center gap-2 cursor-pointer min-w-0"
      onDoubleClick={onDoubleClick}
    >
      <TypeBadge type={type} />
      <span className="text-sm text-muted-foreground truncate">
        {strVal || <span className="italic">empty</span>}
      </span>
    </span>
  )
})

// ============================================================================
// JsonNode Component
// ============================================================================

interface JsonNodeProps {
  keyName: string
  value: JsonValue
  path: string[]
  onValueChange: (path: string[], value: JsonValue) => void
  onDelete: (path: string[]) => void
  onRename: (path: string[], newKey: string) => void
  level: number
}

const JsonNode = memo(function JsonNode({
  keyName,
  value,
  path,
  onValueChange,
  onDelete,
  onRename,
  level,
}: JsonNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingKey, setEditingKey] = useState(false)
  const [localKey, setLocalKey] = useState(keyName)
  const [collapsed, setCollapsed] = useState(level > 1)
  const [editType, setEditType] = useState<ValueType>(() => detectType(value))

  const currentType = detectType(value)
  const isCollection = currentType === 'object' || currentType === 'array'

  const handleValueChange = useCallback(
    (newValue: JsonValue) => {
      onValueChange(path, newValue)
    },
    [onValueChange, path]
  )

  const handleTypeChange = useCallback(
    (newType: ValueType) => {
      setEditType(newType)
      const newValue = getDefaultValue(newType)
      onValueChange(path, newValue)
      if (newType === 'object' || newType === 'array') {
        setIsEditing(false)
      }
    },
    [onValueChange, path]
  )

  const handleDelete = useCallback(() => {
    onDelete(path)
  }, [onDelete, path])

  const handleKeyRename = useCallback(() => {
    if (localKey && localKey !== keyName) {
      onRename(path, localKey)
    }
    setEditingKey(false)
  }, [localKey, keyName, onRename, path])

  const handleAddChild = useCallback(() => {
    if (currentType === 'object') {
      const obj = value as JsonObject
      let newKey = 'newKey'
      let counter = 1
      while (obj[newKey] !== undefined) {
        newKey = `newKey${counter++}`
      }
      onValueChange(path, { ...obj, [newKey]: '' })
      setCollapsed(false)
    } else if (currentType === 'array') {
      const arr = value as JsonArray
      onValueChange(path, [...arr, ''])
      setCollapsed(false)
    }
  }, [currentType, value, onValueChange, path])

  const startEditKey = useCallback(() => {
    setLocalKey(keyName)
    setEditingKey(true)
  }, [keyName])

  const cancelEditKey = useCallback(() => {
    setLocalKey(keyName)
    setEditingKey(false)
  }, [keyName])

  return (
    <div>
      <div className={cn('group/node flex items-center gap-1', isEditing ? 'py-1' : 'py-0.5')}>
        {/* Collapse toggle for collections */}
        <div className="w-5 flex-shrink-0 flex items-center justify-center">
          {isCollection && !isEditing && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-0.5 hover:bg-muted rounded"
            >
              {collapsed ? (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          )}
        </div>

        {/* Key */}
        <div className="flex-shrink-0 flex items-center">
          {editingKey ? (
            <Input
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              onBlur={handleKeyRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleKeyRename()
                if (e.key === 'Escape') cancelEditKey()
              }}
              className="h-7 w-24 text-sm"
              autoFocus
            />
          ) : (
            <span
              className="text-sm font-medium text-foreground cursor-pointer hover:underline"
              onDoubleClick={startEditKey}
            >
              {keyName}
            </span>
          )}
          <span className="text-muted-foreground mx-1">:</span>
        </div>

        {/* Value */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <TypeSelector value={editType} onChange={handleTypeChange} />
              {editType !== 'object' && editType !== 'array' && (
                <div className="flex-1">
                  <ValueEditor
                    value={value}
                    type={editType}
                    onChange={handleValueChange}
                    onCancel={() => setIsEditing(false)}
                    autoFocus
                  />
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsEditing(false)}
              >
                <Check className="h-4 w-4 text-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsEditing(false)}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ) : isCollection ? (
            <span
              className="inline-flex items-center gap-2 cursor-pointer"
              onDoubleClick={() => {
                setEditType(currentType)
                setIsEditing(true)
              }}
            >
              <TypeBadge type={currentType} />
              <span className="text-sm text-muted-foreground">
                {currentType === 'object' ? '{' : '['}
                {collapsed && (
                  <span className="ml-1">
                    {currentType === 'object'
                      ? `${Object.keys(value as JsonObject).length} items`
                      : `${(value as JsonArray).length} items`}
                  </span>
                )}
                {collapsed && (currentType === 'object' ? '}' : ']')}
              </span>
            </span>
          ) : (
            <ValueDisplay
              value={value}
              type={currentType}
              onDoubleClick={() => {
                setEditType(currentType)
                setIsEditing(true)
              }}
            />
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover/node:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setEditType(currentType)
                  setIsEditing(true)
                }}
              >
                <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </Button>
              {isCollection && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleAddChild}>
                  <Plus className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDelete}>
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {isCollection && !collapsed && (
        <>
          <div className="ml-5 border-l border-border pl-3">
            {currentType === 'object' &&
              Object.entries(value as JsonObject).map(([k, v]) => (
                <JsonNode
                  key={k}
                  keyName={k}
                  value={v}
                  path={[...path, k]}
                  onValueChange={onValueChange}
                  onDelete={onDelete}
                  onRename={onRename}
                  level={level + 1}
                />
              ))}
            {currentType === 'array' &&
              (value as JsonArray).map((item, index) => (
                <JsonNode
                  key={index}
                  keyName={String(index)}
                  value={item}
                  path={[...path, String(index)]}
                  onValueChange={onValueChange}
                  onDelete={onDelete}
                  onRename={onRename}
                  level={level + 1}
                />
              ))}
          </div>
          {/* Closing bracket - same level as opening */}
          <div className="flex items-center gap-1 py-0.5">
            <div className="w-5" />
            <span className="text-sm text-muted-foreground">
              {currentType === 'object' ? '}' : ']'}
            </span>
          </div>
        </>
      )}
    </div>
  )
})

// ============================================================================
// Main Component
// ============================================================================

type EditorMode = 'visual' | 'code'

export function JsonEditor({ value, onChange, className }: JsonEditorProps) {
  const [mode, setMode] = useState<EditorMode>('visual')
  const [codeValue, setCodeValue] = useState(value)
  const [codeError, setCodeError] = useState<string | null>(null)

  // Track the last value we sent to parent to detect external changes
  const lastSentValueRef = useRef(value)
  const [data, setData] = useState<JsonObject>(() => parseJson(value))
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced onChange to reduce parent re-renders
  const debouncedOnChange = useMemo(() => {
    return (json: string) => {
      lastSentValueRef.current = json
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        onChange(json)
      }, 150)
    }
  }, [onChange])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Sync from external value changes (controlled component pattern)
  useEffect(() => {
    // Only update if value changed externally (not from our own onChange)
    if (value !== lastSentValueRef.current) {
      const parsed = parseJson(value)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(parsed)
      setCodeValue(value)
      lastSentValueRef.current = value
    }
  }, [value])

  // Sync code value when switching to code mode
  useEffect(() => {
    if (mode === 'code') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCodeValue(JSON.stringify(data, null, 2))
      setCodeError(null)
    }
  }, [mode, data])

  const handleValueChange = useCallback(
    (path: string[], newValue: JsonValue) => {
      setData((prev) => {
        const updated = updateNestedValue(prev, path, newValue)
        const json = JSON.stringify(updated, null, 2)
        debouncedOnChange(json)
        return updated
      })
    },
    [debouncedOnChange]
  )

  const handleDelete = useCallback(
    (path: string[]) => {
      setData((prev) => {
        const updated = deleteNestedKey(prev, path)
        const json = JSON.stringify(updated, null, 2)
        debouncedOnChange(json)
        return updated
      })
    },
    [debouncedOnChange]
  )

  const handleRename = useCallback(
    (path: string[], newKey: string) => {
      setData((prev) => {
        const updated = renameNestedKey(prev, path, newKey)
        const json = JSON.stringify(updated, null, 2)
        debouncedOnChange(json)
        return updated
      })
    },
    [debouncedOnChange]
  )

  const handleAddRoot = useCallback(() => {
    setData((prev) => {
      let newKey = 'newKey'
      let counter = 1
      while (prev[newKey] !== undefined) {
        newKey = `newKey${counter++}`
      }
      const updated = { ...prev, [newKey]: '' }
      const json = JSON.stringify(updated, null, 2)
      debouncedOnChange(json)
      return updated
    })
  }, [debouncedOnChange])

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCodeValue(newCode)
      try {
        const parsed = JSON.parse(newCode || '{}')
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          setCodeError(null)
          setData(parsed)
          debouncedOnChange(newCode)
        } else {
          setCodeError('Must be a JSON object')
        }
      } catch (e) {
        setCodeError((e as Error).message)
      }
    },
    [debouncedOnChange]
  )

  const isEmpty = Object.keys(data).length === 0

  return (
    <div className={cn('rounded-md border', className)}>
      {/* Mode toggle */}
      <div className="flex items-center justify-end gap-1 px-2 py-1.5 border-b bg-muted/30">
        <Button
          variant={mode === 'visual' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-6 px-2 text-xs gap-1"
          onClick={() => setMode('visual')}
        >
          <TreeDeciduous className="h-3 w-3" />
          Visual
        </Button>
        <Button
          variant={mode === 'code' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-6 px-2 text-xs gap-1"
          onClick={() => setMode('code')}
        >
          <Code className="h-3 w-3" />
          Code
        </Button>
      </div>

      {/* Editor content */}
      <div className="p-3">
        {mode === 'code' ? (
          <div className="space-y-2">
            <Textarea
              value={codeValue}
              onChange={(e) => handleCodeChange(e.target.value)}
              className={cn(
                'font-mono text-sm min-h-[200px] resize-y',
                codeError && 'border-destructive focus-visible:ring-destructive'
              )}
              placeholder='{"key": "value"}'
            />
            {codeError && <p className="text-xs text-destructive">{codeError}</p>}
          </div>
        ) : isEmpty ? (
          <div className="flex items-center justify-center py-6">
            <Button variant="outline" size="sm" onClick={handleAddRoot} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add field
            </Button>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">{'{'}</div>
            <div className="ml-2">
              {Object.entries(data).map(([key, val]) => (
                <JsonNode
                  key={key}
                  keyName={key}
                  value={val}
                  path={[key]}
                  onValueChange={handleValueChange}
                  onDelete={handleDelete}
                  onRename={handleRename}
                  level={0}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{'}'}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddRoot}
                className="h-6 gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
                Add field
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
