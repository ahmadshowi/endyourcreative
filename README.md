# END. YOURCREATIVE — studio website

Single-page site for END. YOURCREATIVE, a creative digital studio. Built with Vite and plain
HTML/CSS/JS (no framework), plus one Vercel serverless function for the inquiry form.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173 — the inquiry API runs locally too
npm run build     # production build in dist/
npm run preview   # serve the build
```

## Deploy (Vercel)

Import the folder/repo in Vercel. It detects Vite automatically (build `npm run build`,
output `dist`) and deploys `api/inquiry.js` as a serverless function. Then add the
environment variables below in **Project → Settings → Environment Variables** and redeploy.

## Configure before launch

| Variable | Where | What it does |
| --- | --- | --- |
| `VITE_WHATSAPP_NUMBER` | public | Studio WhatsApp number, digits only, e.g. `6281234567890`. Empty = WhatsApp opens with the message pre-filled and the visitor chooses the contact. |
| `SITE_URL` | build | Final domain for canonical / Open Graph tags. |
| `RESEND_API_KEY` | server | [Resend](https://resend.com) API key used to email inquiries. |
| `INQUIRY_TO_EMAIL` | server | Inbox that receives inquiries (comma-separate for several). |
| `INQUIRY_FROM_EMAIL` | server | Sender on a domain verified in Resend, e.g. `END. YOURCREATIVE <hello@yourdomain.com>`. |

Until `RESEND_API_KEY` and `INQUIRY_TO_EMAIL` are set, the form still validates, and on
submit tells the visitor it couldn't send and offers a WhatsApp link with their inquiry
already written out — nothing is lost.

## Structure

```
index.html                 All page content (static, so it's indexable and works without JS)
src/main.js                Entry: fonts, styles, behaviour modules
src/config.js              WhatsApp + form endpoint settings
src/modules/nav.js         Mobile menu, sticky header, current-section highlight
src/modules/reveal.js      One-time scroll reveals for [data-reveal]
src/modules/parallax.js    Gentle drift of project artwork (off for reduced motion)
src/modules/inquiry-form.js  Validation, submit states, WhatsApp fallback
src/styles/                tokens · base · header · hero · work · sections · contact
api/inquiry.js             Server validation + email via Resend's HTTP API
public/brand/              Logo, "END." mark (ink + cream), extracted from the original logo
public/work/               Project cover artwork (SVG)
```

## Adding a project

Copy one `<article class="case">` block in `index.html`. Alternate `case--a` (wide, story on
the right) and `case--b` (tall, story on the left) so the layout keeps its rhythm. Put the
cover in `public/work/` — a real screenshot (`.webp`, ~1600px wide) works as well as an SVG.

## Design notes

- Palette is one family of browns on ivory, sampled from the logo (`#7C523A`).
- Bodoni Moda (display) + Jost (text), self-hosted via Fontsource; only Latin subsets download.
- The hero's three lines are each led by a blade from the logo's "E"; the same blade reappears
  on service hover and in the open project slot.
- All motion respects `prefers-reduced-motion`.
