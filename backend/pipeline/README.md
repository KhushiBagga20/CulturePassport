# Research pipeline

Finds candidate traditions for new countries from open data and puts them in a **review queue**.
It never creates or publishes passports. An editor reviews each candidate at `/admin/research` and
can reject it or turn it into a **draft** passport, where every claim is marked
"Further verification needed".

```
open data ──► npm run research ──► review queue ──► editor ──► draft passport ──► editor rewrites ──► published
 (Wikidata,                          (not public)     (reject /   (claims all                (sources checked,
  UNESCO IDs,                                          add country  "needs                     communities
  Commons)                                             / draft)     verification")             consulted)
```

## Run it

```bash
npm run research -- --country GH --country PE          # ISO 3166-1 alpha-2 codes
npm run research -- --country MX --dry-run             # print what it would add
npm run research -- --country JP --limit 120           # default limit is 60 per country
npm run test:research                                  # offline tests (recorded Kente cloth snapshot)
```

Re-running is safe: candidates are refreshed, but an editor's decision (rejected / drafted, notes) is kept.

## What it collects

| Source | Used for | Licence |
| --- | --- | --- |
| Wikidata (SPARQL + `wbgetentities`) | Elements with a UNESCO ICH ID (`P10221`) or an ICH list status (`P3259`), tied to the country (`P17` / `P495`); names in the country's official languages; places (`P131`, `P276`) with coordinates; kind (`P31`) | CC0 |
| UNESCO ICH pages | The official listing URL (`https://ich.unesco.org/en/<ID>`) and, as recorded on Wikidata, the list and year | Link only |
| Wikimedia Commons | The element's image (`P18`), its licence, credit and size | Image used only if CC0, public domain, CC BY or CC BY-SA |
| Wikipedia | A link for further reading | Link only. No text is copied |

Each candidate is triaged as "craft or visual art" or not, so the queue can show crafts first. Editors can still draft anything.

## Where it writes

- **`DATABASE_URL` set** (read from `.env.local`, or `backend/pipeline/.env` to override): the `research_candidates` table (`backend/db/migrations/0004_research.sql`). Run `npm run db:setup` once first.
- **No `DATABASE_URL`:** `.data/research.json`, the local queue the dev server reads.

Candidates are never shown on public pages. Editors review them in the passcode-protected desk.

## Running it as a separate backend

This folder needs only Node 24 and the `postgres` package. The logic it shares with the site lives in `src/lib/research.ts` and `src/lib/db.ts`. To move it to its own repository or a scheduled job:
1. Copy `backend/pipeline/`, `src/lib/research.ts` and `src/lib/db.ts`. Keep them identical in both places, or publish them as a small package.
2. Give it the same `DATABASE_URL` as the site. The schema in `backend/db/migrations` is the contract between the two.
3. Schedule it (for example weekly per country). Because decisions are kept, repeat runs only add or refresh leads.

## Wikimedia etiquette

Requests are batched (50 entities per call), spaced out, and retried with back-off on HTTP 429 or 5xx. The client sends a generic User-Agent. For heavy use, set a User-Agent with a contact address of your own, as Wikimedia's policy asks.
