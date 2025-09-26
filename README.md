# Certified Countries

Interactive certification explorer for Open Area, Entry, and Waffle sensors. The app surfaces the latest coverage from Supabase (with a bundled fallback dataset), offers fast search, and renders an interactive Mapbox map so customers can confirm market readiness at a glance.

## Prerequisites

- Node.js 20+
- Mapbox access token with tileset access to `mapbox.country-boundaries-v1`
- Supabase project (or local stack) with the SQL migration applied

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment variables and fill in real values:
   ```bash
   cp .env.example .env.local
   ```
3. Apply the migration in `supabase/migrations/0001_create_certifications.sql` using the Supabase SQL editor or CLI.
4. Seed certification records once you have the service role key:
   ```bash
   npm run supabase:seed
   ```

## Environment

- `.env.local` (Next.js runtime)
  - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` – required for the interactive map
  - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` – optional; enables live reads instead of the static fallback
- `.env` (seed scripts)
  - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` – required for `npm run supabase:seed`

If the Supabase client fails to load (e.g., missing anon key) the UI gracefully reverts to the bundled data.

## Development

```bash
npm run dev
```

Visit http://localhost:3000 to explore the certification dashboard. The top search bar fuzzy matches country names, certification schemes, and lead times. Selecting a country focuses the map, while the right-hand panel summarises scheme, status, timing, and notes.

`npm run lint` keeps the TypeScript + ESLint configuration happy, and `npm run build` performs a production compile.

## Project Structure

- `src/data/certificationData.ts` – bundled reference data used for seeding and offline fallback
- `src/components/CertificationExperience.tsx` – main UI shell with search, filters, and sensor toggles
- `src/components/CertificationMap.tsx` – Mapbox implementation with status-driven styling
- `supabase/migrations` – schema for `sensor_types`, `countries`, and `certification_records`
- `supabase/seed` – data loader that mirrors the bundled dataset into Supabase

Future enhancements: streaming updates via Supabase realtime, customer-specific views (e.g., deployment plans), and automation hooks for initiating new certification requests when users search unsupported markets.
