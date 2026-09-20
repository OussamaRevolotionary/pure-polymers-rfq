/**
 * Pure Polymers product catalog — single source of truth.
 *
 * Consumed by:
 *   - the quote configurator (families, products, dynamic spec fields)
 *   - the confirmation page and payload summary
 *   - the offline assistant engine (keywords, key facts)
 *   - agent/build.mjs  -> assistant system prompt knowledge base + tool enums
 *   - n8n/build.mjs    -> TDS routing + product-family Switch
 *
 * Every technical statement is paraphrased from purepolymers.net (crawled
 * 2026-09-17); `source` records the page. Nothing here may be "improved" with
 * generic industry numbers — if the site does not publish a value, leave it out
 * and let the technical team answer.
 *
 * Plain ES module, no JSX / no Vite globals, so Node build scripts can import it.
 */

export const COMPANY = {
  brand: 'Pure Polymers',
  legalName: 'Pure Polymers for Industries',
  tagline: 'Real Passion for Quality',
  location: 'Modon 3, Jeddah, Saudi Arabia',
  founded: 'January 2017',
  equipment: 'Italian twin-screw extruders',
  lab: 'Fully equipped laboratory for rapid prototyping, in-house testing and a first-rate sampling service',
  scope:
    'Independent manufacturer of white, color and additive masterbatch, custom thermoplastic compounds, liquid and paste colorants, and custom compounding',
  phoneMobile: '+966 54 646 0891',
  phoneOffice: '+966 12 663 1575',
  whatsappE164: '966546460891',
  email: 'info@purepolymers.net',
  website: 'https://purepolymers.net',
  visualizerUrl: 'https://colorsvisualizer.com/',
  visualizerOffer: '5% off when you use the Colors Visualizer',
  visualizerProducts: [
    'disposable bags',
    'pallets',
    'bottle caps',
    'medical containers',
    'pipes',
    'food containers',
    'cups',
    'reusable bags',
    'plates',
    'cutlery',
  ],
  leadership: 'Eng. Alaa Abdullah Bauzeer, CEO (appointed March 2026; 28+ years of industrial leadership)',
  sampleLeadTime: 'Samples and production orders ship within 7 business days (stated for compounds and antiblock)',
}

export const AUTHORITY = [
  {
    id: 'pif-accelerator',
    title: 'Industrial Business Accelerator Program',
    issuer: 'Public Investment Fund (PIF)',
    date: 'October 2025',
    detail:
      'Accepted into the PIF Industrial Business Accelerator after a field visit to the Jeddah headquarters — supporting national industrial growth and Vision 2030 local content.',
    source: 'https://purepolymers.net/post/pure-polymers-joins-industrial-business-accelerator-program-under-pif/',
  },
  {
    id: 'd2w-symphony',
    title: 'd2w® Biodegradable Technology Partner',
    issuer: 'Symphony Environmental Technologies Plc (UK)',
    date: 'December 2025',
    detail:
      'Manufacturing d2w oxo-biodegradable masterbatch and compounds at the Jeddah factory, compliant with Saudi standard SASO 2879.',
    source:
      'https://purepolymers.net/post/pure-polymers-begins-production-of-biodegradable-plastic-using-d2w-technology-in-partnership-with-symphony-environmental-technologies-plc/',
  },
  {
    id: 'twin-screw',
    title: 'Italian Twin-Screw Extrusion',
    issuer: 'Pure Polymers factory, Jeddah',
    date: 'Since 2017',
    detail: 'Cutting-edge Italian twin-screw extruders serving the regional plastics converting industry.',
    source: 'https://purepolymers.net/',
  },
  {
    id: 'lab-sampling',
    title: 'In-house Lab & Sampling',
    issuer: 'Pure Polymers technical team',
    date: '7 business days',
    detail: 'Rapid prototyping, in-house testing and sample service; samples and production orders ship within 7 business days.',
    source: 'https://purepolymers.net/additives-masterbatch/',
  },
]

/** Product families. `code` is the 2-letter suffix of the reference ID (PP-8942-CM). */
export const FAMILIES = [
  {
    id: 'color',
    code: 'CM',
    label: 'Color Masterbatch',
    short: 'Color',
    blurb: 'Custom-matched color concentrates, consistent from batch to batch.',
    team: 'Color Lab',
    pellet: 'color',
  },
  {
    id: 'white',
    code: 'WM',
    label: 'White Masterbatch',
    short: 'White',
    blurb: 'Up to 75% TiO₂ in LLDPE — high opacity at low let-down.',
    team: 'Color Lab',
    pellet: 'white',
  },
  {
    id: 'black',
    code: 'BM',
    label: 'Black Masterbatch',
    short: 'Black',
    blurb: 'Carbon black systems with blue-toned, jet or brown undertones.',
    team: 'Color Lab',
    pellet: 'black',
  },
  {
    id: 'additive',
    code: 'AM',
    label: 'Additive Masterbatch',
    short: 'Additives',
    blurb: '18 functional systems — desiccant, anti-fog, UV, d2w® and more.',
    team: 'Additives Technical Desk',
    pellet: 'additive',
  },
  {
    id: 'compound',
    code: 'PC',
    label: 'Pre-colored Resins & Compounds',
    short: 'Compounds',
    blurb: 'Custom compounds in PE, PP, PS and ABS with color and additive packages.',
    team: 'Compounding Team',
    pellet: 'compound',
  },
]

const YES_NO_RECYCLED = ['0% (virgin)', 'Below 30%', '30–70%', 'Above 70%']

export const PRODUCTS = [
  /* ───────────────────────────── Color / white / black ───────────────────────────── */
  {
    id: 'color-masterbatch',
    family: 'color',
    name: 'Color Masterbatch',
    tagline: 'Color concentrates matched to your Pantone, RAL or physical sample.',
    icon: 'Palette',
    accent: '#3249B3',
    keywords: ['color', 'colour', 'pantone', 'ral', 'shade', 'pigment', 'tint', 'match', 'blue', 'red', 'green', 'yellow'],
    knowledge: [
      'Colors the carrier polymer during conversion. Pure Polymers treats color as the most visible quality signal: a poor shade or batch-to-batch variation is read by end customers as poor quality.',
      'Color is assessed on hue, saturation (chroma / purity versus white) and lightness; matches are built against a reference (Pantone or RAL code, or a physical sample) and held within tolerance across production lots.',
      'Buyers can preview colors on 10 product types in the Colors Visualizer (colorsvisualizer.com) — 5% off when they use it — and order a physical sample book there.',
      'Let-down ratio depends on pigment loading, wall thickness and opacity target; it is confirmed by the color lab and on the TDS.',
    ],
    keyFacts: [
      { label: 'Matching', value: 'Pantone · RAL · physical sample' },
      { label: 'Preview', value: 'Colors Visualizer — 5% off' },
      { label: 'Consistency', value: 'Shade held across lots' },
    ],
    source: 'https://purepolymers.net/?page_id=160',
    tds: 'TDS-CM-GENERAL',
    specFields: [
      {
        id: 'colorRef',
        label: 'Color name or code',
        type: 'text',
        required: true,
        placeholder: 'e.g. Pantone 2935 C, RAL 5015, or “match our sample”',
      },
      { id: 'colorHex', label: 'Approximate shade', type: 'color', help: 'Visual guide only — the lab matches to your reference.' },
      {
        id: 'matchMethod',
        label: 'Matching reference',
        type: 'segmented',
        options: ['Pantone / RAL code', 'Physical sample', 'Colors Visualizer pick', 'Standard color'],
      },
      { id: 'finish', label: 'Finish', type: 'segmented', options: ['Opaque', 'Translucent', 'Transparent tint'] },
      {
        id: 'requirements',
        label: 'Performance requirements',
        type: 'chips',
        multiple: true,
        options: ['Food contact', 'UV / outdoor', 'High heat stability', 'Light fastness', 'Heavy-metal free'],
      },
    ],
  },
  {
    id: 'white-masterbatch',
    family: 'white',
    name: 'White Masterbatch',
    tagline: 'Up to 75% TiO₂ in LLDPE — high opacity at low let-down ratios.',
    icon: 'Sun',
    accent: '#F5F7FA',
    keywords: ['tio2', 'tio₂', 'titanium', 'opacity', 'opaque', 'whiteness', 'pinking', 'yellowing'],
    knowledge: [
      'Advanced-performance white concentrates containing up to 75% TiO₂ (in LLDPE), available in a number of carrier resins.',
      'Engineered for improved resistance to phenolic yellowing / pinking while optimizing whiteness and thermal stability.',
      'Delivers high opacity at low let-down ratios.',
      'Applications: extrusion film, sheet, injection molding and blow molding.',
    ],
    keyFacts: [
      { label: 'TiO₂ loading', value: 'Up to 75% (LLDPE carrier)' },
      { label: 'Stability', value: 'Resists yellowing / pinking' },
      { label: 'Processes', value: 'Film · sheet · injection · blow' },
    ],
    source: 'https://purepolymers.net/?page_id=115',
    tds: 'TDS-WM-75',
    specFields: [
      { id: 'tio2', label: 'Target TiO₂ loading', type: 'slider', min: 40, max: 75, step: 5, default: 70, unit: '%' },
      { id: 'carrier', label: 'Carrier resin', type: 'segmented', options: ['LLDPE', 'LDPE', 'HDPE', 'PP', 'PS / ABS', 'Other'] },
      {
        id: 'priorities',
        label: 'What matters most',
        type: 'chips',
        multiple: true,
        options: ['Opacity at low let-down', 'Whiteness', 'Anti-yellowing / pinking', 'Thermal stability'],
      },
      { id: 'letDown', label: 'Target let-down ratio', type: 'text', placeholder: 'e.g. 2–4%' },
    ],
  },
  {
    id: 'black-masterbatch',
    family: 'black',
    name: 'Black Masterbatch',
    tagline: 'Carbon black concentrates from fine to coarse particle size.',
    icon: 'Moon',
    accent: '#0B0D10',
    keywords: ['carbon black', 'carbon', 'jetness', 'jet black', 'undertone'],
    knowledge: [
      'Carbon black concentrates built on a wide range of pigment systems, from large to small particle sizes.',
      'Tinting range from blue-toned through jet black to brown undertones.',
      'Compatible with ABS, GPPS, HIPS, LDPE, LLDPE, HDPE and PP homo- and co-polymers.',
      'Used in film, compounding, pipe, fiber, injection and blow molding for agricultural, consumer, industrial and packaging markets.',
    ],
    keyFacts: [
      { label: 'Undertones', value: 'Blue-toned · jet · brown' },
      { label: 'Polymers', value: 'ABS · GPPS · HIPS · PE · PP' },
      { label: 'Uses', value: 'Film · pipe · fiber · molding' },
    ],
    source: 'https://purepolymers.net/?page_id=142',
    tds: 'TDS-BM-GENERAL',
    specFields: [
      { id: 'undertone', label: 'Undertone', type: 'segmented', options: ['Blue-toned', 'Jet black', 'Brown-toned'] },
      {
        id: 'particle',
        label: 'Pigment system',
        type: 'segmented',
        options: ['Fine particle (max jetness)', 'Standard', 'Coarse (economical)'],
      },
      { id: 'outdoor', label: 'Outdoor / UV-exposed application', type: 'toggle', default: false },
      {
        id: 'carrier',
        label: 'Target polymer',
        type: 'chips',
        options: ['ABS', 'GPPS', 'HIPS', 'LDPE', 'LLDPE', 'HDPE', 'PP homo', 'PP copo'],
      },
    ],
  },

  /* ───────────────────────────────────── Additives ───────────────────────────────────── */
  {
    id: 'desiccant',
    family: 'additive',
    name: 'Desiccant Masterbatch',
    grade: 'DES01',
    tagline: 'Chemically binds moisture — run damp or recycled resin without a dryer.',
    icon: 'Droplets',
    accent: '#E8EDF2',
    keywords: [
      'desiccant', 'moisture', 'humidity', 'humid', 'damp', 'fisheye', 'fish eye', 'fish-eye', 'fish eyes', 'fisheyes', 'lensing',
      'bubbles', 'bubble', 'voids', 'holes', 'silver streak', 'streaks', 'dryer', 'drying', 'hygroscopic', 'regrind', 'recycled',
      'رطوبة', 'مجففة',
    ],
    knowledge: [
      'Moisture-absorbent functional masterbatch in pellet form (off-white granules) with a high concentration of active agent and excellent dispersion. PE grade DES01 targets HDPE / LLDPE / LDPE and starch-based biomaterials.',
      'Moisture enters through hygroscopic polymers, fillers, pigments, reprocessed / recycled polymer or humid storage. The active ingredient reacts chemically with water during processing and removes it from the melt; it can bind up to 20% of its own weight in water, less in practice.',
      'Prevents fish-eyes, windows / lensing in film, holes, grooves, bubbles, silver streaks in molding, film-bubble breakage, porosity and loss of tensile strength; allows higher filler and recycled content and maintains mechanical properties.',
      'Replaces the drying step: no dryer investment, zero drying energy, no plant space, no production stop; also reduces metal corrosion in the extruder. Mix directly with the damp material.',
      'Processes: blown film extrusion, injection molding, blow molding; virgin and recycled LDPE, LLDPE, HDPE and PP.',
      'Applications: bag handles, agricultural film, paper-like plastic, bin bags, recycled polymer processing, barrels and drums, woven sacks, twin-wall sheet, thermoformed sheet, corrugated pipe.',
      'Recommended dosage: average 1–3%.',
      'Handling: highly hygroscopic — use within 16–24 hours of opening and reseal immediately; store dry and ventilated, away from sun and rain; shelf life 6–12 months when well packed; pre-drying of the masterbatch may be required; avoid overheating; do not use pellets that have turned completely white through to the core. Packed in 5 kg bags.',
    ],
    keyFacts: [
      { label: 'Dosage', value: '1–3% average' },
      { label: 'Capacity', value: 'Binds up to 20% of own weight' },
      { label: 'Handling', value: '5 kg bags · use ≤ 24 h after opening' },
    ],
    source: 'https://purepolymers.net/post/desiccant-masterbatch/',
    tds: 'TDS-DES01',
    specFields: [
      {
        id: 'moistureSource',
        label: 'Where does the moisture come from?',
        type: 'chips',
        multiple: true,
        options: ['Recycled / regrind', 'Fillers (CaCO₃, talc)', 'Hygroscopic resin', 'Humid storage'],
      },
      {
        id: 'defects',
        label: 'Defects you see today',
        type: 'chips',
        multiple: true,
        options: ['Fish-eyes / lensing', 'Bubbles / holes', 'Silver streaks', 'Film bubble breakage', 'Low tensile strength'],
      },
      { id: 'drying', label: 'Current drying', type: 'segmented', options: ['Using a dryer', 'No drying today'] },
      { id: 'recycledPct', label: 'Recycled content', type: 'select', options: YES_NO_RECYCLED },
    ],
  },
  {
    id: 'antifog',
    family: 'additive',
    name: 'Anti-Fog Masterbatch',
    tagline: 'Keeps food packaging and greenhouse film transparent — no condensation droplets.',
    icon: 'CloudFog',
    accent: '#CFE3F0',
    keywords: ['fog', 'antifog', 'anti-fog', 'anti fog', 'condensation', 'droplets', 'greenhouse', 'misting'],
    knowledge: [
      'LLDPE / LDPE-based. The active additive migrates quickly to the film surface and lowers the contact angle of condensed water, so moisture wets out into a transparent layer instead of light-scattering droplets.',
      'Works under both hot-fog and cold-fog conditions; also compatible with PP, PVC, PVDC and EVA films.',
      'Food packaging (film and thermoforming): contents stay visible and attractive, with longer freshness. Greenhouse / agricultural film: better light transmission, less plant burning and crop spoilage.',
      'No adverse effect on mechanical properties; supports processing speed.',
      'Dosage: mono-layer film 3–8%; multi-layer film 2–6%, added in the skin / contact layer.',
    ],
    keyFacts: [
      { label: 'Dosage', value: 'Mono 3–8% · multi 2–6% (skin)' },
      { label: 'Carrier', value: 'LLDPE / LDPE' },
      { label: 'Uses', value: 'Food packaging · greenhouse film' },
    ],
    source: 'https://purepolymers.net/?page_id=439',
    tds: 'TDS-AF',
    specFields: [
      { id: 'structure', label: 'Film structure', type: 'segmented', options: ['Mono-layer', 'Multi-layer (skin layer)'] },
      { id: 'fogType', label: 'Fog condition', type: 'chips', multiple: true, options: ['Hot fog', 'Cold fog'] },
      { id: 'use', label: 'Application', type: 'segmented', options: ['Food packaging', 'Greenhouse / agri film'] },
      { id: 'thickness', label: 'Film thickness', type: 'text', placeholder: 'e.g. 35 µm' },
    ],
  },
  {
    id: 'uv-stabilizer',
    family: 'additive',
    name: 'UV Stabilizer Masterbatch',
    tagline: 'UV absorber and HALS packages tailored to sunlight intensity and service life.',
    icon: 'SunDim',
    accent: '#F2C26B',
    keywords: ['uv', 'sunlight', 'sun', 'outdoor', 'weathering', 'hals', 'light stabilizer', 'photodegradation', 'embrittlement', 'cracking'],
    knowledge: [
      'UV absorbers (e.g. benzophenones, benzotriazoles) absorb UV radiation and re-emit the energy as heat; they are effective mainly in thicker sections and need relatively high concentrations.',
      'HALS (hindered amine light stabilizers) are the most effective stabilizers: they interrupt the photodegradation process before it becomes destructive.',
      'Package selection depends on geographic location and sunlight intensity, required service life, product dimensions, pigment type and color, and contact with food or agro-chemicals such as pesticides.',
      'Applied in fiber, film and molding; tailored UV resistance solutions.',
    ],
    keyFacts: [
      { label: 'Chemistry', value: 'UV absorbers · HALS' },
      { label: 'Tailored by', value: 'Sunlight · service life · thickness' },
      { label: 'Uses', value: 'Fiber · film · molding' },
    ],
    source: 'https://purepolymers.net/?page_id=339',
    tds: 'TDS-UV',
    specFields: [
      { id: 'serviceLife', label: 'Required outdoor service life', type: 'segmented', options: ['6 months', '1 year', '2 years', '3+ years'] },
      { id: 'section', label: 'Section thickness', type: 'segmented', options: ['Thin film (< 100 µm)', 'Thick film / sheet', 'Molded part'] },
      {
        id: 'exposure',
        label: 'Exposure',
        type: 'chips',
        multiple: true,
        options: ['Agro-chemicals / pesticides', 'Food contact', 'Dark pigmented part'],
      },
      { id: 'region', label: 'Installation region / climate', type: 'text', placeholder: 'e.g. Riyadh region, open field' },
    ],
  },
  {
    id: 'antioxidant',
    family: 'additive',
    name: 'Antioxidant Masterbatch',
    tagline: 'Phenolic + phosphite stabilizer packages for processing and long-term stability.',
    icon: 'ShieldCheck',
    accent: '#E09A2D',
    keywords: ['antioxidant', 'anti-oxidant', 'oxidation', 'degradation', 'stabilizer', 'stabilization', 'gels', 'gel', 'mfi', 'melt flow', 'yellowing', 'thermal', 'aging', 'ageing', 'die lip'],
    knowledge: [
      'Polymers degrade under radiation, heat and oxidation through an autoxidative free-radical chain reaction (initiation, propagation forming hydroperoxides, termination), shortening service life and changing properties.',
      'Primary antioxidants (chain-breaking radical scavengers — hindered phenols; aromatic amines work but can discolor) react with free radicals during propagation.',
      'Secondary antioxidants (preventative peroxide decomposers — phosphites, phosphonites, thioesters / thioethers, thiophosphates) convert hydroperoxides into stable products; primary and secondary types are combined for maximum protection.',
      'Processing stabilization: gel reduction and die-lip build-up control in polyethylene film extrusion; MFI control in polypropylene fiber production. Long-term: thermal and color stability, extended useful life, fewer defects, easier recycling, better processability of recycled material.',
      'Supplied standalone or in multifunctional systems with UV stabilizers and processing aids. Applications: tapes, fibers, geotextiles, films, injection moldings.',
    ],
    keyFacts: [
      { label: 'Chemistry', value: 'Phenolic + phosphite' },
      { label: 'Targets', value: 'Gels · die-lip build-up · MFI drift' },
      { label: 'Combines with', value: 'UV stabilizer · process aid' },
    ],
    source: 'https://purepolymers.net/post/use-of-anti-oxidant-masterbatch/',
    tds: 'TDS-AO',
    specFields: [
      {
        id: 'goal',
        label: 'Stabilization goal',
        type: 'chips',
        multiple: true,
        options: ['Processing stability (gels, die-lip)', 'MFI control (PP fiber / raffia)', 'Long-term thermal ageing', 'Recycled-content stabilization', 'Color stability'],
      },
      { id: 'combo', label: 'Combine with', type: 'chips', multiple: true, options: ['UV stabilizer', 'Process aid'] },
      { id: 'recycledPct', label: 'Recycled content', type: 'select', options: YES_NO_RECYCLED },
    ],
  },
  {
    id: 'slip',
    family: 'additive',
    name: 'Anti-Slip Masterbatch',
    tagline: 'Slip additive (erucamide / oleamide) that lowers film friction for fast converting.',
    icon: 'MoveHorizontal',
    accent: '#D9E4EC',
    keywords: ['slip', 'anti-slip', 'antislip', 'cof', 'friction', 'coefficient of friction', 'erucamide', 'oleamide', 'sticking to rollers'],
    knowledge: [
      'Listed on the site as "Anti-Slip Masterbatch"; the product content describes a SLIP additive that lowers the coefficient of friction (COF). Always confirm whether the buyer wants lower friction (slip) or higher friction (true anti-slip, e.g. stacked heavy-duty sacks).',
      'Polyolefin films tend to adhere to themselves and to metal surfaces because of their high COF. Slip additives are incompatible with the polymer and migrate (bloom) to the surface as the film cools, forming a lubricating layer.',
      'Oleamide (C18) blooms fast for rapid COF reduction; erucamide (C22) migrates more slowly but reaches a lower COF and better long-term performance, and its lower volatility suits high processing temperatures (less smoke / venting).',
      'Typical target COF for easy processing is about 0.2. COF is very sensitive to concentration until a critical level, after which extra slip adds little.',
      'Available in high and low concentrations, instant or slow-acting, high-transparency and food-contact grades, and in combinations with antistatic and antiblock. Used in film packaging and stackable items, extrusion, sheet and injection molding.',
    ],
    keyFacts: [
      { label: 'Actives', value: 'Erucamide · oleamide' },
      { label: 'Target COF', value: '≈ 0.2 for easy processing' },
      { label: 'Combines with', value: 'Antiblock · antistatic' },
    ],
    source: 'https://purepolymers.net/?page_id=401',
    tds: 'TDS-SLIP',
    specFields: [
      { id: 'goal', label: 'Friction goal', type: 'segmented', required: true, options: ['Lower friction (slip)', 'Raise friction (anti-slip)'] },
      { id: 'bloom', label: 'Bloom profile', type: 'segmented', options: ['Fast (oleamide)', 'Long-term / high temp (erucamide)', 'Not sure'] },
      { id: 'cof', label: 'Target COF', type: 'select', options: ['≈ 0.2 (standard)', 'Below 0.15 (high slip)', 'Custom target'] },
      { id: 'combo', label: 'Combine with', type: 'chips', multiple: true, options: ['Antiblock', 'Antistatic'] },
    ],
  },
  {
    id: 'antiblock',
    family: 'additive',
    name: 'Antiblock Masterbatch',
    tagline: 'Stops film layers sticking — from high-clarity synthetic silica to economical minerals.',
    icon: 'Layers',
    accent: '#EEF1F4',
    keywords: ['antiblock', 'anti-block', 'blocking', 'layers stick', 'sticking', 'silica', 'talc', 'easy open', 'bag opening'],
    knowledge: [
      'Creates a micro-rough surface that reduces adhesion between film layers; performance depends on the number of particles at the film surface and their size.',
      'Synthetic silica (amorphous, highly microporous; refractive index close to PE and PP) gives high-transparency, high-clarity films. Natural silica (diatomaceous) varies in clarity with quartz content. Limestone (CaCO₃) suits lower-cost uses where clarity matters less. Talc has low hardness and a refractive index similar to polyolefins. Organic antiblocks are also available.',
      'Carriers: polyethylene, polypropylene, ionomers, polyamides and thermoplastic polyurethanes. Combination masterbatches with slip and antistatic are available.',
      'For bags, film and easy-open packages across film, sheet and extrusion. Samples and production orders ship within 7 business days.',
    ],
    keyFacts: [
      { label: 'Actives', value: 'Synthetic silica · talc · CaCO₃' },
      { label: 'Combines with', value: 'Slip · antistatic' },
      { label: 'Lead time', value: 'Samples in 7 business days' },
    ],
    source: 'https://purepolymers.net/?page_id=364',
    tds: 'TDS-AB',
    specFields: [
      {
        id: 'clarity',
        label: 'Clarity requirement',
        type: 'segmented',
        options: ['High clarity (synthetic silica)', 'Balanced (talc / natural silica)', 'Economic (CaCO₃)'],
      },
      { id: 'combo', label: 'Combine with', type: 'chips', multiple: true, options: ['Slip', 'Antistatic'] },
      { id: 'thickness', label: 'Film thickness', type: 'text', placeholder: 'e.g. 25 µm' },
    ],
  },
  {
    id: 'process-aid',
    family: 'additive',
    name: 'Process Aid Masterbatch (PPA)',
    tagline: 'Fluoropolymer PPA — removes melt fracture and die build-up, up to 15% more output.',
    icon: 'Gauge',
    accent: '#BFD0DD',
    keywords: ['ppa', 'process aid', 'processing aid', 'melt fracture', 'sharkskin', 'shark skin', 'die build', 'die drool', 'die lines', 'throughput', 'output', 'back pressure', 'fluoropolymer', 'changeover'],
    knowledge: [
      'Fluoropolymer-based concentrate that enhances extrusion of thermoplastic resins. The fluoropolymer forms a dispersed phase, migrates to the metal surfaces under shear and builds a dynamic low-friction coating on screw, barrel and die, lowering back-pressure and motor load.',
      'Solves melt fracture / sharkskin, die lines, die build-up (die drool), gels and flow marks.',
      'Benefits: up to 15% output increase, lower extrusion temperatures and energy use, longer runs between die cleaning, faster color changeovers, better gloss and clarity.',
      'Dosage: start around 1% to condition the equipment, then reduce to 0.25–0.5% for maintenance; effective at very low active levels.',
      'Compatible with LLDPE, LDPE, HDPE, PP, polystyrene, polyamides, acrylics and metallocene grades. Applications: blown and cast film, fiber, profile, pipe and tubing, cable, injection molding.',
    ],
    keyFacts: [
      { label: 'Dosage', value: '≈ 1% start → 0.25–0.5%' },
      { label: 'Output', value: 'Up to +15%' },
      { label: 'Resins', value: 'LLDPE · mLLDPE · HDPE · PP' },
    ],
    source: 'https://purepolymers.net/?page_id=378',
    tds: 'TDS-PPA',
    specFields: [
      {
        id: 'issues',
        label: 'Problems to solve',
        type: 'chips',
        multiple: true,
        options: ['Melt fracture / sharkskin', 'Die build-up / drool', 'Gels', 'Slow color changeovers', 'Throughput limit'],
      },
      { id: 'resin', label: 'Base resin', type: 'segmented', options: ['LLDPE', 'mLLDPE', 'LDPE', 'HDPE', 'PP', 'Other'] },
      { id: 'currentPpa', label: 'Already running a PPA today', type: 'toggle', default: false },
    ],
  },
  {
    id: 'antistatic',
    family: 'additive',
    name: 'Antistatic Masterbatch',
    tagline: 'Dissipates static and controls dust on film, sheet, fiber and moldings.',
    icon: 'Zap',
    accent: '#D0D8E8',
    keywords: ['antistatic', 'anti-static', 'static', 'dust', 'electrostatic', 'shock', 'resistivity'],
    knowledge: [
      'Internal antistatic agents migrate to the polymer surface and attract atmospheric moisture, forming a conductive layer. The molecule has a hydrophobic part (compatibility with the polymer) and a hydrophilic part (attracts water).',
      'Surface resistivity drops from about 10¹⁴–10¹⁵ ohms for untreated polymers to about 10⁸–10¹¹ ohms when treated.',
      'Migration speed and duration depend on additive–polymer compatibility, polymer crystallinity, the total additive package, antistatic concentration and processing temperature.',
      'Fast-acting grades give dust control in food packaging; long-lasting grades suit demanding uses such as flooring. Combinations with antiblock and slip; cost-effective for PE and PP film. Applications: sheet, film, fibers, injection molding.',
    ],
    keyFacts: [
      { label: 'Resistivity', value: '10⁸–10¹¹ Ω when treated' },
      { label: 'Modes', value: 'Fast dust control · long-lasting' },
      { label: 'Combines with', value: 'Slip · antiblock' },
    ],
    source: 'https://purepolymers.net/?page_id=432',
    tds: 'TDS-AS',
    specFields: [
      { id: 'effect', label: 'Effect profile', type: 'segmented', options: ['Fast-acting dust control', 'Long-lasting'] },
      { id: 'target', label: 'Target surface resistivity', type: 'select', options: ['10⁸–10⁹ Ω', '10¹⁰–10¹¹ Ω', 'Not sure'] },
      { id: 'combo', label: 'Combine with', type: 'chips', multiple: true, options: ['Slip', 'Antiblock'] },
    ],
  },
  {
    id: 'clarifier',
    family: 'additive',
    name: 'Clarifier Masterbatch',
    tagline: '3rd-generation sorbitol clarifier for crystal-clear, faster-cycling PP.',
    icon: 'Gem',
    accent: '#E6F0F7',
    keywords: ['clarifier', 'clarity', 'haze', 'hazy', 'transparent', 'transparency', 'nucleating', 'nucleator', 'sorbitol', 'clear pp'],
    knowledge: [
      'Based on a third-generation sorbitol derivative for PP homopolymer and PP random copolymer.',
      '10% active content, used at 1.5–3% depending on part thickness and processing method.',
      'Nucleates the melt so the spherulites stay small enough for light to pass without scattering: lower haze and higher clarity.',
      'Also improves cycle time, heat deflection temperature, flexural modulus / stiffness and impact strength.',
      'Applications: PP packaging film, food and storage containers, blow-molded bottles, injection-molded parts. Stated as compliant with food safety regulation.',
    ],
    keyFacts: [
      { label: 'Active', value: '10% sorbitol (3rd gen)' },
      { label: 'Dosage', value: '1.5–3%' },
      { label: 'Polymers', value: 'PP homo · PP random' },
    ],
    source: 'https://purepolymers.net/?page_id=451',
    tds: 'TDS-CL',
    specFields: [
      { id: 'ppType', label: 'PP grade', type: 'segmented', options: ['PP homopolymer', 'PP random copolymer'] },
      { id: 'process', label: 'Process', type: 'segmented', options: ['Injection molding', 'Blow molding', 'Film / thermoforming'] },
      { id: 'thickness', label: 'Wall thickness', type: 'text', placeholder: 'e.g. 0.6 mm' },
      { id: 'foodContact', label: 'Food-contact application', type: 'toggle', default: true },
    ],
  },
  {
    id: 'cling',
    family: 'additive',
    name: 'Cling Masterbatch',
    tagline: 'PIB tackifier concentrate for pallet, silage and food stretch wrap.',
    icon: 'StretchHorizontal',
    accent: '#F0F3F6',
    keywords: ['cling', 'stretch', 'stretch film', 'pallet wrap', 'silage', 'food wrap', 'pib', 'polyisobutylene', 'tackifier', 'tack'],
    knowledge: [
      'Concentrate of high-molecular-weight polyisobutylene (PIB) tackifier in linear low-density polyethylene.',
      'For blown and cast stretch films — pallet wrap, silage wrap and food wrap — in mono- and multi-layer structures.',
      'Dosage: monolayer blown film about 8% by weight in LLDPE; monolayer cast film 3–4%; multi-layer films — skin layers only, with the rate depending on layer ratio and thickness.',
      'Cling develops as the PIB migrates, typically over 24–72 hours; delivers peel cling, lap cling and re-tack.',
      'The base polymer must not contain slip or antiblock additives and should have a density below 0.923 g/cm³ so the additive can migrate.',
    ],
    keyFacts: [
      { label: 'Dosage', value: 'Blown ≈ 8% · cast 3–4%' },
      { label: 'Cling develops', value: '24–72 h' },
      { label: 'Base resin', value: 'LLDPE < 0.923, no slip / AB' },
    ],
    source: 'https://purepolymers.net/?page_id=534',
    tds: 'TDS-CLING',
    specFields: [
      { id: 'film', label: 'Film process', type: 'segmented', options: ['Blown', 'Cast'] },
      { id: 'layers', label: 'Structure', type: 'segmented', options: ['Mono-layer', 'Multi-layer (skin layers)'] },
      { id: 'use', label: 'Application', type: 'chips', multiple: true, options: ['Pallet wrap', 'Silage wrap', 'Food wrap'] },
      { id: 'clingType', label: 'Cling property', type: 'chips', multiple: true, options: ['Peel cling', 'Lap cling', 'Re-tack'] },
    ],
  },
  {
    id: 'oxo-biodegradable',
    family: 'additive',
    name: 'Oxo-Biodegradable Masterbatch (d2w®)',
    tagline: 'd2w® produced in Jeddah with Symphony Environmental — SASO 2879 compliant.',
    icon: 'Leaf',
    accent: '#BECC30',
    keywords: ['d2w', 'oxo', 'oxo-biodegradable', 'biodegradable', 'degradable', 'saso', 'saso 2879', 'symphony', 'compostable', 'environment', 'eco'],
    knowledge: [
      'd2w is a masterbatch additive that makes plastic degrade when exposed to heat, air and sunlight, and then biodegrade through microorganisms in the environment. Per the product page, it remains recyclable if collected before degradation and does not leave microplastics.',
      'Pure Polymers manufactures d2w (described as the world\'s leading oxo-biodegradable masterbatch), approved for use in Saudi Arabia, where oxo-biodegradable technology has been mandatory for many plastic product categories since 2016.',
      'Since December 2025, d2w masterbatch and compounds are produced at the Jeddah factory in partnership with Symphony Environmental Technologies Plc (UK), compliant with Saudi standard SASO 2879.',
    ],
    keyFacts: [
      { label: 'Technology', value: 'd2w® · Symphony Environmental' },
      { label: 'Standard', value: 'SASO 2879' },
      { label: 'Market', value: 'KSA requirement since 2016' },
    ],
    source: 'https://purepolymers.net/additives-masterbatch/oxo-biodegradablemasterbatch',
    tds: 'TDS-D2W',
    specFields: [
      {
        id: 'product',
        label: 'End products',
        type: 'chips',
        multiple: true,
        options: ['Carrier / shopping bags', 'Garbage bags', 'Food packaging film', 'Agricultural film', 'Other'],
      },
      { id: 'saso', label: 'SASO 2879 compliance documents required', type: 'toggle', default: true },
      {
        id: 'serviceLife',
        label: 'Useful life needed before degradation',
        type: 'select',
        options: ['6 months', '12 months', '18 months', '24 months', 'Not sure'],
      },
    ],
  },
  {
    id: 'antimicrobial',
    family: 'additive',
    name: 'Antimicrobial Masterbatch',
    tagline: 'Controls microbial growth on plastic surfaces and textiles.',
    icon: 'Microscope',
    accent: '#D6EBDD',
    keywords: ['antimicrobial', 'anti-microbial', 'antibacterial', 'anti-bacterial', 'bacteria', 'microbe', 'hygiene', 'mould', 'mold', 'fungi', 'biofilm', 'odour', 'odor'],
    knowledge: [
      'Special additives that control the growth of microbes on the surface of plastic products and textiles.',
      'Applications: plastics, films, fibres, mouldings, powder coatings, adhesives, paper and wet paint.',
      'Benefits cited: helps reduce the spread of healthcare-acquired infections, protects against cross-contamination, supports wound-dressing hygiene, reduces odour in synthetic fibres and sportswear, extends product life and resists biofilm build-up.',
      'The site does not publish the active chemistry, efficacy data or test standards — efficacy claims, test methods (e.g. ISO 22196) and regulatory status must be confirmed by the technical team.',
    ],
    keyFacts: [
      { label: 'Function', value: 'Surface microbial control' },
      { label: 'Formats', value: 'Films · fibres · moldings · coatings' },
      { label: 'Benefit', value: 'Hygiene · odour · biofilm resistance' },
    ],
    source: 'https://purepolymers.net/?page_id=325',
    tds: 'TDS-AM',
    specFields: [
      {
        id: 'endUse',
        label: 'End use',
        type: 'chips',
        multiple: true,
        options: ['Medical / healthcare', 'Food-contact packaging', 'Textiles & fibres', 'Consumer goods', 'Coatings & adhesives'],
      },
      { id: 'targets', label: 'Protection against', type: 'chips', multiple: true, options: ['Bacteria', 'Mould & fungi', 'Odour'] },
      { id: 'standard', label: 'Required test standard', type: 'text', placeholder: 'e.g. ISO 22196' },
    ],
  },
  {
    id: 'flame-retardant',
    family: 'additive',
    name: 'Flame Retardant Masterbatch',
    tagline: 'Brominated FR systems — high efficacy at relatively low addition rates.',
    icon: 'Flame',
    accent: '#E0703A',
    keywords: ['flame', 'fire', 'flame retardant', 'fr', 'ul94', 'ul 94', 'v-0', 'v0', 'v-2', 'brominated', 'halogen', 'combustion', 'burning'],
    knowledge: [
      'Brominated flame retardants are presented as the most effective in performance and cost across a broad range of applications.',
      'They act in the gas phase: the energy-rich H· and OH· radicals formed in a fire are neutralized, interrupting the combustion chain reaction.',
      'High efficacy at a relatively low addition rate means the polymer properties are affected less than with other systems.',
      'Uses: electrical and electronic engineering, construction, transport, textiles, films and sheets.',
      'The site does not list UL 94 ratings or halogen-free grades; rating targets and halogen-free requirements must be confirmed by the technical team.',
    ],
    keyFacts: [
      { label: 'Chemistry', value: 'Brominated, gas-phase action' },
      { label: 'Advantage', value: 'Low addition rate' },
      { label: 'Sectors', value: 'E&E · construction · transport' },
    ],
    source: 'https://purepolymers.net/?page_id=466',
    tds: 'TDS-FR',
    specFields: [
      { id: 'rating', label: 'Fire rating target', type: 'select', options: ['UL 94 V-0', 'UL 94 V-2', 'UL 94 HB', 'Other / not sure'] },
      { id: 'halogen', label: 'Chemistry constraint', type: 'segmented', options: ['Brominated acceptable', 'Halogen-free required'] },
      {
        id: 'sector',
        label: 'Sector',
        type: 'chips',
        multiple: true,
        options: ['Electrical & electronics', 'Construction', 'Transport', 'Textiles', 'Film & sheet'],
      },
      { id: 'thickness', label: 'Part / film thickness', type: 'text', placeholder: 'e.g. 1.5 mm' },
    ],
  },
  {
    id: 'optical-brightener',
    family: 'additive',
    name: 'Optical Brightener Masterbatch',
    tagline: 'Fluorescent whitening — fresher whites and restored whiteness in recycled resin.',
    icon: 'Sparkles',
    accent: '#E3E8FF',
    keywords: ['optical brightener', 'brightener', 'oba', 'brightness', 'dull', 'yellowish', 'fluorescent', 'whitening'],
    knowledge: [
      'Works by fluorescence: absorbs light in the UV spectrum and emits it in the blue region of the visible spectrum, giving a brighter, fresher appearance and masking yellowing without adding a blue cast.',
      'Based on a bis-benzoxazole-type organic brightener in a polyolefin carrier; highly concentrated.',
      'Restores whiteness to recycled polymers.',
      'Applications: agricultural blown / cast film and raffia, consumer injection and blow molding, flexible packaging extrusion, healthcare and hygiene, fibers, thermoplastic molding, rotomolding.',
    ],
    keyFacts: [
      { label: 'Chemistry', value: 'Bis-benzoxazole type' },
      { label: 'Effect', value: 'Masks yellowing, brighter whites' },
      { label: 'Great for', value: 'Recycled content' },
    ],
    source: 'https://purepolymers.net/?page_id=478',
    tds: 'TDS-OB',
    specFields: [
      { id: 'recycledPct', label: 'Recycled content', type: 'select', options: YES_NO_RECYCLED },
      { id: 'withWhite', label: 'Used together with white masterbatch', type: 'toggle', default: false },
    ],
  },
  {
    id: 'impact-modifier',
    family: 'additive',
    name: 'Impact Modifier Masterbatch',
    tagline: 'Ethylene–acrylic ester copolymer for toughness and low-temperature impact.',
    icon: 'Hammer',
    accent: '#C9CFD6',
    keywords: ['impact', 'impact modifier', 'brittle', 'brittleness', 'cracking', 'toughness', 'low temperature', 'cold', 'stress crack', 'esc'],
    knowledge: [
      'Ethylene–acrylic ester copolymer.',
      'Modifies polypropylene, polystyrene, PBT, ABS, polyethylene, polyamide, PET and polycarbonate.',
      'Improves splitting and stress-crack resistance, low-temperature impact, flexibility (reduces hardness), weldability and processability on standard equipment; thermally stable with good filler compatibility, good adhesion to substrates and good organoleptic properties.',
      'Processes: injection molding, extrusion, compounding. Uses: cables, masterbatches, construction materials, bags and rigid polymer products.',
    ],
    keyFacts: [
      { label: 'Chemistry', value: 'Ethylene–acrylic ester' },
      { label: 'Polymers', value: 'PP · PS · PBT · ABS · PA · PET · PC' },
      { label: 'Gains', value: 'Low-temp impact · stress-crack' },
    ],
    source: 'https://purepolymers.net/?page_id=460',
    tds: 'TDS-IM',
    specFields: [
      { id: 'basePolymer', label: 'Polymer to modify', type: 'chips', options: ['PP', 'PE', 'PS', 'ABS', 'PA', 'PET', 'PBT', 'PC'] },
      { id: 'lowTemp', label: 'Low-temperature impact required', type: 'toggle', default: false },
      { id: 'target', label: 'Target property / test', type: 'text', placeholder: 'e.g. Izod impact at −20 °C' },
    ],
  },
  {
    id: 'blowing-agent',
    family: 'additive',
    name: 'Blowing Agent Masterbatch',
    tagline: 'Endothermic chemical foaming — lighter parts, fine cells, shorter cycles.',
    icon: 'Wind',
    accent: '#DDE3EA',
    keywords: ['blowing agent', 'foaming', 'foam', 'weight reduction', 'density reduction', 'sink marks', 'lightweight', 'cba', 'endothermic'],
    knowledge: [
      'Chemical blowing agents decompose through a thermally activated reaction during processing and release gas, producing a stable, defined plastic foam.',
      'Pure Polymers focuses on endothermic systems (active agents such as carbonates and carboxylic acids; gases released are carbon dioxide and water vapor) that consume heat while decomposing, so gas formation can be stopped and restarted by controlling the energy input. Gas yield is approximately 100–130 ml/g.',
      'Benefits: very fine cell structure, controlled foaming, shorter cycle times, reduced streaking, no post-expansion, non-toxic gases, approved for food packaging.',
      'Trade-offs: higher dosing than exothermic blowing agents; possible blooming. Processes: extruders, injection molding and blow molding.',
    ],
    keyFacts: [
      { label: 'Type', value: 'Endothermic (CO₂ + H₂O)' },
      { label: 'Gas yield', value: '≈ 100–130 ml/g' },
      { label: 'Benefits', value: 'Fine cells · shorter cycles' },
    ],
    source: 'https://purepolymers.net/?page_id=523',
    tds: 'TDS-BA',
    specFields: [
      { id: 'process', label: 'Process', type: 'segmented', options: ['Injection molding', 'Extrusion', 'Blow molding'] },
      { id: 'densityReduction', label: 'Target density reduction', type: 'slider', min: 5, max: 40, step: 5, default: 15, unit: '%' },
      {
        id: 'goal',
        label: 'Main goal',
        type: 'chips',
        multiple: true,
        options: ['Weight / cost reduction', 'Remove sink marks', 'Shorter cycle time', 'Insulation'],
      },
      { id: 'foodContact', label: 'Food-contact application', type: 'toggle', default: false },
    ],
  },
  {
    id: 'purging',
    family: 'additive',
    name: 'Purging Compound Masterbatch',
    tagline: 'Cleans extruders, injection and blow-molding machines between colors and materials.',
    icon: 'RefreshCcw',
    accent: '#C4CCD4',
    keywords: ['purge', 'purging', 'changeover', 'color change', 'colour change', 'contamination', 'black specks', 'cleaning', 'barrel cleaning'],
    knowledge: [
      'Designed to clean primary processing machines — extruders, injection molding and blow molding machines — at a color change or to remove contamination.',
      'Reduces barrel-cleaning time during changeovers, increases effective manufacturing time and productivity, and removes residual material and color traces.',
    ],
    keyFacts: [
      { label: 'Machines', value: 'Extruder · injection · blow' },
      { label: 'Use', value: 'Color / material changeover' },
      { label: 'Benefit', value: 'Less downtime and scrap' },
    ],
    source: 'https://purepolymers.net/?page_id=498',
    tds: 'TDS-PURGE',
    specFields: [
      { id: 'machine', label: 'Machines', type: 'chips', multiple: true, options: ['Extruder', 'Injection molding', 'Blow molding'] },
      { id: 'change', label: 'Purge scenario', type: 'segmented', options: ['Color change', 'Material change', 'Contamination / specks'] },
      { id: 'size', label: 'Screw diameter / shot size', type: 'text', placeholder: 'e.g. 65 mm screw' },
    ],
  },
  {
    id: 'custom-additive',
    family: 'additive',
    name: 'Multifunctional / Custom Additive Package',
    tagline: 'Combination packages prototyped in the Jeddah lab for your exact problem.',
    icon: 'FlaskConical',
    accent: '#E09A2D',
    keywords: ['custom', 'combination', 'multifunctional', 'package', 'formulation', 'develop', 'new additive', 'combo'],
    knowledge: [
      'Pure Polymers is a specialist additive masterbatch company with development and manufacturing expertise and a global supply position.',
      'A fully equipped laboratory lets the technical staff rapidly prototype new formulations, run extensive in-house testing and provide a first-rate sampling service; chemical producers launching new additives also use Pure Polymers as a development partner.',
      'Combination systems are available — for example antioxidant with UV stabilizer and process aid, or slip with antiblock and antistatic.',
    ],
    keyFacts: [
      { label: 'Approach', value: 'Lab prototyping & testing' },
      { label: 'Combos', value: 'AO + UV + PPA · slip + AB + AS' },
      { label: 'Sampling', value: 'First-rate sample service' },
    ],
    source: 'https://purepolymers.net/additives-masterbatch/',
    tds: null,
    specFields: [
      {
        id: 'functions',
        label: 'Functions needed',
        type: 'chips',
        multiple: true,
        options: ['Slip', 'Antiblock', 'Antistatic', 'Antioxidant', 'UV', 'Process aid', 'Anti-fog', 'Desiccant', 'Other'],
      },
      { id: 'problem', label: 'Describe the problem to solve', type: 'text', required: true, placeholder: 'e.g. 3-layer shrink film: static + blocking on rewinder' },
    ],
  },

  /* ───────────────────────────────────── Compounds ───────────────────────────────────── */
  {
    id: 'precolored-compound',
    family: 'compound',
    name: 'Pre-colored Resins & Compounds',
    tagline: 'Custom compounds on 60+ polymer types — samples and orders in 7 business days.',
    icon: 'Boxes',
    accent: '#3249B3',
    keywords: ['compound', 'compounding', 'pre-colored', 'precolored', 'pearl', 'bopp', 'cpp', 'resin', 'tolling'],
    knowledge: [
      'Coloring of trade-name resins or specialty compounds, with custom matches or standard colors and precise color tolerances across production runs.',
      'Works with more than 60 polymer types combined with hundreds of performance additives; the buyer can specify the resin or let Pure Polymers select one that meets the specification.',
      'Packages can include colorant, additives, flame retardant, UV resistance, durability or wear resistance.',
      'Range includes pre-colored compounds, pearl compounds, purging compounds and BOPP / CPP masterbatch for biscuit, snack and confectionery packaging. Compounds suit PE, PP, PS and ABS base resins for furniture, electrical appliances and industrial components.',
      'Samples and production orders ship within 7 business days. Pure Polymers also supplies liquid and paste colorants and custom compounding.',
    ],
    keyFacts: [
      { label: 'Breadth', value: '60+ polymer types' },
      { label: 'Bases', value: 'PE · PP · PS · ABS' },
      { label: 'Lead time', value: '7 business days' },
    ],
    source: 'https://purepolymers.net/?page_id=484',
    tds: 'TDS-PC',
    specFields: [
      { id: 'type', label: 'Compound type', type: 'segmented', options: ['Pre-colored compound', 'Pearl compound', 'BOPP / CPP masterbatch'] },
      { id: 'baseResin', label: 'Base resin', type: 'chips', options: ['PE', 'PP', 'PS', 'ABS', 'Let Pure Polymers select'] },
      {
        id: 'packages',
        label: 'Performance packages',
        type: 'chips',
        multiple: true,
        options: ['Color', 'Additives', 'Flame retardant', 'UV resistance', 'Durability / wear'],
      },
      { id: 'color', label: 'Color reference', type: 'text', placeholder: 'e.g. RAL 7035 or standard natural' },
    ],
  },
]

export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]))
export const FAMILY_BY_ID = Object.fromEntries(FAMILIES.map((f) => [f.id, f]))

export function productsForFamily(familyId) {
  return PRODUCTS.filter((p) => p.family === familyId)
}

/** Families whose configurator step is a single product (no picker needed). */
export function isSingleProductFamily(familyId) {
  return productsForFamily(familyId).length === 1
}

/**
 * Reference suffix for a set of selected products: the family of the first
 * selected product wins, so a mixed request still gets one routable code.
 */
export function familyCodeFor(productIds) {
  const first = PRODUCT_BY_ID[productIds?.[0]]
  return first ? FAMILY_BY_ID[first.family].code : 'MB'
}
