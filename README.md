# Finance Desk

A finance research dashboard prototype combining source-linked news workflows with an educational valuation notebook. The project emphasises traceable inputs, explicit freshness and visible gaps when data is unavailable.

**Status:** source snapshot for local review. This repository does not provide a hosted service, configured market-data credentials or a verified unattended collection schedule.

## Features

- Source adapters, story grouping and timestamped research views.
- A five-year illustrative cash-flow DCF with editable assumptions, a value bridge and sensitivity analysis.
- Source-bearing valuation inputs, fiscal-period mapping and validation before import.
- Dated valuation lessons with scenario calculations kept separate from saved inputs.

## Stack

TypeScript, React, Vinext/Vite, Cloudflare Worker/D1 interfaces and Drizzle. A Python collector supplies valuation inputs. The project began from a Sites starter; local development helpers remain in `scripts/`.

## Run locally

Requires Node.js 22.13+ and npm.

```sh
npm ci
npm run build
# Apply migrations in order to a fresh local database:
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_past_hairball.sql
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_pale_prodigy.sql
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_dear_slipstream.sql
npm run dev
```

Use the loopback URL printed by the development server. Empty or unavailable views are expected until sources and valuation inputs are configured. Do not replay migrations on an existing database.

## Architecture

| Path | Purpose |
| --- | --- |
| `app/`, `components/` | Dashboard, research and valuation UI |
| `lib/` | Source ingestion, access checks and pure valuation functions |
| `db/`, `drizzle/` | Database schema and migrations |
| `scripts/valuation-collector.py` | Valuation collection and import |
| `data/valuation-primary-validation.json` | Reviewed source mappings, with dated evidence |
| `tests/` | Model, backend, collector and regression checks |

## Validation

With Node.js 24+, run `npx --yes --package=tsx tsx --test tests/*.test.ts`. The collector tests require Python with pandas installed: `python3 -m pip install pandas`, then `python3 tests/valuation-collector.test.py`. Source mapping metadata records earlier reviews; it is not a claim that market data is current.

## Boundaries

The DCF uses illustrative assumptions and reported cash-flow proxies. It is an educational model, not a price target or investment recommendation. It does not support every company or sector. Missing or unreconciled inputs should produce an unavailable state.

Hosted authentication depends on the original platform. Local preview identity is simulated; it must not be exposed publicly. API keys and service tokens belong in server-side environment configuration, never client code. Provider terms and data rights require review before enabling collection or redistributing output.

Private runtime settings, databases, collected news, logs and hosting identifiers are excluded. Third-party licences remain in `vendor/` and dependencies.
