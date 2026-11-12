# Client Portal setup (about 20 minutes, no coding)

The portal is already built. It needs a free database to store logins, projects, invoices and files. These steps connect it. Until you finish them it runs in **demo mode** with sample data (`client@demo.test` / `demo1234`, `admin@demo.test` / `admin1234`).

## 1. Create the database (Supabase, free plan)
1. Go to https://supabase.com, sign up and click **New project**. Name it `pinchezmedia254-portal`, choose a strong database password (save it in a password manager) and the region closest to you (Frankfurt or London).
2. Turn on two-factor sign-in for your Supabase account (Account > Security).

## 2. Build the tables and security rules
1. In Supabase open **SQL Editor > New query**.
2. Open `portal/schema.sql` from this package, copy everything, paste it, and click **Run**. You should see "Success". It is safe to run again later.

## 3. Lock sign-ups so only you can create clients
1. **Authentication > Providers > Email**: switch **off** "Allow new users to sign up". Leave "Email" enabled.
2. **Authentication > URL Configuration**: set **Site URL** to `https://pinchezmedia254.netlify.app` and add these **Redirect URLs**:
   - `https://pinchezmedia254.netlify.app/portal/app.html`
   - `https://pinchezmedia254.netlify.app/portal/app.html?reset=1`

## 4. Create your own admin login
1. **Authentication > Users > Add user > Create new user**: your email, a strong password, tick **Auto Confirm User**.
2. **SQL Editor**, run (use your email):
   ```sql
   update public.profiles set role = 'admin' where email = 'sirpeterbaraka@gmail.com';
   ```

## 5. Connect the website to the database
1. **Project Settings > API**: copy the **Project URL** and the **anon public** key.
2. Open `portal/config.js` and set:
   - `MODE: 'supabase'`
   - `SUPABASE_URL: 'https://xxxx.supabase.co'`
   - `SUPABASE_ANON_KEY: '...the anon public key...'`
   - your real `PAYMENT` details (M-Pesa, bank, PayPal), which clients see under "How to pay".
3. The anon key is meant to be public. **Never paste the `service_role` key anywhere in the website.**

## 6. Deploy
Unzip this package over your project folder (keep your other folders), then:
```
git add -A
git commit -m "Add client portal"
git push
```
Netlify publishes it in about a minute. Open `https://pinchezmedia254.netlify.app/portal/` and sign in with your admin login. You land in the **Admin console**.

## 7. Add your first client
1. Supabase: **Authentication > Users > Add user** with the client's email and a temporary password, tick **Auto Confirm User**. Send them the portal link and password (they can change it under Account, or use "Forgot password").
2. In the Admin console, **Clients** tab: the client appears automatically. Click **Edit** and set their name, company and phone.
3. **Projects > New project**: pick the client, service, status and progress, then add milestones and post updates as work moves.
4. **Billing > New invoice**: type a service name to pull its rate-card price, add discount or VAT if needed. **Record payment** whenever money arrives; balances and statuses update by themselves.
5. **Files > Upload**: quotations, agreements, receipts, guides and finished work. Clients download through private links that expire after one minute.

Test everything once with a dummy client account before inviting real clients.

## Day-to-day
- Update a project's progress and milestones weekly, and post a short update. It is the main reason clients log in.
- Record each payment the same day; the Overdue badge and next-reminder cues depend on it.
- Back up regularly: Supabase **Database > Backups** (check what your plan includes) and download important files.
- Free plans have limits (inactivity pausing, email sending rate). Check the current limits on Supabase's pricing page. For reliable password and sign-in emails, add your own SMTP provider under Authentication > SMTP Settings.

## Troubleshooting
| Symptom | Fix |
|---|---|
| "Portal is not connected yet" | `config.js` still has the `YOUR-...` placeholders, or `MODE` is not `'supabase'` |
| Sign-in says wrong email or password | Create the user in Supabase first (sign-ups are off on purpose) and tick Auto Confirm |
| Signed in but the admin console bounces to the client page | Run the `update public.profiles set role = 'admin'...` SQL for your email |
| Client sees no projects | The project's client must be that client (check the Client dropdown) |
| Files will not download | The file must be uploaded through the Admin console (it stores the client's folder path); re-upload |
| Magic link or reset email does not arrive | Check spam; confirm the Redirect URLs in step 3; consider custom SMTP |

## Privacy and safety notes
- Each client can only read their own rows (database "row level security"), and files sit in a private folder per client.
- The portal pages are marked `noindex` and are blocked in `robots.txt`; `_headers` adds strict security headers.
- It stores client names, contacts, project details, invoices and files, so keep the Privacy Policy page up to date (this package updates it) and delete a client's data on request (delete the client's user in Supabase; their rows are removed with it).
