# Vodič za deplojovanje na Vercel

## Problem
SQLite ne radi na Vercel-ovoj serverless platformi jer Vercel koristi read-only file sistem.

## Rješenje: Korištenje Vercel Postgres

### Korak 1: Dodajte Vercel Postgres

1. Idite na Vercel dashboard
2. Odaberite vaš projekat → **Storage** → **Create** → **Postgres**
3. Vercel će automatski postaviti `POSTGRES_URL` environment varijablu

### Korak 2: Instalirajte Postgres driver

```bash
npm install pg
npm install --save-dev @types/pg
```

### Korak 3: Migrirajte vaše podatke

**VAŽNO: Ovo radite lokalno, NE na Vercelu**

1. Kreirajte `.env.local` fajl:
```bash
POSTGRES_URL="postgres://username:password@host/database"
```
(Kopirajte connection string iz Vercel Storage sekcije)

2. Pokrenite migraciju:
```bash
node migrate-to-postgres.js
```

Ovo će:
- Kreirati `sales` tabelu u Postgres
- Kopirati sve podatke iz SQLite u Postgres
- Kreirati indexe za bolje performanse

### Korak 4: Ažurirajte db.ts

Zamijenite `lib/db.ts` sa `lib/db-unified.ts`:

```bash
# Backup trenutnog fajla
mv lib/db.ts lib/db-sqlite-backup.ts

# Koristite unified verziju
mv lib/db-unified.ts lib/db.ts
```

### Korak 5: Ažurirajte main page na async

Glavni page (`app/page.tsx`) mora biti async jer Postgres koristi async operacije.

Promijenite:
```typescript
export default function Home() {
  const sales = query<Sale>('SELECT * FROM sales ORDER BY datum DESC LIMIT 10');
```

U:
```typescript
export default async function Home() {
  const sales = await query<Sale>('SELECT * FROM sales ORDER BY datum DESC LIMIT 10');
```

### Korak 6: Deploy na Vercel

```bash
git add .
git commit -m "Prelazak na Postgres za Vercel"
git push
```

Vercel će automatski detektovati promjene i deployati sa Postgres bazom!

## Lokalni development

Unified db.ts fajl automatski koristi:
- **SQLite** kada ne postoji `POSTGRES_URL` (lokalni development)
- **Postgres** kada postoji `POSTGRES_URL` (production na Vercel)

Možete nastaviti da koristite SQLite lokalno bez promjena!

## Alternativa: Korištenje drugih platforma

Ako želite zadržati SQLite, možete deployati na:
- **Railway.app** - besplatno, podržava SQLite
- **Fly.io** - podržava persistent storage
- **DigitalOcean App Platform**
- **Render.com**

## Testiranje prije deploya

1. Testirajte lokalno sa Postgres:
```bash
# Postavite POSTGRES_URL u .env.local
POSTGRES_URL="your-postgres-url"

npm run dev
```

2. Provjerite da li sve radi
3. Deploy na Vercel

## Pomoć

Ako dobijete greške:
- Provjerite da li je `POSTGRES_URL` pravilno postavljen u Vercel Environment Variables
- Provjerite da li je migracija uspješno završena
- Provjerite Vercel logs za detalje greške
