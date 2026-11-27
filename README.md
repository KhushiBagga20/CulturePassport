# Culture Passport

**When culture travels, let its story travel with it.**

Culture Passport is a living atlas and attribution layer for cultural heritage. Every tradition gets a digital passport: its names in its own scripts, the places and communities it belongs to, the people who make it, how it has travelled, and every source behind every claim, each labelled by how certain it is. A QR code connects a physical object (in a museum, a workshop, a market stall or on a product) straight to its passport.

It is an education, documentation and attribution project. **It is not a legal ownership registry**, and a passport number is an archive reference, not a certificate.

---

## What's in this build

| Area | Route | Notes |
| --- | --- | --- |
| The living globe (Explore) | `/` | Three.js / React Three Fiber globe built from Natural Earth country polygons. Hover picks countries by real geography. Clicking flies the camera in and opens the country chapter. Includes India → UAE → World routes, one primary action, quiet links to a passport-number picker and a keyboard-friendly country list, a Warli-style loading symbol, and a 2D atlas fallback (automatic without WebGL, or chosen by the visitor). |
| Country chapters | `/country/[slug]` | Every country page has a "Back to the globe" action. India (active collection): contents, interactive map + filterable editorial gallery, attribution histories, connections, makers on record, traditions awaiting documentation. UAE (introductory). Ghana / Japan / Mexico ("stories being documented"). Pakistan / Nepal (shared traditions). Any other country gets an honest "not yet in the archive" page. |
| Culture Passports | `/passport/[slug]` | A country silhouette (solid for its collection, hatched for countries it is shared with) marks each passport instead of a number. Six chapters: **Where It Began** (interactive places map) · **The People Behind It** (material → process → object flow) · **A Journey Through Time** (overview ruler + draggable timeline, details on demand) · **Across Borders** (connection diagram, case files) · **Sources & References** (evidence and source-mix charts, source library) · **Meet the Makers**. A sticky chapter bar (a compact selector with previous/next on phones), a back-to-country action, and citation markers that open a source drawer instead of jumping away. Longer text folds into "Keep reading". Chapter anchors (`#origins`, `#makers`, `#through-time`, `#travels`, `#evidence`, `#keep-alive`) are unchanged, so existing links keep working. Statically generated and revalidated, so QR scans load fast. |
| Kolhapuri × Prada case file | `/passport/kolhapuri-chappal#travels` | Sourced chronology from June 2025 to April 2026 (colour-coded by phase, details on demand), a side-by-side comparison (a draggable slider appears only when both sides have licensed images), "What travelled, and what was left behind?", six questions with evidence labels, a legal note, and open questions. |
| Identity card & Share with Credit | `/passport/[slug]/card`, `/api/card/[slug]` | PNG card (portrait 1080×1350, or `?layout=landscape`) with a QR code; a caption that carries the source link; native share where supported. |
| QR system | `/api/qr/[slug]?format=svg\|png`, `/passport/[slug]/label`, `/p/NNN` | Downloadable codes, print-ready gallery label + product tag, permanent short links by passport number, slug history so renamed passports keep resolving. |
| Roots & Routes | `/routes` | Evidence-labelled connection map. Visual similarity is drawn as its own faint kind and never presented as influence. |
| Search | `/search` | Passports, attribution cases, timeline events, claims, countries, places, sources and trails, with type and country filters. `⌘K` or `/` from anywhere. |
| Trails | `/trails`, `/trails/[slug]` | *Crafted by Hand*, *Threads Across Borders*, *Tradition Meets the Runway*, *From Walls to Paper*. Passports show a trail bar when visited from a trail. |
| About | `/method` | How we work: principles, evidence labels, editorial process, corrections, languages, maps, image credits. |
| Editorial desk | `/admin` | Sign-in, dashboard with integrity check, passport editor (identity, story markup, claims with sources, timeline, places and people, advanced JSON, publication), new drafts, sources, permitted-image uploads, review queue for public corrections, QR labels, audit history, draft preview. |
| Research pipeline | `npm run research`, `/admin/research` | Gathers UNESCO-listed traditions for any country from Wikidata, UNESCO IDs and Wikimedia Commons into a private review queue. Editors reject candidates, add the country to the atlas ("Stories being documented"), or create a **draft** passport whose claims are all "Further verification needed". Nothing is published automatically. See [`pipeline/README.md`](pipeline/README.md). |

### Content in the seed archive

| No. | Passport | Research status | Notes |
| --- | --- | --- | --- |
| 001 | Kolhapuri Chappal | Researched | Flagship. GI registry record, court reporting, contemporaneous press, Prada announcements. |
| 002 | Madhubani · Mithila Painting | Researched | GI registry, Archer historiography (and its critique), 1960s paper programme, Mithila Museum (Japan). |
| 003 | Phulkari | Starter | GI registry (2010, not the often-quoted 2011), Philadelphia Museum of Art, the Partition. |
| 004 | Warli Painting | Editorial draft | GI held by an Adivasi organisation; materials and meaning await community review. |
| 005 | Ajrakh | Editorial draft | Shared by Sindh, Kutch and Barmer; the Kutch GI (2024) covers Kutch only; the Indus "priest-king" link is shown as a disputed resemblance. |
| 006 | Al Sadu (UAE) | Starter | Built only from UNESCO decisions: inscribed 2011, moved to the Representative List in New Delhi in December 2025. |

**Research passports.** A further 102 passports (Ghana 2, Japan 69, Mexico 13, Peru 18) were published from the research pipeline (`npm run research`, then `npm run research:publish`). They are built only from UNESCO listings, Wikidata and Wikimedia Commons, carry the "Editorial draft" label, and mark every claim "Further verification needed". They live in the database, not in the seed. Each country page also lists them with their UNESCO references.

The six researched passports have 57 sources, 49 claims and 39 timeline events. Every source was located during research on 17 Nov 2026, and every claim cites at least one source. `npm run validate` checks that every reference resolves.

### Navigation

The header has four destinations — **Explore** (the globe), **Countries** (`/explore`), **Stories** (passports, trails and Roots & Routes, with section tabs) and **About** (`/method`) — plus Search (`⌘K` or `/`). On phones it becomes a full-screen menu of colour blocks. A passport never requires the globe: QR codes and short links open it directly.

### Design language

Flat colour blocks, heavy uppercase headlines in Inter and graphic devices (triangular tabs, notched ticket cards, chevron process steps, checker strips, offset print shadows), defined once in `src/app/globals.css`:

| Token | Hex | Use |
| --- | --- | --- |
| `cream` | `#ECE2CA` | Page surface |
| `bone` | `#F6F0E3` | Cards; the globe stage keeps this original paper colour |
| `orange` | `#EEA53A` | Statement sections |
| `cobalt` | `#1F4E9F` | Bold sections, maps |
| `vermilion` | `#E04A2C` | Large type and shapes only |
| `brick` | `#B0351E` | Small red text (AA on cream) |
| `green` | `#27703F` | Contrasting sections |
| `yellow` | `#F4BA2E` | Highlights |
| `ink` | `#1B1616` | Text and dark sections |

Each tradition's accent (`ACCENT` in `src/lib/labels.ts`) has a block colour, an ink colour for text on it, and a darker text colour that passes AA on cream. The globe's own colours (`src/components/globe/geo.ts`, `GlobeCanvas.tsx`) are unchanged.

---

## Quick start (local demo mode, no database needed)

Requires Node.js 20.9+ (tested on Node 24).

```bash
npm install
```

```bash
cp .env.example .env.local
```

Set `EDITOR_PASSCODE` in `.env.local` to a long passcode (it unlocks `/admin`), then:

```bash
npm run dev
```

Open http://localhost:3000. Without `DATABASE_URL`, the app reads the TypeScript seed archive in `src/lib/data/seed/`. Editor changes are written to `.data/store.json` (gitignored), layered over the seed. The seed itself is never modified.

### Try the QR journey on your phone

QR codes encode the address you are browsing on, unless `NEXT_PUBLIC_SITE_URL` is set. Open the site on your computer using its network address (for example `http://192.168.1.20:3000`), go to a passport's **Print a label** page, and scan it with your phone on the same Wi-Fi.

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production | Public origin for QR codes, share captions, the sitemap and Open Graph tags. Leave empty in development. |
| `EDITOR_PASSCODE` | To edit | Passcode for the editorial desk (`DEMO_ADMIN_PASSWORD` is still accepted). If unset, the desk stays locked. Never hard-coded. |
| `EDITOR_SESSION_SECRET` | Optional | Extra secret mixed into the signed editor session cookie (`DEMO_SESSION_SECRET` is still accepted). |
| `DATABASE_URL` | Database mode | A PostgreSQL connection string, for example from Neon. When set, the site, the research pipeline and `npm run db:setup` all use it. **Server-only**: never give it a `NEXT_PUBLIC_` name. |
| `DATABASE_POOL_MAX` | Optional | Connections per server process (default 5). |

Only the server ever talks to the database, so its connection string never reaches the browser. Editing requires the editor passcode; public pages show published passports only.

---

## Where the content lives

**The public site reads a snapshot baked into the repository**: `src/lib/data/snapshot.json`, the full published archive (about 400 passports). Public pages never query a database, so they can't fail or slow down because of one, and builds don't use database quota.

- `npm run snapshot:build` rebuilds it from the hand-written seed (`src/lib/data/seed/`) plus the research queue in `.data/research.json` (from `npm run research -- … --target local`).
- `npm run snapshot:export` exports the published archive from PostgreSQL instead, after edits made in `/admin`.
- `data/passport-ids.json` records every passport's address and number. Both commands reuse them, so printed QR codes and shared links keep working; new passports get the next free number.
- Commit the updated snapshot and push; the deploy publishes it.

**PostgreSQL (optional) is the editorial workspace**: drafts, edits, uploads, corrections and the research queue. With `DATABASE_URL` set, `/admin` works on the database; changes reach the public site at the next `snapshot:export` and deploy.

If the snapshot was rebuilt outside the database (`snapshot:build`), run `npm run db:load-snapshot -- --yes` before editing in `/admin`, so the database starts from what the public site shows; otherwise a later `snapshot:export` would bring back the older text. It keeps drafts, uploads, corrections and the research queue.

## Database setup (PostgreSQL on Neon)

1. **Create a free project** at neon.tech.
2. **Copy its connection string**: Dashboard → Connect. Use the pooled one if offered (the host contains `-pooler`); it should end in `?sslmode=require`. Paste it into `.env.local` as `DATABASE_URL=…`, and into your host's environment settings when you deploy.
3. **Set up the database:** `npm run db:setup`. It applies the migrations in `db/migrations` in order, records them in a separate `cp_admin.migrations` table, loads `db/seed.sql` if the archive is empty, and reports what is there. It never prints the connection string and is safe to re-run.
   - `0001_schema.sql`: the normalised tables (countries, places, communities, traditions, names, links, chapter sections, translations, claims and `claim_sources`, events and `event_sources`, case studies, materials, process steps, practitioners, organisations, resources, relationships, trails, QR records, content revisions, correction requests), with indexes, constraints and timestamps.
   - `0002_functions.sql`: `save_tradition(jsonb)`, which replaces a passport and all its child rows in one transaction.
   - `0003_media_files.sql`: images uploaded through the editorial desk (up to 8 MB each), served by `/api/media/[file]`.
   - `0004_research.sql`: the research review queue.
4. **Restart or redeploy.** The site switches to the database whenever `DATABASE_URL` is set. Editors sign in with `EDITOR_PASSCODE`, and `npm run research -- --country GH` writes candidates to the database.

Any PostgreSQL 14+ database works the same way (Railway, Render, Supabase's database on its own, or your own server).

### Database tests (no Neon project needed)

`npm run test:db` creates a throwaway local PostgreSQL database and runs `npm run db:setup` against it, checking that the setup is safe to re-run and never prints the connection string. It then reads the archive back through the site's own loader and checks it matches the seed **exactly**, before exercising the write paths the site uses:
- `save_tradition`, including drafts
- source and country upserts
- uploaded images, returned byte for byte
- the research queue keeping editors' decisions
- corrections and the audit log
- database constraints

It needs a local PostgreSQL server plus `createdb` and `dropdb` on your PATH.

---

## Assets and licences

- **Photographs** are hotlinked from Wikimedia Commons thumbnails, each with credit, licence and source page in `src/lib/data/seed/registry.ts`. They're shown on every image and listed at `/method#credits`. If an image can't load, the tradition's archive illustration appears instead, clearly labelled.
- **Archive illustrations** (`src/components/motifs/Motif.tsx`) are original geometric studies for wayfinding. They're labelled as not being traditional artworks and are never used as evidence.
- **No runway photography is reproduced.** The Kolhapuri comparison shows a CC0 museum photograph beside an explicit "image not licensed" panel. Editors can attach a properly licensed image later.
- **Uploads** go through `/admin/media` (JPEG, PNG, WebP or AVIF; max 8 MB; licence, credit and alt text required). They're stored in `.data/uploads/` without a database, or in the `media_files` table with one.
- **For production**, consider mirroring the Commons images to your own storage, keeping the credit fields intact.
- **Boundaries** come from Natural Earth via `world-atlas` (`public/geo/`), shown for orientation only, with no position on disputed territories. Places are plotted at approximate centres.
- **Fonts**: Inter for everything (headlines, labels and reading text), self-hosted from `src/app/fonts` via `next/font/local` (no Google Fonts request at build or run time), plus `@fontsource/inter` for generated card and Open Graph images. SIL Open Font Licence.

---

## Deployment (Vercel)

1. **Import** the GitHub repository at vercel.com → Add New → Project. The framework is detected as Next.js; keep the default build command (`next build`).
2. **Environment variables** (Settings → Environment Variables, for Production and Preview):
   - `DATABASE_URL` (optional): your Neon connection string, for the editorial desk only. Use the pooled one (its host contains `-pooler`). Builds and public pages don't use it; they read the snapshot.
   - `EDITOR_PASSCODE`: a long passcode for `/admin`.
   - `EDITOR_SESSION_SECRET`: any long random string.
   - `NEXT_PUBLIC_SITE_URL` (optional): your public address, for example `https://culturepassport.example`. Without it, QR codes, share links and metadata use the address the visitor is on, or Vercel's production domain.
3. **Deploy.** For editing on the live site, the database must already be set up (`npm run db:setup` from your machine, with the same `DATABASE_URL` in `.env.local`).

Notes:
- **Storage:** with `DATABASE_URL`, edits, uploads, corrections and the research queue all live in Postgres. Without it, they are files in `.data/`, which needs a writable, persistent disk (`next start` on a server), not Vercel.
- **Caching:** every passport, country page and trail is generated at build time from the snapshot. Edits in `/admin` reach the public site with the next `npm run snapshot:export`, commit and deploy.
- **Uploads** are limited to 4 MB per image (Vercel caps request bodies at 4.5 MB).
- **Before printing labels**, set `NEXT_PUBLIC_SITE_URL` so codes point to the public address. The label page warns if they would point to `localhost`.

---

## Scripts

```bash
npm run dev          # development server
npm run build        # production build
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm run validate     # archive referential integrity (seed)
npm run seed:sql     # regenerate db/seed.sql from the TypeScript seed
npm run db:setup     # apply migrations and load the seed into DATABASE_URL (safe to re-run)
npm run test:db      # setup + round-trip + write paths against a throwaway local PostgreSQL
npm run research -- --country GH   # gather research candidates for a country (see pipeline/README.md)
npm run test:research               # offline tests for the research pipeline
npm run research:publish            # publish the research queue into PostgreSQL (add --dry-run to preview)
npm run snapshot:build              # rebuild src/lib/data/snapshot.json from the seed + .data/research.json
npm run snapshot:export             # rebuild the snapshot from PostgreSQL (after editing in /admin)
npm run check:research              # check research passports against live sources → data/research-checks.md
npm run db:load-snapshot -- --yes   # load the snapshot into PostgreSQL (keeps drafts, uploads, corrections)
```

---

## Project structure

```
src/
  app/                      routes (App Router, Next.js 16)
    page.tsx                the living globe + campaign story
    country/[slug]/         country chapters
    passport/[slug]/        passport, /card, /label, opengraph-image
    api/qr, api/card        QR codes and identity-card PNGs
    p/[no]/                 permanent short links
    routes, search, trails, method, explore, passports
    admin/                  editorial desk (login, (desk)/…, preview, server actions)
  components/
    globe/                  R3F globe, textures, picking, flat atlas
    country/                region maps, collection explorer
    passport/               chapters, chapter bar, timeline, process flow, connection web, case file, sources & source drawer, sharing
    routes/ search/ admin/ site/ motifs/
  lib/
    types.ts                content model
    data/seed/              researched seed archive + integrity validator
    data/rows.ts            content model ⇄ normalised SQL rows (shared by seed SQL, the Postgres adapter and tests)
    data/archive.ts         repository: local seed + store, or PostgreSQL (data/pg.ts, db.ts)
    data/mutations.ts       editor writes, corrections, audit trail
    auth.ts                 editor passcode → signed session cookie
db/
  migrations/               schema, save_tradition, uploaded images, research queue
  seed.sql                  generated seed content
pipeline/                   research pipeline (see pipeline/README.md)
scripts/                    validator, seed generator, db:setup, database round-trip test
```

---

## Editorial principles (summary)

1. Not against cultural exchange. Against context disappearing.
2. Shared traditions stay shared. Every country involved is named.
3. Resemblance is not evidence.
4. No invented people, quotes, dates or sources. Empty is better than fabricated.
5. No legal conclusions. Report what courts, registries and parties have said.
6. Generated images are never evidence.

Evidence labels: **Documented**, **Community testimony**, **Historical interpretation**, **Disputed**, **Further verification needed**. Editors apply them per claim; they are never applied automatically. Translations are stored per language and published only after human review.

---

## Known limitations

- The PostgreSQL backend is tested end to end against local PostgreSQL 18: the site, the editor desk, uploads served from the database, the research pipeline and `db:setup`. It has not yet been run against a hosted Neon project.
- Editors share one passcode; the audit log records the name each editor types when signing in. Individual editor accounts are not built.
- Warli and Ajrakh are honest editorial drafts. Practitioner interviews, verified artisan profiles and process reviews have not been done, and the UI says so.
- The Prada Group announcement page (27 Apr 2026) timed out during research, so its details rest on independent trade reporting (WWD), which is noted in the source library.
- Image-sharing support depends on the device's Web Share API. Where it isn't available, the app offers download and copy instead.
- Multilingual support is in the data model (native scripts, a translations table), but no translated interface ships yet.
