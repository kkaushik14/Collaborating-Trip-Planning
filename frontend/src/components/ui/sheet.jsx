import { Dialog as SheetPrimitive } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Sheet(props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger(props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose(props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal(props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm transition-opacity duration-200 ease-out',
        'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  ...props
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          'fixed z-50 flex flex-col gap-lg border-line bg-panel p-lg text-body-sm text-ink shadow-card outline-none',
          'will-change-[opacity,transform] transition-[opacity,transform] duration-220 ease-out',
          'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
          'data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:border-b',
          'data-[side=top]:data-[starting-style]:-translate-y-3 data-[side=top]:data-[ending-style]:-translate-y-3',
          'data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:border-t',
          'data-[side=bottom]:data-[starting-style]:translate-y-3 data-[side=bottom]:data-[ending-style]:translate-y-3',
          'data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-4/5 data-[side=left]:max-w-md data-[side=left]:border-r',
          'data-[side=left]:data-[starting-style]:-translate-x-3 data-[side=left]:data-[ending-style]:-translate-x-3',
          'data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-4/5 data-[side=right]:max-w-md data-[side=right]:border-l',
          'data-[side=right]:data-[starting-style]:translate-x-3 data-[side=right]:data-[ending-style]:translate-x-3',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            className="absolute right-md top-md inline-flex size-10 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-panel-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }) {
  return <div data-slot="sheet-header" className={cn('flex flex-col gap-sm', className)} {...props} />
}

function SheetFooter({ className, ...props }) {
  return <div data-slot="sheet-footer" className={cn('mt-auto flex flex-col gap-sm', className)} {...props} />
}

function SheetTitle({ className, ...props }) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-title-sm font-semibold text-ink', className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-body-sm text-ink-muted', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
