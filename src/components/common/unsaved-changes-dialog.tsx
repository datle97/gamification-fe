import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import * as React from 'react'
import { useCallback, useState } from 'react'

import { cn } from '@/lib/utils'
import { UnsavedChangesAlert } from './unsaved-changes-alert'

// Re-export unchanged Dialog components
export { DialogTrigger, DialogClose, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface UnsavedChangesDialogProps extends React.ComponentProps<typeof DialogPrimitive.Root> {
  /** Whether the form has unsaved changes */
  isDirty?: boolean
  /** Custom alert title */
  alertTitle?: string
  /** Custom alert description */
  alertDescription?: string
}

export function UnsavedChangesDialog({
  isDirty = false,
  alertTitle,
  alertDescription,
  open,
  onOpenChange,
  children,
  ...props
}: UnsavedChangesDialogProps) {
  const [showAlert, setShowAlert] = useState(false)

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      // Only intercept when trying to close and there are unsaved changes
      if (!newOpen && isDirty) {
        setShowAlert(true)
        return
      }
      onOpenChange?.(newOpen)
    },
    [isDirty, onOpenChange]
  )

  const handleConfirmClose = useCallback(() => {
    setShowAlert(false)
    onOpenChange?.(false)
  }, [onOpenChange])

  return (
    <>
      <DialogPrimitive.Root data-slot="dialog" open={open} onOpenChange={handleOpenChange} {...props}>
        {children}
      </DialogPrimitive.Root>

      <UnsavedChangesAlert
        open={showAlert}
        onOpenChange={setShowAlert}
        onConfirm={handleConfirmClose}
        title={alertTitle}
        description={alertDescription}
      />
    </>
  )
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className
      )}
      {...props}
    />
  )
}

interface UnsavedChangesDialogContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  showCloseButton?: boolean
}

/**
 * Large form dialog content with standard layout.
 * Default: max-w-6xl, 95vw wide, 90vh tall, positioned at top 5%.
 * Use className to override (e.g., "max-w-7xl!" for wider dialogs).
 */
export function UnsavedChangesDialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: UnsavedChangesDialogContentProps) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // Base styles
          'bg-background fixed z-50 rounded-lg border shadow-lg outline-none',
          // Animation
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200',
          // Large dialog layout (standard for forms)
          'max-w-6xl w-[95vw] max-h-[90vh]',
          'flex flex-col gap-4',
          'p-0',
          // Position at top instead of center
          'top-[5%] left-[50%] translate-x-[-50%] translate-y-0',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

/**
 * Dialog header with standard padding.
 */
export function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left px-6 pt-6', className)}
      {...props}
    />
  )
}

/**
 * Dialog body - the main content area that fills remaining space.
 * Default: px-6, overflow-y-auto for simple scrollable dialogs.
 * Override with className="overflow-hidden" for dialogs with inner scroll areas (tabs, ScrollArea).
 * Override with className="px-0" for edge-to-edge content.
 */
export function DialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-body"
      className={cn('flex-1 flex flex-col min-h-0 overflow-y-auto px-6', className)}
      {...props}
    />
  )
}

/**
 * Dialog footer with standard padding and button layout.
 */
export function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-row justify-end gap-2 px-6 pb-6', className)}
      {...props}
    />
  )
}
