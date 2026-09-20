import { ANNUAL_VOLUMES, COUNTRIES, FIRST_ORDERS, HOME_COUNTRY, INCOTERMS, TIMELINES } from '../../../data/options.js'
import { Segmented, SelectField, TextField, Toggle } from '../../ui/controls.jsx'

export default function VolumeStep({ state, dispatch, errors, showErrors }) {
  const c = state.commercial
  const set = (patch) => dispatch({ type: 'setCommercial', patch })
  const exportOrder = c.country && c.country !== HOME_COUNTRY

  return (
    <div className="space-y-6">
      <section className="space-y-6 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-5">
        <Segmented
          label="Estimated annual volume"
          required
          options={ANNUAL_VOLUMES}
          value={c.annualVolume}
          onChange={(annualVolume) => set({ annualVolume })}
          columns={3}
          error={showErrors ? errors.annualVolume : undefined}
        />
        <div className="grid gap-6 md:grid-cols-2">
          <Segmented
            label="First order"
            options={FIRST_ORDERS}
            value={c.firstOrder}
            onChange={(firstOrder) => set({ firstOrder })}
            columns={2}
          />
          <Segmented
            label="Timeline"
            required
            options={TIMELINES}
            value={c.timeline}
            onChange={(timeline) => set({ timeline })}
            columns={2}
            error={showErrors ? errors.timeline : undefined}
          />
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-ink-900/50 p-4">
          <Toggle
            label="Send a lab sample first"
            description="Lab samples ship within 7 business days, so you can validate on your own line before ordering."
            checked={c.sampleRequested}
            onChange={(sampleRequested) => set({ sampleRequested })}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-5">
        <p className="font-medium text-white">Delivery</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectField
            label="Country"
            required
            options={COUNTRIES}
            value={c.country}
            onChange={(country) => set({ country })}
            error={showErrors ? errors.country : undefined}
          />
          <TextField
            label="City / industrial area"
            placeholder="e.g. Riyadh 2nd Industrial City"
            value={c.city}
            onChange={(event) => set({ city: event.target.value })}
            maxLength={80}
          />
          {exportOrder ? (
            <SelectField
              label="Incoterm"
              options={INCOTERMS}
              placeholder="Select incoterm"
              value={c.incoterm}
              onChange={(incoterm) => set({ incoterm })}
              hint="Lets us quote freight and paperwork for export orders."
            />
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-5">
        <p className="font-medium text-white">
          Commercial context <span className="text-xs font-normal text-ink-400">· optional, speeds up pricing</span>
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField
            label="Target price"
            placeholder="e.g. SAR 9.50 / kg delivered"
            value={c.targetPrice}
            onChange={(event) => set({ targetPrice: event.target.value })}
            maxLength={60}
          />
          <TextField
            label="Grade you use today"
            placeholder="Supplier / grade to benchmark against"
            value={c.benchmark}
            onChange={(event) => set({ benchmark: event.target.value })}
            maxLength={80}
            hint="Gives the lab a benchmark. Shared only with the technical team."
          />
        </div>
      </section>
    </div>
  )
}
