# Culture Passport

**When culture travels, let its story travel with it.**

Culture Passport is a living atlas and attribution layer for cultural heritage. Every tradition gets a digital passport: its names in its own scripts, the places and communities it belongs to, the people who make it, how it has travelled, and every source behind every claim, each labelled by how certain it is. A QR code connects a physical object (in a museum, a workshop, a market stall or on a product) straight to its passport.

It is an education, documentation and attribution project. **It is not a legal ownership registry**, and a passport number is an archive reference, not a certificate.

---

## What's in this build

| Area | Route | Notes |
| --- | --- | --- |
| The living globe (Explore) | `/` | Three.js / React Three Fiber globe built from Natural Earth country polygons. Hover picks countries by real geography. Clicking flies the camera in and opens the country chapter. Includes India → UAE → World routes, a three-step "how to explore" guide, a country-index dialog, a passport-number picker, a search shortcut, and a 2D atlas fallback (automatic without WebGL, or chosen by the visitor). |
| Country chapters | `/country/[slug]` | Every country page has a "Back to the globe" action. India (active collection): contents, interactive map + filterable editorial gallery, attribution histories, connections, makers on record, traditions awaiting documentation. UAE (introductory). Ghana / Japan / Mexico ("stories being documented"). Pakistan / Nepal (shared traditions). Any other country gets an honest "not yet in the archive" page. |
| Culture Passports | `/passport/[slug]` | Six chapters: **Where It Began** (interactive places map) · **The People Behind It** (material → process → object flow) · **A Journey Through Time** (overview ruler + draggable timeline, details on demand) · **Across Borders** (connection diagram, case files) · **Sources & References** (evidence and source-mix charts, source library) · **Meet the Makers**. A sticky chapter bar (a compact selector with previous/next on phones), a back-to-country action, and citation markers that open a source drawer instead of jumping away. Longer text folds into "Keep reading". Chapter anchors (`#origins`, `#makers`, `#through-time`, `#travels`, `#evidence`, `#keep-alive`) are unchanged, so existing links keep working. Statically generated and revalidated, so QR scans load fast. |
| Kolhapuri × Prada case file | `/passport/kolhapuri-chappal#travels` | Sourced chronology from June 2025 to April 2026 (colour-coded by phase, details on demand), a side-by-side comparison (a draggable slider appears only when both sides have licensed images), "What travelled, and what was left behind?", six questions with evidence labels, a legal note, and open questions. |
| Identity card & Share with Credit | `/passport/[slug]/card`, `/api/card/[slug]` | PNG card (portrait 1080×1350, or `?layout=landscape`) with a QR code; a caption that carries the source link; native share where supported. |
| QR system | `/api/qr/[slug]?format=svg\|png`, `/passport/[slug]/label`, `/p/NNN` | Downloadable codes, print-ready gallery label + product tag, permanent short links by passport number, slug history so renamed passports keep resolving. |
| Roots & Routes | `/routes` | Evidence-labelled connection map. Visual similarity is drawn as its own faint kind and never presented as influence. |
| Search | `/search` | Passports, attribution cases, timeline events, claims, countries, places, sources and trails, with type and country filters. `⌘K` or `/` from anywhere. |
| Trails | `/trails`, `/trails/[slug]` | *Crafted by Hand*, *Threads Across Borders*, *Tradition Meets the Runway*, *From Walls to Paper*. Passports show a trail bar when visited from a trail. |
| About | `/method` | How we work: principles, evidence labels, editorial process, corrections, languages, maps, image credits. |
| Editorial desk | `/admin` | Sign-in, dashboard with integrity check, passport editor (identity, story markup, claims with sources, timeline, places and people, advanced JSON, publication), new drafts, sources, permitted-image uploads, review queue for public corrections, QR labels, audit history, draft preview. |

### Content in the seed archive

| No. | Passport | Research status | Notes |
| --- | --- | --- | --- |
| 001 | Kolhapuri Chappal | Researched | Flagship. GI registry record, court reporting, contemporaneous press, Prada announcements. |
| 002 | Madhubani · Mithila Painting | Researched | GI registry, Archer historiography (and its critique), 1960s paper programme, Mithila Museum (Japan). |
| 003 | Phulkari | Starter | GI registry (2010, not the often-quoted 2011), Philadelphia Museum of Art, the Partition. |
| 004 | Warli Painting | Editorial draft | GI held by an Adivasi organisation; materials and meaning await community review. |
| 005 | Ajrakh | Editorial draft | Shared by Sindh, Kutch and Barmer; the Kutch GI (2024) covers Kutch only; the Indus "priest-king" link is shown as a disputed resemblance. |
| 006 | Al Sadu (UAE) | Starter | Built only from UNESCO decisions: inscribed 2011, moved to the Representative List in New Delhi in December 2025. |

57 sources, 49 claims and 39 timeline events. Every source was located during research on 17 Nov 2026, and every claim cites at least one source. `npm run validate` checks that every reference resolves.

### Navigation

The header has four destinations — **Explore** (the globe), **Countries** (`/explore`), **Stories** (passports, trails and Roots & Routes, with section tabs) and **About** (`/method`) — plus Search (`⌘K` or `/`). On phones it becomes a full-screen menu of colour blocks. A passport never requires the globe: QR codes and short links open it directly.

### Design language

Flat colour blocks, heavy uppercase headlines in Inter and graphic devices (ticker bands, triangular tabs, notched ticket cards, chevron process steps, checker strips, offset print shadows), defined once in `src/app/globals.css`:

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

Set `DEMO_ADMIN_PASSWORD` in `.env.local` to a long passcode (it unlocks `/admin`), then:

```bash
npm run dev
```

Open http://localhost:3000. Without Supabase variables, the app reads the TypeScript seed archive in `src/lib/data/seed/`. Editor changes are written to `.data/store.json` (gitignored), layered over the seed. The seed itself is never modified.

### Try the QR journey on your phone

QR codes encode the address you are browsing on, unless `NEXT_PUBLIC_SITE_URL` is set. Open the site on your computer using its network address (for example `http://192.168.1.20:3000`), go to a passport's **Print a label** page, and scan it with your phone on the same Wi-Fi.

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production | Public origin for QR codes, share captions, the sitemap and Open Graph tags. Leave empty in development. |
| `DEMO_ADMIN_PASSWORD` | Local demo admin | Passcode for the editorial desk when Supabase isn't configured. If unset, the desk stays locked. Never hard-coded. |
| `DEMO_SESSION_SECRET` | Optional | Extra secret mixed into the signed editor session cookie. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase mode | Your project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) | Supabase mode | The **public** anon/publishable key. Row-level security decides what each request can do. |

The app never reads a Supabase service-role key, so one can't leak to the browser.

---

## Supabase setup (production backend)

1. **Create a project** at supabase.com.
2. **Run the migrations** in order. Use the SQL editor, or the Supabase CLI (`supabase link`, then `supabase db push`):
   - `supabase/migrations/0001_schema.sql` creates the normalised tables: countries, places, communities, traditions, names, tradition↔place/community/country links, chapter sections, translations, claims and `claim_sources`, events and `event_sources`, case studies and questions, materials, process steps, practitioners, organisations, resources, related traditions, relationships, trails, editors, QR records, content revisions and correction requests. It also adds indexes and timestamps.
   - `supabase/migrations/0002_policies.sql` adds RLS: anyone can read published content; drafts, and everything linked to them, are visible to editors only; only rows in `editors` can write. Anyone can submit a correction, but only editors can read one. It also adds a public, non-personal change-log view, and a transactional `save_tradition(jsonb)` RPC used by the editor.
   - `supabase/migrations/0003_storage.sql` creates the public `media` bucket (images up to 8 MB) with editor-only uploads.
3. **Load the seed content.** Regenerate it with `npm run seed:sql` if you have changed the seed, then run `supabase/seed.sql`.
4. **Add editors.** Create a user under Authentication → Users, then insert them:
   ```sql
   insert into editors (user_id, role) values ('<auth user uuid>', 'admin');
   ```
5. **Set the environment variables** above and redeploy. The app switches to Supabase automatically when both public Supabase variables are present. Editors sign in with email and password.

### Database tests (no Supabase project needed)

`npm run test:db` creates a throwaway local PostgreSQL database and applies the migrations (with minimal stand-ins for Supabase's `auth` schema and roles). It then loads the generated seed, reads every table back, and checks that the archive round-trips **unchanged** through the normalised schema. It also checks RLS (anonymous visitors can't see drafts or their claims, can't modify content, can submit but not read corrections) and that `save_tradition` works for editors and is refused for everyone else. It needs `createdb`, `psql` and `dropdb` on your PATH.

---

## Assets and licences

- **Photographs** are hotlinked from Wikimedia Commons thumbnails, each with credit, licence and source page in `src/lib/data/seed/registry.ts`. They're shown on every image and listed at `/method#credits`. If an image can't load, the tradition's archive illustration appears instead, clearly labelled.
- **Archive illustrations** (`src/components/motifs/Motif.tsx`) are original geometric studies for wayfinding. They're labelled as not being traditional artworks and are never used as evidence.
- **No runway photography is reproduced.** The Kolhapuri comparison shows a CC0 museum photograph beside an explicit "image not licensed" panel. Editors can attach a properly licensed image later.
- **Uploads** go through `/admin/media` (JPEG, PNG, WebP or AVIF; max 8 MB; licence, credit and alt text required). They're stored in `.data/uploads/` in demo mode or the Supabase `media` bucket in production.
- **For production**, consider mirroring the Commons images into Supabase Storage, keeping the credit fields intact.
- **Boundaries** come from Natural Earth via `world-atlas` (`public/geo/`), shown for orientation only, with no position on disputed territories. Places are plotted at approximate centres.
- **Fonts**: Inter for everything (headlines, labels and reading text) via `next/font` (fetched at build time), plus `@fontsource/inter` for generated card and Open Graph images. SIL Open Font Licence.

---

## Deployment

- **Vercel or any Node host**: `npm run build`, then `npm start`. Set `NEXT_PUBLIC_SITE_URL`.
- **Local demo store**: this needs a writable disk (`next dev`, or `next start` on a server). On serverless hosts, use the Supabase backend; in demo mode the editorial desk there will report that it can't save.
- **Caching**: passports, country pages and trails are statically generated and revalidate every 5 minutes. Editor saves revalidate the affected pages immediately.
- **Before printing labels**, set `NEXT_PUBLIC_SITE_URL` so codes point to the public address. The label page warns if they would point to `localhost`.

---

## Scripts

```bash
npm run dev          # development server
npm run build        # production build
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm run validate     # archive referential integrity (seed)
npm run seed:sql     # regenerate supabase/seed.sql from the TypeScript seed
npm run test:db      # migrations + seed + RLS + RPC round-trip against local PostgreSQL
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
    data/rows.ts            content model ⇄ normalised SQL rows (shared by seed SQL, Supabase adapter and tests)
    data/archive.ts         repository: local seed + store, or Supabase
    data/mutations.ts       editor writes, corrections, audit trail
    auth.ts                 Supabase Auth editors / local signed sessions
supabase/
  migrations/               schema, RLS + RPC, storage
  seed.sql                  generated seed content
scripts/                    validator, seed generator, database round-trip test
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

- The Supabase adapter's schema, seed, RLS policies and editor RPC are tested against local PostgreSQL 18 (`npm run test:db`). The app itself has not yet been run against a hosted Supabase project, including Supabase Auth sign-in and Storage uploads.
- Warli and Ajrakh are honest editorial drafts. Practitioner interviews, verified artisan profiles and process reviews have not been done, and the UI says so.
- The Prada Group announcement page (27 Apr 2026) timed out during research, so its details rest on independent trade reporting (WWD), which is noted in the source library.
- Image-sharing support depends on the device's Web Share API. Where it isn't available, the app offers download and copy instead.
- Multilingual support is in the data model (native scripts, a translations table), but no translated interface ships yet.
