import { useMemo } from 'react'

/**
 * Deep comparison of two values
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return a === b
  if (typeof a !== typeof b) return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, index) => deepEqual(item, b[index]))
  }

  if (typeof a === 'object') {
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>

    const aKeys = Object.keys(aObj)
    const bKeys = Object.keys(bObj)

    if (aKeys.length !== bKeys.length) return false

    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]))
  }

  return false
}

interface UseUnsavedChangesOptions<T> {
  /** Current form data */
  data: T
  /** Initial/original data to compare against (pass undefined when dialog is closed) */
  initialData?: T
  /** Custom comparison function */
  compare?: (current: T, initial: T) => boolean
}

interface UseUnsavedChangesReturn {
  /** Whether the form has unsaved changes */
  isDirty: boolean
}

/**
 * Hook to track unsaved changes in a form.
 *
 * The hook compares `data` with `initialData` using deep equality.
 * Pass `initialData` only when the dialog/sheet is open.
 *
 * IMPORTANT: Store `initialData` in a separate state variable that you set
 * when the dialog opens. This ensures the comparison is against a stable reference.
 *
 * @example
 * ```tsx
 * const [formData, setFormData] = useState(defaultData)
 * const [initialData, setInitialData] = useState(defaultData)
 *
 * const { isDirty } = useUnsavedChanges({
 *   data: formData,
 *   initialData: isOpen ? initialData : undefined,
 * })
 *
 * // When opening dialog, set both form data and initial data
 * const handleOpen = (dataFromApi) => {
 *   setFormData(dataFromApi)
 *   setInitialData(dataFromApi)  // Store reference for comparison
 *   setIsOpen(true)
 * }
 * ```
 */
export function useUnsavedChanges<T>({
  data,
  initialData,
  compare = deepEqual,
}: UseUnsavedChangesOptions<T>): UseUnsavedChangesReturn {
  const isDirty = useMemo(() => {
    if (initialData === undefined) return false
    return !compare(data, initialData)
  }, [data, initialData, compare])

  return { isDirty }
}
