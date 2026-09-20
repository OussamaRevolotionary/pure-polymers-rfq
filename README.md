# Pure Polymers — quote request rebuild

A working replacement for the `/request-quotes/` page: a technical RFQ configurator with a WebGL pellet backdrop, an anti-ghosting confirmation step, an n8n backend that cannot drop a lead, and a catalog-grounded AI assistant.

Built for **Pure Polymers for Industries** (Modon 3, Jeddah) by **OussamaLabs**.

**Live demo:** https://oussamarevolotionary.github.io/pure-polymers-rfq/

This is a concept mockup, not the live purepolymers.net page. The backend is real: the
quote form writes to a real ledger and spreadsheet and sends real email, and the
assistant answers from the real catalog through OpenAI. Internal notifications go to a
pilot inbox until Pure Polymers confirms their desk addresses.

---

## The problem this fixes

The current quote page is an eight-field Elementor form where **nothing is required — not even the email** — the product is free text, and submitting shows no confirmation, no reference and no next step. An industrial buyer with no evidence their request landed does the rational thing and asks two more suppliers.

The rebuild answers the three questions a buyer has at that moment: *did it arrive, who has it, and when do I hear back.*

## What is in here

| Path | Deliverable |
|---|---|
| [`docs/01-data-analysis.md`](docs/01-data-analysis.md) | How the crawl and the live site produced the 22-product catalog, the form fields and the agent's knowledge base — plus open questions for Pure Polymers |
| [`quote-portal/`](quote-portal) | The frontend: Vite 8 · React 19 · Tailwind 4 · three.js r186 |
| [`docs/02-n8n-architecture.md`](docs/02-n8n-architecture.md) | The three n8n workflows, node by node, with the failure matrix |
| [`n8n/`](n8n) | Code-node sources, build script, validated SDK code, importable workflow JSON, email previews, test suite |
| [`docs/03-ai-agent.md`](docs/03-ai-agent.md) | The AI assistant: model settings, system prompt architecture, tool schemas, routing logic, guardrails |
| [`agent/`](agent) | Prompt and tool generators + generated artifacts |

Everything derives from one file — [`quote-portal/src/data/catalog.js`](quote-portal/src/data/catalog.js). It drives the form fields, the confirmation summary, the TDS routing and the agent's knowledge base, so the four can never disagree.

## Run the frontend

```bash
cd quote-portal && npm install && npm run dev
```

Opens on <http://localhost:8787>. With no `.env.local` it runs in **preview mode**: submissions are simulated (clearly labelled) and the assistant uses the built-in offline engine, so the demo works with no backend and no API key.

To connect the real backend, copy `.env.example` to `.env.local` and fill in the two n8n webhook URLs.

Add `?static=1` to the URL to freeze animations for screenshots.

## Deploy the backend

```bash
node agent/build.mjs              # regenerate the system prompt + tool schemas
node n8n/build.mjs                # validate and export the three workflows
node n8n/test/run-code-nodes.mjs  # 56 checks + rendered email previews
```

Then follow the setup checklist in [`docs/02-n8n-architecture.md`](docs/02-n8n-architecture.md#25-setup-checklist) — import the JSON, bind credentials, create the sheet tabs and the data table, activate.

## How a request flows

1. **Configure** — four steps, product-specific fields (TiO₂ %, fog type, PP grade, cling layer…), with a live spec-sheet brief beside the form.
2. **Submit** — the browser saves to a local outbox first, then posts; retries with backoff; the n8n webhook de-duplicates on submission id.
3. **Confirm** — reference `#PP-8942-AM` on screen, the desk it went to, a dated quotation promise on the Sunday–Thursday calendar, the exact spec received, the 5% Colors Visualizer offer, and the PIF / d2w authority badges.
4. **Notify** — the routed desk gets a scored alert with the full spec and one-tap reply; the buyer gets a branded confirmation with the TDS attached.
5. **Chase** — the SLA watchdog escalates anything still open past its promised reply time.

At every step there is a fallback: local outbox if the network drops, the data-table ledger if Sheets fails, a WhatsApp handoff if the automation cannot help.

## Status

Live. All three n8n workflows are published on `oussama19.app.n8n.cloud` and the portal
builds to GitHub Pages.

| Piece | State |
|---|---|
| Frontend | Built and exercised end to end at 1440px and 375px — no console errors, no horizontal overflow |
| n8n workflows | Deployed and published: 33 + 16 + 5 nodes, timezone Asia/Riyadh |
| Code nodes | 60 assertions passing against a payload produced by the frontend's own builder |
| Quote pipeline | Verified against the production webhook: ledger row, sheet row, both emails, duplicate suppression, honeypot, bot filtering |
| AI assistant | Verified live on `gpt-5.4-mini`: prose + product cards, correct qualification, regulatory handoff, conversion logged. Deployed prompt integrity checked by fingerprint |
| Emails | Rendered to `n8n/previews/*.html` and received in a real inbox |

Known gaps:

- The `TDS_Library` tab is empty until the real TDS PDFs are uploaded to Drive, so buyer
  confirmations currently ship without attachments. That path degrades by design — the
  email still goes out, and the technical desk sends the data sheet with the quotation.
- The assistant webhook is unauthenticated, because the browser has to call it. Per-request
  caps (30 turns, 2,000 characters, 220 kB) and n8n's bot filter are in place, but there is
  no per-IP rate limit. That is fine for a pitch demo; before this sits on purepolymers.net
  long term, put a rate limit or a shared token in front of it.

Pilot mode is on: internal notifications go to oussama.g@oussamalabs.com until Pure Polymers confirms the desk addresses. Buyer confirmations always go to the buyer.
