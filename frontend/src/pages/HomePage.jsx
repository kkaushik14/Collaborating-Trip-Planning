import { SectionCard } from '../components/index.js'
import { useAppReady } from '../hooks/index.js'

const HomePage = () => {
  const isReady = useAppReady()

  return (
    <div className="grid gap-xl md:grid-cols-2">
      <SectionCard
        title="Frontend (Vite + React)"
        description="JavaScript (JSX) app scaffolded with TailwindCSS ready."
      >
        <ul className="list-disc space-y-xs pl-xl text-body-sm text-ink-muted">
          <li>Modular folder structure under `src`</li>
          <li>TailwindCSS configured and connected</li>
          <li>Ready for feature modules and API wiring</li>
        </ul>
      </SectionCard>

      <SectionCard
        title="Backend Integration"
        description="Backend bootstrapped separately for MongoDB-powered APIs."
      >
        <p className="text-body-sm text-ink-muted">
          App status:{' '}
          <span className={`font-medium ${isReady ? 'text-success' : 'text-warning'}`}>
            {isReady ? 'Ready' : 'Booting'}
          </span>
        </p>
      </SectionCard>
    </div>
  )
}

export default HomePage
