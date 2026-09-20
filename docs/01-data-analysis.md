# 1 · Data analysis — how Pure Polymers' own data shapes the form and the agent

*Prepared for Fahad Alnanih, Pure Polymers for Industries · OussamaLabs*

---

## 1.1 What was analysed

| Source | What it gave us | Where it is used |
|---|---|---|
| `Inputs/Website crawler/*.md` (10 files) | Category structure, the 4 product-range entries, the 18 additive product names, 3 technical blog posts (desiccant, antioxidant, processing aid), the Arabic mirror | Product taxonomy, first pass of the knowledge base |
| `Inputs/Messagerie…quote request page.pdf` | The email thread and Fahad's reply ("Yes, please!"), signature: Modon 3 Jeddah, +966 54 646 0891 | The problem statement, contact routing, WhatsApp handoff number |
| `Inputs/faviconV2.png`, logo dataset | The Pure Polymers mark | Favicon and header logo in the mockup |
| purepolymers.net, live (Sept 2026) | 18 additive detail pages, white/black/color pages, the **current quote form**, the Elementor brand palette, the 3 news posts | Dosages and mechanisms, the before/after comparison, brand colors, authority badges |

**Why the live site was needed.** The crawl contains category listings and blog teasers, not the technical detail pages. The additive category page in the crawl also stops at 16 of 18 products — purging compound and UV masterbatch are on page 2. Every number in the deliverable (dosages, TiO₂ loading, resistivity, gas yield, cling development time) comes from a product page that the crawl links to but does not include.

## 1.2 The problem, measured

The current `/request-quotes/` page is a single Elementor form. Read from the live DOM:

| # | Field | Type | Required? |
|---|---|---|---|
| 1 | First Name | text | no |
| 2 | Last Name | text | no |
| 3 | Email | email | **no** |
| 4 | Phone | tel | no |
| 5 | Company | text | no |
| 6 | Product Name | **free text** | no |
| 7 | Color Name or Code | free text | no |
| 8 | Comments | textarea | no |

Submit button: "Request A Quote". After submission: no reference, no confirmation content, no email promise, no next step.

Three consequences, in the order they cost money:

1. **Nothing is required — not even the email.** A form that can be submitted empty produces inquiries the desk cannot answer or even reply to.
2. **"Product Name" is free text.** The buyer types "white masterbatch" and the desk must email back to ask the carrier, the TiO₂ level, the process and the volume. That round trip is where a buyer who is also talking to two other suppliers goes quiet.
3. **No next step.** The exact hesitation the email thread named: the buyer has no evidence the request landed, so contacting a second supplier is the rational move.

The 22 products are the asset that fixes this. Pure Polymers already publishes the parameters that decide a quotation — they are just not on the form.

## 1.3 The catalog model

Everything derives from one file, [`quote-portal/src/data/catalog.js`](../quote-portal/src/data/catalog.js): **5 families · 22 products · 77 product-specific spec fields · 96 sourced knowledge statements · 231 recognition keywords.** Each product carries `knowledge[]` (what the site says), `keyFacts[]` (three facts shown on cards), `specFields[]` (the questions that product needs), `tds` (data-sheet key), `keywords[]` (offline matching) and `source` (the page it came from).

| Family | Code | Products | Routed to |
|---|---|---|---|
| Color Masterbatch | CM | 1 | Color Lab |
| White Masterbatch | WM | 1 | Color Lab |
| Black Masterbatch | BM | 1 | Color Lab |
| Additive Masterbatch | AM | 18 | Additives Technical Desk |
| Pre-colored Resins & Compounds | PC | 1 | Compounding Team |

The family code becomes the reference suffix: `#PP-8942-AM` is an additive request, readable at a glance by whoever picks up the phone.

## 1.4 From published page to form field

The rule: **if the page publishes a parameter, it becomes a field; if the page publishes a number, it becomes a hint or a default; if the page is silent, nothing is invented.**

| Product | Published fact (source) | Field it generates |
|---|---|---|
| White Masterbatch | "up to 75% TiO₂ (in LLDPE)", several carrier resins, resists phenolic yellowing/pinking | TiO₂ slider 40–75% (default 70), carrier segmented, priorities chips, let-down text |
| Desiccant (DES01) | "Average dosage 1–3%", binds "up to 20% of the masterbatch weight", moisture from regrind/fillers/hygroscopic resin | Moisture-source chips, defect chips (fish-eyes, bubbles, silver streaks, bubble breakage), current-drying toggle, recycled-content select |
| Anti-Fog | "Mono-layer 3–8%, multi-layer 2–6%" in the skin layer; hot and cold fog; food packaging and greenhouse | Structure segmented (dosage shown per option), fog-type chips, application segmented, thickness |
| Clarifier | "third-generation sorbitol", "10% active", "1.5–3%", PP homo + random only | PP-grade segmented, process, wall thickness, food-contact toggle |
| Cling | PIB in LLDPE; blown ≈ 8%, cast 3–4%; cling develops 24–72 h; base resin < 0.923, no slip/AB | Film-process segmented, layer structure, use chips, cling-type chips |
| Process aid | ≈1% to condition then 0.25–0.5%; up to 15% output; melt fracture, die build-up, gels | Problem chips, resin segmented, "already running a PPA" toggle |
| Antistatic | untreated 10¹⁴–10¹⁵ Ω → treated 10⁸–10¹¹ Ω; fast vs long-acting | Effect segmented, target-resistivity select, combination chips |
| Black | particle size range, blue→jet→brown undertone, ABS/GPPS/HIPS/PE/PP | Undertone segmented, pigment-system segmented, outdoor toggle, target polymer |
| d2w Oxo-biodegradable | Symphony partnership, SASO 2879, KSA mandate since 2016 | End-product chips, SASO documentation toggle (on by default), service-life select |

Two cross-cutting behaviours fall out of the same data:

- **Documented-polymer markers.** `DOCUMENTED_POLYMERS` records the polymers each page actually names. Those chips get a green dot, and picking one outside the list shows *"Anti-Fog Masterbatch is not documented for Recycled PE — our technical team will confirm feasibility in the quotation."* That is a sales asset: it shows expertise without refusing the business.
- **A naming trap, handled.** The site's "Anti-Slip Masterbatch" page describes erucamide/oleamide **slip** additives that *lower* COF (target ≈ 0.2). A buyer asking for "anti-slip" may want the opposite (stacked sacks that must not slide). The form asks which direction, and the agent is instructed to confirm before recommending.

## 1.5 From published page to agent knowledge

The same file generates the assistant system prompt (`n8n/build.mjs` → ~10.3k tokens). Each product becomes a `<product>` block: name, family, grade, the sourced knowledge bullets, key facts, documented polymers, TDS availability, source URL.

Three grounding rules make the agent safe to put in front of industrial buyers:

1. **Numbers only from the knowledge base.** Dosage, loading, resistivity and gas yield may be stated because Pure Polymers publishes them; anything else is "the technical team confirms it on the TDS".
2. **Never invent approvals.** Flame retardant is the clearest case: the page explains brominated gas-phase chemistry but publishes no UL 94 rating, so any rating question routes to WhatsApp instead of producing a plausible-sounding answer.
3. **Never quote a price.** The only published commercial offer is the 5% Colors Visualizer discount; everything else goes to the quote form.

## 1.6 Brand kit recovered from the live site

Read from the site's Elementor global settings, so the mockup matches the real brand rather than approximating it:

| Token | Value | Use in the mockup |
|---|---|---|
| Accent green | `#509C35` | Primary buttons, confirmation accents |
| Lime | `#BECC30` | Eyebrows, progress, focus rings, tagline |
| Blue | `#3249B3` | Assistant, technical accents, pellets |
| Black / white / off-white | `#060606` / `#FFFFFF` / `#F7F7F7` | Pellets and surfaces |
| Type | Raleway, Futura | Jost (Futura-like) for display, Inter for UI, JetBrains Mono for references |

The WebGL pellet field uses **white, black, blue and amber** as requested; amber stands in for natural/translucent additive pellets, and the mix shifts toward whichever family the buyer selects.

## 1.7 Open questions for Pure Polymers

These are deliberately unanswered in the build — each needs a decision from your side, and each is a one-line change:

1. **TDS library.** The confirmation promises data sheets. Which PDFs, in which Drive folder? (Workflow B reads a `TDS_Library` sheet tab: product id → Drive file id.)
2. **Desk routing addresses.** Real inboxes for Color Lab / Additives / Compounding. Until then everything runs in pilot mode to oussama.g@oussamalabs.com.
3. **The 5% mechanic.** Today it is "5% OFF when you use our color visualizer tool". The mockup says the offer is *noted on the quotation* when the buyer quotes their reference. Confirm the exact wording you want to honour.
4. **Desk hours.** Sunday–Thursday 08:00–17:00 AST is assumed for the "quotation within 2 business days" calculation.
5. **Desiccant storage wording.** The page states both "use within 16–24 hours after opening" and "valid for 8 to 84 hours if exposed to open air". The build uses the conservative 16–24 h; worth correcting on the site.
6. **Anti-Slip page.** Consider renaming to "Slip Masterbatch", or adding a true anti-slip grade if you sell one.
7. **MOQ and sample policy.** Not published; the agent never states one.
