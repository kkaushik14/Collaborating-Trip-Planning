const SectionCard = ({ title, description, children }) => {
  return (
    <section className="rounded-2xl border border-line bg-panel p-xl shadow-card">
      <h2 className="text-title-sm font-semibold text-ink">{title}</h2>
      <p className="mt-xs text-body-sm text-ink-muted">{description}</p>
      <div className="mt-lg">{children}</div>
    </section>
  )
}

export default SectionCard
