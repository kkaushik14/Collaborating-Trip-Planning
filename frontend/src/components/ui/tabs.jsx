import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

function Tabs({ className, orientation = 'horizontal', ...props }) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      orientation={orientation}
      className={cn('flex min-w-0 gap-sm data-[orientation=horizontal]:flex-col data-[orientation=vertical]:flex-row', className)}
      {...props}
    />
  )
}

const tabsListVariants = cva('inline-flex w-fit max-w-full overflow-x-auto items-center data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch rounded-md p-xs', {
  variants: {
    variant: {
      default: 'bg-panel-muted text-ink-muted',
      line: 'gap-xs border-b border-line bg-transparent px-0 text-ink-muted',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

function TabsList({ className, variant = 'default', ...props }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        'inline-flex shrink-0 min-w-24 items-center justify-center rounded-sm px-md py-sm text-body-sm font-medium text-ink-muted outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 data-[selected]:bg-panel data-[selected]:text-ink data-[selected]:shadow-sm aria-selected:bg-panel aria-selected:text-ink',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn('min-w-0 flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
