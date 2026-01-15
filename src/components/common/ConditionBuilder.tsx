import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { Conditions, ConditionGroup, Condition, ConditionOperator } from '@/types/conditions'

interface FieldDefinition {
  name: string
  label: string
  type: 'text' | 'number' | 'boolean'
}

interface ConditionBuilderProps {
  value?: Conditions
  onChange: (value: Conditions | undefined) => void
  availableFields?: FieldDefinition[]
}

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'eq', label: '= (equals)' },
  { value: 'ne', label: '≠ (not equals)' },
  { value: 'gt', label: '> (greater than)' },
  { value: 'gte', label: '≥ (greater or equal)' },
  { value: 'lt', label: '< (less than)' },
  { value: 'lte', label: '≤ (less or equal)' },
  { value: 'in', label: 'in (array)' },
  { value: 'not_in', label: 'not in (array)' },
]

export function ConditionBuilder({
  value,
  onChange,
  availableFields = [],
}: ConditionBuilderProps) {
  const [fields, setFields] = useState<FieldDefinition[]>(availableFields)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'boolean'>('text')

  // Normalize to ConditionGroup for easier manipulation
  const normalizeToGroup = (cond: Conditions | undefined): ConditionGroup => {
    if (!cond) {
      return { mode: 'AND', conditions: [] }
    }

    // Already a group
    if ('mode' in cond && 'conditions' in cond) {
      return cond
    }

    // Single condition
    if ('field' in cond) {
      return { mode: 'AND', conditions: [cond] }
    }

    // Array of conditions
    return { mode: 'AND', conditions: cond }
  }

  // Denormalize from ConditionGroup to backend format
  const denormalizeGroup = (group: ConditionGroup): Conditions | undefined => {
    if (group.conditions.length === 0) {
      return undefined
    }

    // Single condition - return as Condition
    if (group.conditions.length === 1 && 'field' in group.conditions[0]) {
      return group.conditions[0] as Condition
    }

    // All simple conditions with AND mode - return as Condition[]
    const allSimple = group.conditions.every((c) => 'field' in c)
    if (allSimple && group.mode === 'AND') {
      return group.conditions as Condition[]
    }

    // Otherwise return as ConditionGroup
    return group
  }

  const currentGroup = normalizeToGroup(value)

  const handleGroupChange = (newGroup: ConditionGroup) => {
    onChange(denormalizeGroup(newGroup))
  }

  const addField = () => {
    if (!newFieldName.trim()) return
    setFields([...fields, { name: newFieldName.trim(), label: newFieldName.trim(), type: newFieldType }])
    setNewFieldName('')
  }

  const removeField = (fieldName: string) => {
    setFields(fields.filter((f) => f.name !== fieldName))
  }

  return (
    <div className="space-y-6">
      {/* Field Manager */}
      <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
        <h4 className="text-sm font-semibold">Manage Fields</h4>
        <div className="flex gap-2">
          <Input
            placeholder="Field name (e.g. tierName, amount)"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            className="flex-1"
          />
          <Select value={newFieldType} onValueChange={(v: 'text' | 'number' | 'boolean') => setNewFieldType(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" onClick={addField} variant="secondary" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {fields.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {fields.map((field) => (
              <Badge key={field.name} variant="secondary" className="pl-2 pr-1">
                {field.label} ({field.type})
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-2 hover:bg-transparent"
                  onClick={() => removeField(field.name)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Query Builder */}
      <ConditionGroupBuilder
        group={currentGroup}
        fields={fields}
        onChange={handleGroupChange}
        depth={0}
      />

      {/* Preview */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <h4 className="text-sm font-semibold mb-2">Preview (Backend Format)</h4>
        <pre className="text-xs overflow-auto max-h-48 bg-background p-3 rounded border">
          {JSON.stringify(denormalizeGroup(currentGroup), null, 2) || 'null'}
        </pre>
      </div>
    </div>
  )
}

interface ConditionGroupBuilderProps {
  group: ConditionGroup
  fields: FieldDefinition[]
  onChange: (group: ConditionGroup) => void
  onRemove?: () => void
  depth: number
}

function ConditionGroupBuilder({ group, fields, onChange, onRemove, depth }: ConditionGroupBuilderProps) {
  const addCondition = () => {
    const newCondition: Condition = {
      field: fields[0]?.name || '',
      op: 'eq',
      value: '',
    }
    onChange({
      ...group,
      conditions: [...group.conditions, newCondition],
    })
  }

  const addGroup = () => {
    const newGroup: ConditionGroup = {
      mode: 'AND',
      conditions: [],
    }
    onChange({
      ...group,
      conditions: [...group.conditions, newGroup],
    })
  }

  const removeCondition = (index: number) => {
    onChange({
      ...group,
      conditions: group.conditions.filter((_, i) => i !== index),
    })
  }

  const updateCondition = (index: number, updated: Condition | ConditionGroup) => {
    onChange({
      ...group,
      conditions: group.conditions.map((c, i) => (i === index ? updated : c)),
    })
  }

  const toggleMode = () => {
    onChange({
      ...group,
      mode: group.mode === 'AND' ? 'OR' : 'AND',
    })
  }

  return (
    <div
      className="border rounded-lg p-4 space-y-3"
      style={{ marginLeft: depth > 0 ? '1rem' : 0 }}
    >
      {/* Group Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={group.mode === 'AND' ? 'default' : 'outline'}
            size="sm"
            onClick={toggleMode}
            className="h-7 px-3"
          >
            {group.mode}
          </Button>
          <span className="text-xs text-muted-foreground">
            {group.mode === 'AND' ? 'All conditions must match' : 'At least one condition must match'}
          </span>
        </div>
        {onRemove && depth > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 w-7 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Conditions */}
      {group.conditions.map((condition, index) => (
        <div key={index}>
          {'field' in condition ? (
            <ConditionRow
              condition={condition}
              fields={fields}
              onChange={(updated) => updateCondition(index, updated)}
              onRemove={() => removeCondition(index)}
            />
          ) : (
            <ConditionGroupBuilder
              group={condition}
              fields={fields}
              onChange={(updated) => updateCondition(index, updated)}
              onRemove={() => removeCondition(index)}
              depth={depth + 1}
            />
          )}
        </div>
      ))}

      {/* Add Buttons */}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={addCondition} disabled={fields.length === 0}>
          <Plus className="h-3 w-3 mr-1" />
          Add Condition
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={addGroup}>
          <Plus className="h-3 w-3 mr-1" />
          Add Group
        </Button>
      </div>
    </div>
  )
}

interface ConditionRowProps {
  condition: Condition
  fields: FieldDefinition[]
  onChange: (condition: Condition) => void
  onRemove: () => void
}

function ConditionRow({ condition, fields, onChange, onRemove }: ConditionRowProps) {
  const currentField = fields.find((f) => f.name === condition.field)

  const handleValueChange = (newValue: string) => {
    const field = fields.find((f) => f.name === condition.field)
    if (!field) {
      onChange({ ...condition, value: newValue })
      return
    }

    // Parse value based on field type
    if (field.type === 'number') {
      onChange({ ...condition, value: newValue ? parseFloat(newValue) : '' })
    } else if (field.type === 'boolean') {
      onChange({ ...condition, value: newValue === 'true' })
    } else if (condition.op === 'in' || condition.op === 'not_in') {
      // Array input - comma separated
      const arr = newValue
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
      onChange({ ...condition, value: arr })
    } else {
      onChange({ ...condition, value: newValue })
    }
  }

  const getValueInput = () => {
    const isArrayOp = condition.op === 'in' || condition.op === 'not_in'

    if (isArrayOp) {
      return (
        <Input
          placeholder="value1, value2, value3"
          value={Array.isArray(condition.value) ? condition.value.join(', ') : ''}
          onChange={(e) => handleValueChange(e.target.value)}
          className="flex-1"
        />
      )
    }

    if (currentField?.type === 'boolean') {
      return (
        <Select
          value={condition.value === true ? 'true' : condition.value === false ? 'false' : ''}
          onValueChange={handleValueChange}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">true</SelectItem>
            <SelectItem value="false">false</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    return (
      <Input
        type={currentField?.type === 'number' ? 'number' : 'text'}
        placeholder="value"
        value={String(condition.value ?? '')}
        onChange={(e) => handleValueChange(e.target.value)}
        className="flex-1"
      />
    )
  }

  return (
    <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/20">
      {/* Field */}
      <Select value={condition.field} onValueChange={(v) => onChange({ ...condition, field: v })}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Field" />
        </SelectTrigger>
        <SelectContent>
          {fields.map((field) => (
            <SelectItem key={field.name} value={field.name}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator */}
      <Select value={condition.op} onValueChange={(v: ConditionOperator) => onChange({ ...condition, op: v })}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPERATORS.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value */}
      {getValueInput()}

      {/* Remove */}
      <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="h-9 w-9 p-0">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
