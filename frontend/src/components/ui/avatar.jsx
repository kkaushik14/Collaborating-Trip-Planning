import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar'

import { cn } from '@/lib/utils'

function Avatar({ className, size = 'default', ...props }) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full border border-line bg-panel data-[size=default]:size-10 data-[size=lg]:size-12 data-[size=sm]:size-8',
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('size-full object-cover', className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center rounded-full bg-panel-muted text-body-sm text-ink-muted data-[size=sm]:text-caption',
        className,
      )}
      {...props}
    />
  )
}

function AvatarBadge({ className, ...props }) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        'absolute right-0 bottom-0 inline-flex size-3 items-center justify-center rounded-full bg-success text-ink-inverse ring-2 ring-background',
        className,
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }) {
  return (
    <div
      data-slot="avatar-group"
      className={cn('flex -space-x-2 [&_[data-slot=avatar]]:ring-2 [&_[data-slot=avatar]]:ring-background', className)}
      {...props}
    />
  )
}

function AvatarGroupCount({ className, ...props }) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full bg-panel-muted text-body-sm text-ink-muted ring-2 ring-background',
        className,
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}
