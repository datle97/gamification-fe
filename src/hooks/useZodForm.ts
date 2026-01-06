import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type UseFormProps, type FieldValues } from 'react-hook-form'
import type { z } from 'zod'

export function useZodForm<TFieldValues extends FieldValues>(
  schema: z.ZodType<TFieldValues>,
  options?: Omit<UseFormProps<TFieldValues>, 'resolver'>
) {
  return useForm<TFieldValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    ...options,
  })
}
