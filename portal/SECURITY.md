# Client Portal security guide

## What the portal now does for you

| Threat | Protection | Where it is enforced |
|---|---|---|
| **Password guessing** | After 5 wrong attempts the form locks for 30 s, then 1 min, 2 min, 4 min... up to 1 hour. Failed answers always take about the same time and say only "Wrong email or password." | Your browser (portal), plus Supabase's own sign-in rate limits (below) |
| **Bots and automated attacks** | Hidden honeypot field that people never see; optional **CAPTCHA** (Cloudflare Turnstile) that Supabase checks on its servers | Browser + Supabase |
| **Account discovery** | "Email me a link" and "Forgot password" always give the same reply whether or not the email has an account; sign-ups are switched off | Portal + Supabase |
| **Stolen password** | **Two-step verification** (authenticator app). Once the admin enrols, the database refuses all admin reads and writes unless the 6-digit code was entered | Database rule (`is_admin()`) |
| **Left-open or stolen sessions** | Auto sign-out after 15 min idle (admin) or 30 min (clients), 8 h / 12 h maximum, a 60-second warning, sign-out across all open tabs, and a **Sign out of all devices** button | Browser; global sign-out is enforced by Supabase |
| **SQL injection** | The portal never builds SQL text. Every request goes through Supabase's API as parameters, so typed text can never become a command. On top of that: row-level security on every table, length and size limits in the database, and strict page rules (CSP) that block injected scripts | Supabase + database |
| **Password storage ("hashing")** | Passwords are **hashed with bcrypt by Supabase on its servers** and never stored or shown in readable form, not even to you. Hashing in the browser would be less safe, so the portal deliberately does not do it | Supabase |
| **Weak passwords** | 10+ characters with a letter and a number, no obvious words, nothing containing the email name | Portal (set Supabase's minimum too, below) |
| **Cross-site scripting / clickjacking** | All text is inserted as plain text (never as HTML); strict CSP, frame blocking and other headers in `_headers` | Browser + Netlify |
| **One client reading another's data** | Row-level security: each client can only read their own rows and files; files sit in private folders and download through links that expire after 60 s | Database |

## Do these once in Supabase (Authentication settings)
1. **Sign In / Providers > Email**: keep "Allow new users to sign up" **off**. Set **Minimum password length** to 10 or more.
2. **Rate Limits**: keep the defaults or lower them (sign-ins per hour per IP). This is the real, server-side brake on password guessing.
3. **Attack Protection > CAPTCHA**: choose **Cloudflare Turnstile** (free), create a site at cloudflare.com > Turnstile with your domain `pinchezmedia254.netlify.app`, paste the **secret key** in Supabase, and the **site key** into `portal/config.js` as `TURNSTILE_SITE_KEY`. Supabase then rejects sign-ins without a valid check, even if someone bypasses the page.
4. **Multi-Factor**: leave TOTP enabled (it is by default).
5. **Sessions** (Pro plan only): you can add server-side "time-box" and "inactivity timeout", and "Enforce single session per user" (one device at a time). The free plan uses the browser limits above.
6. **SMTP Settings**: add your own email sender so sign-in and reset emails are reliable.
7. **Leaked-password protection** (Pro plan): rejects passwords found in known breaches.

## Do these today
1. Run `portal/schema-update.sql` in the SQL Editor (documents + limits + admin two-step rule).
2. Deploy, sign in, open **Admin console > Security** and **Set up two-step verification**. Scan the QR code with Google or Microsoft Authenticator and enter the code. **Save the key** shown under the QR in your password manager as a backup, because losing the phone without it locks you out of admin data (recovery then needs the SQL editor).
3. Use a long, unique admin password and turn on two-factor for your **Supabase, Netlify and GitHub** accounts too. Those accounts control everything.
4. Never put the `service_role` key anywhere on the website.

## Honest limits
- The attempt lockout lives in the browser, so a determined attacker can skip it by calling the API directly. That is why the Supabase rate limits and CAPTCHA matter, and why two-step verification is the strongest protection.
- Free-plan Supabase cannot enforce idle timeouts or one-device-only sessions on the server.
- The Supabase script loads from a CDN pinned to one version. Adding an integrity hash is a possible further step.
- Netlify's free plan has no web-application firewall. Watch **Supabase > Logs > Auth** for repeated failed sign-ins.
