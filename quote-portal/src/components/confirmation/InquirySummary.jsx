function Rows({ rows }) {
  return (
    <dl className="space-y-1.5">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[minmax(0,9rem)_1fr] gap-3 text-[0.8125rem]">
          <dt className="text-ink-400">{row.label}</dt>
          <dd className="break-words text-ink-100">
            {row.type === 'color' ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-3.5 rounded-full border border-white/20" style={{ background: row.value }} />
                <span className="font-mono uppercase">{row.value}</span>
              </span>
            ) : (
              row.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function Block({ title, children }) {
  return (
    <div>
      <p className="eyebrow mb-2">{title}</p>
      {children}
    </div>
  )
}

/** Shared renderer for the live brief, the mobile review and the confirmation page. */
export default function InquirySummary({ summary, compact = false, hideContact = false }) {
  const gap = compact ? 'space-y-4' : 'space-y-6'
  return (
    <div className={gap}>
      {summary.products.length ? (
        <Block title={summary.products.length > 1 ? 'Products' : 'Product'}>
          <div className={compact ? 'space-y-3' : 'space-y-4'}>
            {summary.products.map((product) => (
              <div key={product.id} className={compact ? '' : 'rounded-xl border border-white/[0.07] bg-ink-900/40 p-4'}>
                <p className="text-sm font-medium text-white">{product.name}</p>
                <p className="mb-2 text-xs text-ink-500">{product.family}</p>
                {product.specs.length ? <Rows rows={product.specs} /> : <p className="text-xs text-ink-500">Specification pending</p>}
              </div>
            ))}
          </div>
        </Block>
      ) : null}
      {summary.application.length ? (
        <Block title="Application">
          <Rows rows={summary.application} />
        </Block>
      ) : null}
      {summary.commercial.length ? (
        <Block title="Commercial">
          <Rows rows={summary.commercial} />
        </Block>
      ) : null}
      {!hideContact && summary.contact.length ? (
        <Block title="Contact">
          <Rows rows={summary.contact} />
        </Block>
      ) : null}
      {summary.notes ? (
        <Block title="Notes">
          <p className="text-[0.8125rem] leading-relaxed whitespace-pre-line text-ink-200">{summary.notes}</p>
        </Block>
      ) : null}
    </div>
  )
}
