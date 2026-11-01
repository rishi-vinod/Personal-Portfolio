# Rishi Vinod — Personal Portfolio

> **Phase 1 redesign (November 1, 2026):** The active app is now the green
> terminal archive. Run `bun run dev`, or `bun run build` followed by
> `bun run preview`. The new build is in **`dist/phase-1/`**; publish only that
> directory. Existing `dist/` files were retained to honor the no-deletion rule.
> The old `bun run start` server serves the previous build and is not used for
> this phase. The legacy setup instructions below are retained as historical
> documentation, not current setup guidance.
>
> See [the exact design spec](docs/DESIGN.md), [Phase 1 handoff](docs/PHASE-1.md),
> and [security audit](docs/SECURITY-AUDIT.md). PROJECTS, RESUME, and CONTACT are
> locked placeholders. No contact request, activity request, external script,
> or PDF route is active. The only future client configuration is the public
> `VITE_CONTACT_ENDPOINT` placeholder in `.env.example`.

A personal portfolio built with React, TypeScript, and Vite, based on a custom portfolio sketch. The design combines a dark background, oversized cream typography, orange accents, and a circular portrait area.

## Current status

The portfolio includes a hardware/software headline, an About section, and LinkedIn and GitHub contact links. The photo and project details remain placeholders; project cards open “Coming soon” dialogs. The résumé opens only in the local development server and is available on request in production builds.

### Features

- Responsive layouts for desktop and mobile.
- Home, Projects, About, and Contact sections with in-page navigation.
- Two selected-project cards with artwork from the design reference.
- Active navigation indicators, keyboard focus styles, and a skip-to-content link.
- Reduced-motion support and native dialogs.
- Three recent public GitHub commits, linked to the original changes.
- A floating charcoal GitHub panel on wide screens, placed inline on smaller screens.
- Hover/press feedback and optional tap vibration on supported browsers.
- A contact form with email delivery, bot verification, and submission limits.
- Résumé FAQs with prepared answers, suggested questions, and an explicit fallback for unknown details.

## Run locally

Use Bun as the package manager; the repository includes a `bun.lock` lockfile. Install Node.js compatible with the project's Vite version as well, since the package scripts invoke Node-based tools.

From the repository folder:

```sh
bun install --frozen-lockfile
bun run dev
```

Open the **Local** URL printed in the terminal, usually `http://localhost:5173/`. Keep the terminal process running while viewing the site. Press `Ctrl+C` to stop it.

**Do not open `index.html` directly using a `file://` URL.** Vite must process the React and TypeScript source before the browser can display the portfolio. The HTML file includes a reminder when opened directly.

## Build and check

```sh
# Type-check and create a production build in dist/
bun run build

# Serve the production build locally after building
bun run preview

# Run ESLint
bun run lint

# Test the activity endpoints (mocked upstream services, no credentials needed)
bun run test
```

The preview command prints its own local URL. It is intended for checking the built site locally.

## GitHub activity

The GitHub card sits between the introduction and selected projects on laptops and phones. At 1680px and wider it floats in a reserved right gutter, leaving the portfolio content unobstructed. The original charcoal, cream, and orange palette carries through the card.

No credentials or paid subscription are required. To change the profile, copy `.env.example` to `.env.local`, set `GITHUB_USERNAME`, and restart the server.

`GITHUB_USERNAME` defaults to the portfolio's existing `rishi-vinod` profile. No token is needed or sent. The server uses GitHub's [commit search API](https://docs.github.com/en/rest/search/search#search-commits), sorted by committer date, to show three distinct public commits authored by that account. This includes contributions to others' repositories. Search indexing can lag behind a push. Private repositories and commit-body text are omitted; only the first message line is returned.

### Endpoint and interactions

- `GET /api/github/commits` — three public commits; cached for five minutes.

The endpoint also supports `HEAD`; other methods return 405. Upstream calls time out, simultaneous requests share in-flight work, and temporary failures return a sanitized 503 response cached for 30 seconds. Caches are per server process.

Hover lift, press compression, and arrow movement provide tactile visual feedback. Browsers cannot reliably provide physical haptics on hover. A “Tap feedback” toggle appears in the footer only where the Vibration API exists; actual vibration depends on the device/browser and occurs on clicks after opt-in. Reduced-motion preferences disable animation and vibration.

## Contact form and résumé FAQ

The Contact section has “Send a message” and “Ask about my background” views. The FAQ uses fixed professional summaries in `server/resume-faq.ts`, checked against the local résumé on October 28, 2026. It matches questions to topics, not a general-purpose AI model; it requires no paid AI service. Unknown topics, availability, salary, GPA, and personal contact details get a fallback inviting visitors to contact Rishi. Update the summaries when the résumé changes. No PDF is read or exposed at request time, and no questions are sent to an AI provider.

### Enable email delivery

The recipient is configured in the ignored `.env.local` file. Never put API secrets or the private recipient address in frontend code. The form remains disabled until all delivery and bot-check settings are present.

1. Create a [Resend](https://resend.com/docs/send-with-nodejs) account, verify a sender domain, and create a sending API key. Set `RESEND_API_KEY` and `CONTACT_FROM_EMAIL` to a verified sender's plain email address. `CONTACT_TO_EMAIL` is your receiving inbox. The visitor's address is used only as Reply-To; visitors cannot change the recipient or sender.
2. Create a [Cloudflare Turnstile widget](https://developers.cloudflare.com/turnstile/get-started/), allow the website's hostname, and set `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. The site key is public; the secret stays on the server. The form uses action `contact`, and the server checks both the hostname and action in the verification result.
3. Set `SITE_ORIGIN` to the exact browser origin with no trailing slash, e.g. `https://example.com` or `http://127.0.0.1:5173` for development. Restart the server. For `bun run preview` or the production server, use that server's actual browser origin.
4. Configure the same variables on the deployment host. Send a test through the form and check the receiving inbox before launch. Automated tests use mocked providers and send no real email.

Email delivery uses [Resend's send endpoint](https://resend.com/docs/api-reference/emails/send-email) and [idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys) so retries of the same submission do not send duplicate emails. A success response means Resend accepted the message, not that inbox delivery is guaranteed. Provider errors retain the draft and show an error. Messages are sent as plain text, and message contents are not logged or stored by this app.

### Spam protection

- Server-verified, single-use [Turnstile tokens](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) are required for every send. Browser-only bot checks are not trusted.
- Five contact submission attempts per IP per 15 minutes; three verified delivery attempts per sender email per hour; 100 bot-check attempts and 50 delivery attempts per hour across the process.
- Honeypot field, strict JSON validation, 16 KB request limit, 3,000-character messages, short request/provider timeouts, and same-origin browser checks.
- FAQ requests are limited to 30 per IP per minute, with questions capped at 300 characters.

Limits use a bounded in-memory store in one server process and reset when it restarts. Behind a single trusted reverse proxy that overwrites/appends `X-Forwarded-For`, set `TRUST_PROXY=1`; otherwise leave it off. The app takes only the rightmost forwarded address in that mode. Do not expose the origin directly with proxy trust enabled. For multiple instances or serverless hosting, add a shared persistent rate limiter or equivalent edge rules before launch. These controls reduce spam; they do not prove that two different IPs or email addresses belong to different people.

### Endpoints

- `GET /api/contact` — availability and public bot-check site key; never the recipient or secrets.
- `POST /api/contact` — `{ name, email, message, website, token, requestId }`; `website` is the empty honeypot and `requestId` is a UUID reused for unchanged retries. Returns 202 only after the email provider accepts the message.
- `GET /api/resume/questions` — suggested questions.
- `POST /api/resume/questions` — `{ question }`; returns a matching prepared answer and project links, or an explicit fallback.

Both routes support `HEAD`; unsupported methods return 405. Validation failures return 400/413/415, cross-origin browser requests 403, exhausted limits 429 with `Retry-After`, and unavailable configuration/providers 503.

## Customize the portfolio

- **Content and interactions:** Edit `src/App.tsx` to update text, the `projects` array, your portrait, and public profile links.
- **Layout:** Edit `src/App.css` for section layouts, responsive breakpoints, and component styles.
- **Theme:** Edit `src/index.css` for colors, fonts, and global styles.
- **Images:** Add imported artwork and photos to `src/assets/`.
- **Static files:** Place only files intended for public distribution in `public/`. Do not put the private résumé here.
- **Page metadata:** Update the title and description in `index.html`. The portfolio favicon is `public/rv-favicon.svg`.

Files included in the website, including anything in `public/`, are accessible to visitors after deployment. Only include information you intend to publish.

## Private résumé

Keep the local résumé at `.private/resume.pdf`. This directory and PDF files are ignored by Git. Do not force-add private files.

During `bun run dev`, the Résumé link opens the PDF through a dedicated local endpoint. The endpoint accepts only loopback requests with a local hostname and rejects cross-origin requests. Vite's ordinary file-serving routes are blocked from reading `.private/`.

The PDF is not imported by the app, copied to `dist/`, or served by the production preview. Production visitors see a message directing them to LinkedIn to request a résumé. A fresh clone will not contain the document; supply your own local copy to enable the development link.

## Project structure

```text
public/             Static assets, including the portfolio favicon
src/
  assets/           Project artwork and other imported assets
  App.tsx           Portfolio sections, content, and dialogs
  App.css           Layout and component styles
  index.css         Global styles and theme
  main.tsx          React entry point
index.html          Page metadata and application entry
vite.config.ts      Vite configuration
server/             Activity, contact, and résumé FAQ APIs; production server; endpoint tests
.env.example        Optional GitHub profile and server-only email/bot-check settings
package.json        Dependencies and development commands
bun.lock            Locked dependency versions
```

## Deployment

`bun run build` generates the frontend in `dist/`. GitHub activity, message delivery, and résumé answers require a server; uploading `dist/` alone does not provide these APIs. Use Node.js 24+ and run:

```sh
bun run build
bun run start
```

The included server serves `dist/` and `/api/*` on `127.0.0.1:3000`. Set `PORT` as needed; set `HOST=0.0.0.0` in a container/hosting platform, with HTTPS handled by the hosting proxy. Deploy `server/` alongside `dist/` and the package manifest. The server has no additional runtime dependencies. `bun run dev` and `bun run preview` use the same API handler through Vite middleware.

The production server serves only built files and activity endpoints. It never exposes the private résumé or environment files. Pushing source to GitHub alone does not publish the website; this repository does not currently include an automated deployment workflow.

The included production server assumes hosting at `/`. For a subdirectory deployment, configure Vite's `base` and the reverse proxy's frontend and API path mapping together.
