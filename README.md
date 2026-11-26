# Alnajaar Sheets

Online store (Arabic / English) and admin panel for Alnajaar Sheets — bedding, sheets and towels.

- **Stack:** Next.js (App Router) · Supabase (Postgres, Auth, Storage) · Vercel
- **Store:** `/ar` and `/en` — home, categories, product pages, cart, cash-on-delivery checkout
- **Admin:** `/admin` — dashboard, orders, products & stock (size × colour), image upload

## Run locally

```bash
cp .env.example .env.local   # fill in the Supabase URL and publishable key
npm install
npm run dev
```

## How orders work

Checkout calls the `place_order` database function. Prices, shipping and stock all come from the database,
never from the browser, and stock is reserved in the same transaction. Cancelling an order in the admin
puts its items back into stock.

## Admin access

1. Create a user in Supabase → Authentication → Users → **Add user**.
2. Make it an admin:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```
3. Sign in at `/admin/login`.
