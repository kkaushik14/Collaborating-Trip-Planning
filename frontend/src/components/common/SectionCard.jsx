const SectionCard = ({ title, description, children }) => {
  return (
    <section className="min-w-0 rounded-2xl border border-line bg-panel p-lg shadow-card [overflow-wrap:anywhere] sm:p-xl">
      <h2 className="text-title-sm font-semibold text-ink">{title}</h2>
      {description ? <p className="mt-xs text-body-sm text-ink-muted">{description}</p> : null}
      <div className="mt-lg min-w-0">{children}</div>
    </section>
  )
}

export default SectionCard
