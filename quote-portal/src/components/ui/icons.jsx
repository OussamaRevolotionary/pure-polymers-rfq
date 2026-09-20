import {
  Boxes,
  CloudFog,
  Droplets,
  Flame,
  FlaskConical,
  Gauge,
  Gem,
  Hammer,
  Layers,
  Leaf,
  Microscope,
  Moon,
  MoveHorizontal,
  Palette,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  StretchHorizontal,
  Sun,
  SunDim,
  Wind,
  Zap,
} from 'lucide-react'

/** Catalog stores icon names as strings so the data file stays framework-free. */
export const PRODUCT_ICONS = {
  Boxes,
  CloudFog,
  Droplets,
  Flame,
  FlaskConical,
  Gauge,
  Gem,
  Hammer,
  Layers,
  Leaf,
  Microscope,
  Moon,
  MoveHorizontal,
  Palette,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  StretchHorizontal,
  Sun,
  SunDim,
  Wind,
  Zap,
}

export function ProductIcon({ name, className }) {
  const Icon = PRODUCT_ICONS[name] ?? FlaskConical
  return <Icon className={className} aria-hidden />
}
