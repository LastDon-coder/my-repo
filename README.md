# Cosman Tech Academy

A static website (HTML, CSS and small JavaScript modules) with working forms and student login.
There is **no server to run or pay for**: the browser talks straight to free services.

| Feature | Service | Free tier |
|---|---|---|
| Registration emails to you, contact form | [Formspree](https://formspree.io) | Free plan, limited submissions per month |
| Registration database, student login, newsletter list | [Supabase](https://supabase.com) | Free plan |
| Spam check (CAPTCHA) | [Cloudflare Turnstile](https://www.cloudflare.com/application-services/products/turnstile/) | Free |
| Visitor analytics (no cookies) | [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/) or [Umami](https://umami.is) | Free |
| WhatsApp chat button | `wa.me` click-to-chat link | Free, no signup |
| Live chat | [Tawk.to](https://www.tawk.to) | Free plan |
| Hosting | GitHub Pages | Free |

Check each provider's pricing page for current limits before launch.

## How it fits together

```
Visitor's browser
 ├─ Registration form ──► Supabase table `registrations`   (record + dashboard)
 │                    └─► Formspree                        (email to you)
 ├─ Contact form ───────► Formspree
 ├─ Newsletter ─────────► Supabase `newsletter_subscribers` (+ Formspree notice)
 └─ Login (magic link) ─► Supabase Auth ─► dashboard.html (shows only the student's own rows)
```

Everything is optional. Leave a value blank in `js/config.js` and that feature turns itself off
with a friendly message.

---

## Setup (about 20 minutes)

### 1. Formspree (email)
1. Sign up at formspree.io, create a **New Form**, and set the notification email to yours.
2. Copy the endpoint (looks like `https://formspree.io/f/abcdwxyz`).
3. Paste it into `formspreeEndpoint` in `js/config.js`.
4. In the Formspree form settings, add your live site domain under allowed domains once you know it.

One form handles registrations, contact messages and newsletter notices. Each email has a `form_type` field.

### 2. Supabase (database + login)
1. Create a project at supabase.com.
2. **SQL Editor → New query**: paste all of `supabase/schema.sql` and **Run**.
3. **Project Settings → API**: copy the Project URL and the `anon` (publishable) key into
   `supabaseUrl` and `supabaseAnonKey` in `js/config.js`.
   The anon key is meant to be public. Row Level Security (set up by the SQL) is what protects the data.
   **Never** put the `service_role` key in this site.
4. **Authentication → URL Configuration**:
   - Site URL: your live address, e.g. `https://YOURNAME.github.io/REPO/`
   - Redirect URLs: add `https://YOURNAME.github.io/REPO/dashboard.html`
     (and `http://localhost:8000/dashboard.html` for local testing).
5. Managing students: open **Table Editor → registrations** and change `status`
   (`pending`, `confirmed`, `paid`, `cancelled`). Students see the change on their dashboard.
6. Supabase's built-in email sender is rate-limited. For real use, add free custom SMTP
   (**Authentication → SMTP Settings**), for example with Brevo, Resend or Gmail SMTP.

### 3. Turnstile spam check (optional but recommended)
1. Cloudflare dashboard → **Turnstile → Add widget**, add your domain (and `localhost` for testing).
2. Put the **site key** in `turnstileSiteKey`.
3. Put the **secret key** in Supabase → **Authentication → Attack Protection → CAPTCHA**.
   This protects the login form.

**Hardening registration (optional).** By default registrations are protected by a hidden honeypot field,
database validation and Formspree's spam filter. To make Turnstile *enforced* for registrations
(so bots calling your API directly are rejected), follow the steps at the top of
`supabase/harden.sql`, then set `strictRegistration: true`.
Note that the Formspree copy of a submission is still protected only by the honeypot and Formspree's own filter.

### 4. Analytics (optional)
- **Cloudflare Web Analytics**: Analytics & Logs → Web Analytics → Add a site → copy the token into
  `cloudflareAnalyticsToken`. It works on GitHub Pages without moving your DNS.
- **Umami** (cloud or self-hosted): fill `umami.scriptUrl` and `umami.websiteId`.

### 5. WhatsApp and live chat (optional)
- **WhatsApp**: set `whatsapp.number` in `js/config.js` (country code, or a Nigerian number starting with 0).
  A green floating button appears bottom-left on every page, and the Contact page gets a link.
  It opens a chat with your pre-written message. There is nothing to sign up for.
  Use a number that is on WhatsApp or WhatsApp Business.
- **Tawk.to**: create a free account and a property, then **Administration → Channels → Chat Widget**
  and copy the embed link `https://embed.tawk.to/PROPERTY_ID/WIDGET_ID` into `tawk.propertyId` and `tawk.widgetId`.
  The widget sits bottom-right and loads after the visitor first scrolls or taps, so it doesn't slow the page.
  In Tawk.to, add your site domain under the widget's allowed domains.

### 6. Payments (optional)
Create payment links in Paystack or Flutterwave (no code needed), then paste them into `paymentLinks`
in `js/config.js`. Students see a "Pay now" button after registering. Note that the link alone does not
mark a student as paid. You still update `status` in Supabase after checking the payment.

### 7. Deploy to GitHub Pages
1. Create a GitHub repository and push this folder to the `main` branch.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` now runs `.github/workflows/pages.yml` and publishes the site.
   Only the website files are published; `supabase/` and this README stay in the repo.
4. Custom domain: Settings → Pages → Custom domain, then update the Supabase Site URL and redirect URLs.

## Run locally
```bash
python3 -m http.server 8000
# open http://localhost:8000
```
JavaScript modules do not work from `file://`, so use a local server as above.

## Project layout
```
index.html topic.html register.html contact.html
login.html dashboard.html privacy.html 404.html
style.css
js/
  config.js        <- the only file you edit to connect services
  lib.js           shared helpers
  site.js          analytics, nav, newsletter (every page)
  chat.js          WhatsApp button + Tawk.to loader
  register.js  login.js  dashboard.js  contact.js
  vendor/supabase.js   vendored supabase-js 2.45.4 (no CDN needed)
supabase/schema.sql  supabase/harden.sql
.github/workflows/pages.yml
```

## Before you launch
- Fill in the bracketed items in `privacy.html` (you collect personal data, so keep it accurate;
  consider Nigeria's NDPA requirements).
- Test the full flow once with your own email: register, check the Formspree email, check the
  Supabase row, log in, check the dashboard.
- Run Supabase **Advisors** (Database → Advisors) and confirm there are no RLS warnings.

## More free tools worth considering
- **Brevo** (free email tier): newsletters and Supabase SMTP.
- **Cal.com** or **Calendly** free plan: book free intro calls.
- **Giscus**: comments on topic pages via GitHub Discussions.
- **Uptime Kuma / UptimeRobot** (free tier): get alerted if the site goes down.
- **Cloudinary** or **ImageKit** free tiers: host and resize course images.
