import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'

export interface ComboboxOption {
  value: string
  label: string
  description?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  /** Allow custom values not in the options list */
  allowCustom?: boolean
  /** Render custom content for each option */
  renderOption?: (option: ComboboxOption) => React.ReactNode
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  className,
  allowCustom = false,
  renderOption,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')

  const selectedOption = options.find((opt) => opt.value === value)
  const displayValue = selectedOption?.label || value || placeholder

  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options
    const lower = inputValue.toLowerCase()
    return options.filter(
      (opt) => opt.value.toLowerCase().includes(lower) || opt.label.toLowerCase().includes(lower)
    )
  }, [options, inputValue])

  const showCustomOption =
    allowCustom &&
    inputValue &&
    !options.some((opt) => opt.value === inputValue || opt.label === inputValue)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                    setInputValue('')
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {renderOption ? renderOption(option) : <span>{option.label}</span>}
                </CommandItem>
              ))}
              {showCustomOption && (
                <CommandItem
                  value={inputValue}
                  onSelect={() => {
                    onChange(inputValue)
                    setOpen(false)
                    setInputValue('')
                  }}
                  className="text-muted-foreground"
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  <span>
                    Use "<span className="font-mono text-foreground">{inputValue}</span>"
                  </span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
