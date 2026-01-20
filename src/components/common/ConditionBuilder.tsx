import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Condition, ConditionGroup, ConditionOperator, Conditions } from '@/types/conditions'
import { ChevronsUpDown, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface FieldDefinition {
  name: string
  label: string
  type: 'text' | 'number' | 'boolean'
}

interface ConditionBuilderProps {
  value?: Conditions
  onChange: (value: Conditions | undefined) => void
  fieldDefinitions?: FieldDefinition[]
  onFieldDefinitionsChange?: (fields: FieldDefinition[]) => void
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
  fieldDefinitions = [],
  onFieldDefinitionsChange,
}: ConditionBuilderProps) {
  const [internalFields, setInternalFields] = useState<FieldDefinition[]>(fieldDefinitions)

  // Use internal state if no external control
  const fields = onFieldDefinitionsChange ? fieldDefinitions : internalFields
  const setFields = onFieldDefinitionsChange || setInternalFields

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

  const handleAddField = (field: FieldDefinition) => {
    const existingIndex = fields.findIndex((f) => f.name === field.name)
    if (existingIndex >= 0) {
      // Replace existing field
      const updated = [...fields]
      updated[existingIndex] = field
      setFields(updated)
    } else {
      // Add new field
      setFields([...fields, field])
    }
  }

  return (
    <div className="space-y-6">
      {/* Query Builder */}
      <ConditionGroupBuilder
        group={currentGroup}
        availableFields={fields}
        onAddField={handleAddField}
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
  availableFields: FieldDefinition[]
  onAddField: (field: FieldDefinition) => void
  onChange: (group: ConditionGroup) => void
  onRemove?: () => void
  depth: number
}

function ConditionGroupBuilder({
  group,
  availableFields,
  onAddField,
  onChange,
  onRemove,
  depth,
}: ConditionGroupBuilderProps) {
  const addCondition = () => {
    const newCondition: Condition = {
      field: '',
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
    <div className="border rounded-lg p-4 space-y-3" style={{ marginLeft: depth > 0 ? '1rem' : 0 }}>
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
            {group.mode === 'AND'
              ? 'All conditions must match'
              : 'At least one condition must match'}
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
              availableFields={availableFields}
              onAddField={onAddField}
              onChange={(updated) => updateCondition(index, updated)}
              onRemove={() => removeCondition(index)}
            />
          ) : (
            <ConditionGroupBuilder
              group={condition}
              availableFields={availableFields}
              onAddField={onAddField}
              onChange={(updated) => updateCondition(index, updated)}
              onRemove={() => removeCondition(index)}
              depth={depth + 1}
            />
          )}
        </div>
      ))}

      {/* Add Buttons */}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={addCondition}>
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
  availableFields: FieldDefinition[]
  onAddField: (field: FieldDefinition) => void
  onChange: (condition: Condition) => void
  onRemove: () => void
}

function ConditionRow({
  condition,
  availableFields,
  onAddField,
  onChange,
  onRemove,
}: ConditionRowProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const currentField = availableFields.find((f) => f.name === condition.field)
  const currentType = currentField?.type || 'text'

  // Handle popover open/close
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && condition.field) {
      // When opening, pre-fill search with current field
      setSearchValue(condition.field)
    } else if (!newOpen) {
      // When closing, clear search
      setSearchValue('')
    }
    setOpen(newOpen)
  }

  // Select existing field
  const handleFieldSelect = (fieldName: string) => {
    onChange({ ...condition, field: fieldName, value: '' })
    setSearchValue('')
    setOpen(false)
  }

  // Handle new field name input via Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      e.preventDefault()
      const trimmedName = searchValue.trim()
      const existing = availableFields.find((f) => f.name === trimmedName)

      if (existing) {
        // Field already exists, just select it
        handleFieldSelect(trimmedName)
      } else {
        // New field with default type 'text'
        const newField: FieldDefinition = {
          name: trimmedName,
          label: trimmedName,
          type: 'text',
        }
        onAddField(newField)
        onChange({ ...condition, field: trimmedName, value: '' })
        setSearchValue('')
        setOpen(false)
      }
    }
  }

  // Handle type change
  const handleTypeChange = (newType: 'text' | 'number' | 'boolean') => {
    const updatedField: FieldDefinition = {
      name: condition.field,
      label: condition.field,
      type: newType,
    }
    onAddField(updatedField) // This will add or replace the field

    // Get valid operators for new type
    const getValidOperators = (type: string) => {
      if (type === 'boolean') {
        return ['eq', 'ne']
      }
      if (type === 'text') {
        return ['eq', 'ne', 'in', 'not_in']
      }
      return ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in']
    }

    const validOps = getValidOperators(newType)
    const newOp = validOps.includes(condition.op) ? condition.op : 'eq'

    // Reset value and possibly operator when type changes
    onChange({ ...condition, op: newOp as ConditionOperator, value: '' })
  }

  const handleValueChange = (newValue: string) => {
    const field = availableFields.find((f) => f.name === condition.field)
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

  // Get available operators based on field type
  const getAvailableOperators = () => {
    const type = currentType
    if (type === 'boolean') {
      return OPERATORS.filter((op) => ['eq', 'ne'].includes(op.value))
    }
    if (type === 'number') {
      return OPERATORS
    }
    // text: only equality and array operators
    return OPERATORS.filter((op) => ['eq', 'ne', 'in', 'not_in'].includes(op.value))
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
      {/* Field - Combobox */}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-48 justify-between font-normal"
          >
            {condition.field || 'Type field name...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command
            onKeyDown={handleKeyDown}
            className="[&_[data-slot=command-input-wrapper]_svg]:hidden"
          >
            <CommandInput
              placeholder="Type field name..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty className="text-center text-sm">
                <div className="py-2 px-2 text-sm text-muted-foreground">
                  {searchValue.trim() ? (
                    <>
                      Press Enter to add "
                      <span className="font-medium text-foreground">{searchValue}</span>"
                    </>
                  ) : (
                    'Type field name and press Enter'
                  )}
                </div>
              </CommandEmpty>
              {availableFields.length > 0 && (
                <CommandGroup>
                  {availableFields.map((field) => (
                    <CommandItem key={field.name} value={field.name} onSelect={handleFieldSelect}>
                      <span>{field.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{field.type}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Datatype */}
      {condition.field && (
        <Select value={currentType} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Operator */}
      {condition.field && (
        <Select
          value={condition.op}
          onValueChange={(v: ConditionOperator) => onChange({ ...condition, op: v })}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getAvailableOperators().map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Value */}
      {condition.field && getValueInput()}

      {/* Remove */}
      <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="h-9 w-9 p-0">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
