import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { cn } from '@/lib/utils'

import { ActivityCard } from './ActivityCard.jsx'

function getDefaultActivityId(activity) {
  return activity?.id ?? activity?._id ?? ''
}

function SortableActivityRow({
  activity,
  index,
  itemId,
  renderActivity,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dragHandleProps = {
    ...attributes,
    ...listeners,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {renderActivity ? (
        renderActivity({
          activity,
          index,
          itemId,
          isDragging,
          dragHandleProps,
        })
      ) : (
        <ActivityCard
          activity={activity}
          index={index}
          isDragging={isDragging}
          dragHandleProps={dragHandleProps}
        />
      )}
    </div>
  )
}

function SortableActivityList({
  activities = [],
  onReorder,
  getActivityId = getDefaultActivityId,
  renderActivity,
  className,
  emptyLabel = 'No activities yet.',
  disabled = false,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const ids = activities.map((activity) => String(getActivityId(activity)))
  const hasInvalidIds = ids.some((id) => id.length === 0)

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const reordered = arrayMove(activities, oldIndex, newIndex)
    onReorder?.(reordered, {
      oldIndex,
      newIndex,
      activeId: String(active.id),
      overId: String(over.id),
    })
  }

  if (activities.length === 0) {
    return (
      <div className={cn('rounded-lg border border-dashed border-line bg-panel-muted p-xl text-center text-body-sm text-ink-muted', className)}>
        {emptyLabel}
      </div>
    )
  }

  if (hasInvalidIds) {
    return (
      <div className={cn('rounded-lg border border-danger/40 bg-danger/10 p-lg text-body-sm text-danger', className)}>
        Each activity requires a stable `id` or `_id` for drag and reorder.
      </div>
    )
  }

  if (disabled) {
    return (
      <div className={cn('space-y-sm', className)}>
        {activities.map((activity, index) => (
          <ActivityCard
            key={ids[index]}
            activity={activity}
            index={index}
            dragDisabled
          />
        ))}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={cn('space-y-sm', className)}>
          {activities.map((activity, index) => (
            <SortableActivityRow
              key={ids[index]}
              activity={activity}
              index={index}
              itemId={ids[index]}
              renderActivity={renderActivity}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export { SortableActivityList }
