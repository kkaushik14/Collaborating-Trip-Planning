import { Popover as PopoverPrimitive } from '@base-ui/react/popover'

import { cn } from '@/lib/utils'

function Popover(props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger(props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = 'center',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 8,
  ...props
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            'w-72 rounded-md border border-line bg-panel p-lg text-body-sm text-ink shadow-card outline-none',
            'origin-[var(--transform-origin)] will-change-[opacity,transform] transition-[opacity,transform] duration-200 ease-out',
            'data-[starting-style]:opacity-0 data-[starting-style]:scale-95',
            'data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

function PopoverHeader({ className, ...props }) {
  return <div data-slot="popover-header" className={cn('mb-sm flex flex-col gap-2xs', className)} {...props} />
}

function PopoverTitle({ className, ...props }) {
  return <PopoverPrimitive.Title data-slot="popover-title" className={cn('text-title-sm font-semibold', className)} {...props} />
}

function PopoverDescription({ className, ...props }) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn('text-body-sm text-ink-muted', className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}
