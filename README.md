# 🧺 Cleaning Twin

**Linen rental management for hospitality — my first startup.**

Cleaning Twin tracks every piece of linen that moves between the laundry service and its clients: what was delivered clean, what was picked up dirty, and what is still sitting at each client's property.

The count at the property is entered by hand. It is not calculated from deliveries and pickups.

## Two sides, one platform

### 🧑‍💼 Admin
- Full overview of the whole service, across all clients
- Filters by client, property and date range, with totals
- The only role that creates, edits and deletes clients, properties, deliveries, pickups and stock counts

### 🏠 Client
- Read-only
- Sees **only their own history**: deliveries, pickups, stock counts, and the latest stock per property

## Three areas
| Area | What it tracks |
|---|---|
| 🚚 **Clean delivery** | Linen delivered clean to the client |
| 🔄 **Dirty pickup** | Linen collected dirty from the client |
| 📦 **Client stock** | A manual count of linen held at the property. The latest count is the current stock; older counts stay in the history |

## Tracked items
- Double sheet (lenzuolo matrimoniale)
- Single sheet (lenzuolo singolo)
- Pillowcase (federa)
- Shower towel (telo doccia)
- Face towel (telo viso)
- Guest towel (telo ospite)
- Bath mat (scendibagno)

The interface is in Italian. The admin will often type from a phone, so the forms are built for a small screen.

## Status
First working version: accounts, the three areas, and Postgres row level security.

## Stack
Next.js (App Router, TypeScript), Supabase (Postgres and auth), deployable on Vercel.

## Product decisions
- One client record per email. That client can have several properties, and every delivery, pickup and count belongs to one property.
- Sign-up is email and password, with no approval. A person is linked to a client when `auth.users.email` matches `clients.email`, ignoring case and surrounding spaces. The link is live: change either email and access moves with it.
- Someone with an unknown email can sign in. They see an empty area until an admin creates a client with that email. They can sign up before or after that client exists.
- Access checks the auth email, not `public.profiles`. Editing a profile cannot grant another client's data.
- Admins are the emails in `public.admin_emails`. The app cannot write that table. Add yourself with the SQL below, before or after you sign up.
- The app never uses the service role key. Admin actions run as the signed-in admin, and row level security allows them. A client cannot read another client's rows or write anything; the policies are in Postgres, not only in the UI.
- A stock count may be all zeros. A delivery or a pickup must include at least one piece.
- Date filters apply to the movement list and to delivery and pickup totals. Current stock is the latest count on or before the end date (or the latest count at all, when no end date is set). The start date does not change current stock.
- Deleting a client deletes their properties and movements. The login account, if they have one, is left in place.
- An admin who opens the client area sees only the client linked to their own email. The overview is the cross-client screen.
- Item types are fixed columns. Adding one later is a schema change.
- The form accepts whole quantities from 0 to 100,000 per item.

## Setup

### 1. Create a Supabase project
Create a project at [supabase.com](https://supabase.com). In **Authentication → Providers → Email**, decide whether new users must confirm their address.

For an admin entering data from a phone, turn **Confirm email** off so sign-up lands them straight in the app. If you leave it on, the app asks them to open the link in the message; that link returns through `/auth/callback`.

In **Authentication → URL configuration**, set the site URL to the app (locally `http://localhost:3000`) and add redirect URLs:

```text
http://localhost:3000/**
https://your-app.vercel.app/**
```

### 2. Apply the database
In the Supabase **SQL editor**, run the whole of [`supabase/migrations/20261031120000_init.sql`](supabase/migrations/20261031120000_init.sql) once. It creates the tables, the email link, and the row level security policies. It does not insert sample rows.

If you use the Supabase CLI and the project is already linked:

```bash
npx supabase db push
```

### 3. Make yourself admin
Open [`supabase/make-admin.sql`](supabase/make-admin.sql), replace `you@example.com` with the email you will use to sign in, and run it in the SQL editor.

```sql
insert into public.admin_emails (email)
values ('you@example.com')
on conflict (email) do nothing;
```

Then sign up in the app with that same email. Order does not matter: if you already signed up, running the SQL is enough and the next page load is the admin overview.

To add another admin later, run the same statement with their email. There is no admin screen for this.

### 4. Example data (optional)
[`supabase/seed.sql`](supabase/seed.sql) is **example data**, not a migration. It inserts two fake Neapolitan clients and a few movements, plus the admin address `admin@cleaning-twin.example`. Emails use the reserved `.example` domain.

Run it in the SQL editor only on a database you are happy to fill with that story. Do not run it in production. `supabase db reset` loads it locally; applying migrations does not.

Sign up as `admin@cleaning-twin.example` after the seed and you are the example admin. Sign up as `maria@hotel-vesuvio.example` to see Hotel Vesuvio as a client.

### 5. Configure env
```bash
cp .env.example .env.local
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from **Project Settings → Data API**. Older projects show an anon key instead: put that in `NEXT_PUBLIC_SUPABASE_ANON_KEY` and leave the publishable key unset. The app accepts either.

Do not put the service role key in the app. It is not read.

### 6. Run locally
```bash
npm install
npm run dev
```

Open `http://localhost:3000`, create the admin account, then add a client. Use a second browser (or a private window) to sign up with the client's email and confirm you only see that client's properties.

### 7. Deploy on Vercel
Import the repo in Vercel. Set the same `NEXT_PUBLIC_SUPABASE_URL` and publishable (or anon) key. Deploy, then add the Vercel URL to the Supabase redirect list from step 1.

No extra build command. Vercel detects Next.js.

## Tests
The suite covers row level security, email linking (including sign-up before the client exists, case, and a tampered profile), stock that is not derived from deliveries, and the form rules.

```bash
npm test
```

Tests run against an in-memory Postgres (PGlite) with a small stand-in for `auth.users`. You do not need Docker or a Supabase project. `tests/helpers/stubs.sql` is for that suite only; do not run it on a hosted project.

## UI preview
`ENABLE_UI_PREVIEW=1` serves `/anteprima` with the example hotels and no database. It is for looking at the screens. Leave it unset everywhere else, including Vercel.

## Author
Built by [Bruno Flora](https://github.com/Brunoflor) — Naples 🇮🇹
