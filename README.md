# FightTrack

A multi-tenant platform for boxing gyms. Coaches sign up, add their fighters, log training sessions and keep fight records. Every gym's data is isolated from every other gym's.

Built by Ayet ([github.com/izzxrith](https://github.com/izzxrith)), a boxer and developer who wanted the tool he'd actually use.

**Live demo:** (https://fighttrack-saas.vercel.app/)

## What it does

- A coach creates a gym and gets an owner account
- The coach adds fighters, and each fighter gets their own login
- Sessions are logged per fighter: type, duration, date, notes
- Fights are logged per fighter: opponent, result, date, with a W-L-D tally
- Fighter accounts only ever see their own data while coaches see their whole gym

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · PostgreSQL (Supabase) · Prisma 7 · Zod · bcrypt · JWT · Vercel

## How multi-tenancy works

One database, shared tables and every tenant-owned row carries a `gymId`. The rule that keeps gyms apart:

> `gymId` is read only from the verified session cookie, never from the request body, URL or query string.

Every query is scoped with it and a lookup that misses because the record belongs to another gym returns **404, not 403**, so a response never confirms that someone else's record exists.

## Security

- Passwords hashed with bcrypt (cost 12), never logged or returned
- Sessions are JWTs in an `httpOnly`, `secure`, `sameSite=lax` cookie, never in localStorage with a 15-minute lifetime
- All input is validated server-side with Zod and normalized (Unicode normalization, control and zero-width characters stripped, length caps, `<` and `>` rejected in name fields)
- Output is escaped by React; there is no `dangerouslySetInnerHTML` anywhere
- Prisma parameterizes every query, there is no raw SQL
- Role checks happen on the server (coach-only actions return 403 to fighter accounts)
- Rate limiting on signup, login and add-fighter
- Login and signup errors are deliberately vague so they can't be used to find out which emails are registered

## Local setup

Requires Node 22.

```bash
git clone https://github.com/izzxrith/fighttrack-saas.git
cd fighttrack-saas
npm install
```

Create a `.env` file (it is gitignored):

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
JWT_SECRET="generate with: openssl rand -base64 48"
```

- `DATABASE_URL` is the pooled connection the running app uses.
- `DIRECT_URL` is the direct connection Prisma uses for schema changes. Supabase's pooler can hang on schema operations, so `prisma.config.ts` points at this one.
- Special characters in the password must be URL-encoded (`@` becomes `%40`).

Then:

```bash
npx prisma db push
npx prisma generate
npm run dev
```

Open http://localhost:3000.

## Project structure

```
app/
  api/
    auth/            signup, login, logout
    fighters/        list, create, view one, delete
    sessions/        log training sessions
    fight-records/   log fights
  dashboard/         fighter list, add-fighter form, fighter page
  login/  signup/    auth pages
lib/
  auth.ts            password hashing, JWT, session cookie
  db.ts              Prisma client (Postgres driver adapter)
  sanitize.ts        input normalization helpers
  validation.ts      Zod schemas for every endpoint
  rateLimit.ts       in-memory rate limiter
prisma/schema.prisma data model
```

## Known limitations

- Sessions last 15 minutes with no refresh, so users sign in again after that
- The rate limiter is in-memory which is fine for one instance but would need Redis across several serverless instances
- No password reset or email verification yet

## Roadmap

- [x] Auth, gym creation, tenant-scoped API
- [x] Fighters, sessions, fight records
- [ ] Training plans coaches assign to fighters
- [ ] Security headers and CORS lock
- [ ] Automated tests and CI
- [ ] Refresh tokens and an audit log for deletes