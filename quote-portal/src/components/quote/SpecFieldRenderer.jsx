import { ChipGroup, ColorField, Segmented, SelectField, Slider, TextField, Toggle } from '../ui/controls.jsx'

/** Renders one catalog `specFields` entry. The catalog schema is the form definition. */
export default function SpecFieldRenderer({ field, value, onChange, error }) {
  switch (field.type) {
    case 'chips':
      return (
        <ChipGroup
          label={field.label}
          options={field.options}
          multiple={field.multiple}
          value={value ?? (field.multiple ? [] : '')}
          onChange={onChange}
          error={error}
          required={field.required}
          hint={field.help}
        />
      )
    case 'segmented':
      return (
        <Segmented
          label={field.label}
          options={field.options}
          value={value ?? ''}
          onChange={onChange}
          error={error}
          required={field.required}
          columns={field.options.length > 3 ? 3 : field.options.length}
        />
      )
    case 'select':
      return (
        <SelectField
          label={field.label}
          options={field.options}
          value={value}
          onChange={onChange}
          placeholder="Select…"
          error={error}
          required={field.required}
        />
      )
    case 'slider':
      return (
        <Slider
          label={field.label}
          min={field.min}
          max={field.max}
          step={field.step}
          unit={field.unit}
          value={value ?? field.default ?? field.min}
          onChange={onChange}
          hint={field.help}
        />
      )
    case 'toggle':
      return <Toggle label={field.label} description={field.help} checked={Boolean(value)} onChange={onChange} />
    case 'color':
      return <ColorField label={field.label} value={value} onChange={onChange} hint={field.help} />
    case 'text':
    default:
      return (
        <TextField
          label={field.label}
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
          error={error}
          required={field.required}
          hint={field.help}
        />
      )
  }
}
