import { AlertTriangleIcon, LoaderCircleIcon } from 'lucide-react'

import { Button } from '../components/ui/index.js'
import { Heading, Text } from '../components/typography/index.js'

function PageLoadingState({ title = 'Loading data...', description = 'Please wait while we fetch the latest trip data.' }) {
  return (
    <section className="rounded-xl border border-line bg-panel p-xl shadow-card">
      <div className="flex items-start gap-md">
        <LoaderCircleIcon className="mt-1 size-5 animate-spin text-primary" />
        <div className="space-y-xs">
          <Heading level={2} size="title-sm">
            {title}
          </Heading>
          <Text tone="muted">{description}</Text>
        </div>
      </div>
    </section>
  )
}

function PageErrorState({
  title = 'Unable to load this section',
  description = 'Something went wrong while fetching data.',
  errorMessage,
  onRetry,
}) {
  return (
    <section className="rounded-xl border border-danger/30 bg-danger/10 p-xl shadow-card">
      <div className="flex items-start gap-md">
        <AlertTriangleIcon className="mt-1 size-5 text-danger" />
        <div className="space-y-xs">
          <Heading level={2} size="title-sm">
            {title}
          </Heading>
          <Text tone="muted">{description}</Text>
          {errorMessage ? (
            <Text size="body-sm" tone="danger">
              {errorMessage}
            </Text>
          ) : null}
          {onRetry ? (
            <div className="pt-sm">
              <Button size="sm" variant="outline" onClick={onRetry}>
                Retry
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function PageEmptyState({
  title = 'No data available',
  description = 'This section does not have data yet.',
  action,
}) {
  return (
    <section className="rounded-xl border border-dashed border-line bg-panel-muted p-xl">
      <div className="space-y-xs">
        <Heading level={2} size="title-sm">
          {title}
        </Heading>
        <Text tone="muted">{description}</Text>
        {action ? <div className="pt-sm">{action}</div> : null}
      </div>
    </section>
  )
}

export { PageEmptyState, PageErrorState, PageLoadingState }
