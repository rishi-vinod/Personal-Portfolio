# Rishi Vinod — Personal Portfolio

A personal portfolio built with React, TypeScript, and Vite, based on a custom portfolio sketch. The design combines a dark background, oversized cream typography, orange accents, and a circular portrait area.

## Current status

The portfolio includes a hardware/software headline, an About section, and LinkedIn and GitHub contact links. The photo and project details remain placeholders; project cards open “Coming soon” dialogs. The résumé opens only in the local development server and is available on request in production builds.

### Features

- Responsive layouts for desktop and mobile.
- Home, Projects, About, and Contact sections with in-page navigation.
- Two selected-project cards with artwork from the design reference.
- Active navigation indicators, keyboard focus styles, and a skip-to-content link.
- Reduced-motion support and native dialogs.
- Spotify now playing and three favorite tracks, with server-side authorization.
- Three recent public GitHub commits, linked to the original changes.
- Floating charcoal activity panels on wide screens, inline panels on smaller screens.
- Hover/press feedback and optional tap vibration on supported browsers.

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

## Spotify and GitHub activity

The activity cards sit between the introduction and selected projects on laptops and phones. At 1680px and wider they float in reserved side gutters, leaving the portfolio content unobstructed. Spotify sits on the left; GitHub sits a little lower on the right. The original charcoal, cream, and orange palette carries through the cards. Spotify's green is reserved for its identity and live indicator.

### Connect Spotify

1. Copy `.env.example` to `.env.local` in the project root.
2. Create an app in the [Spotify developer dashboard](https://developer.spotify.com/dashboard) and put its client ID and client secret in `.env.local`.
3. Follow Spotify's [Authorization Code flow](https://developer.spotify.com/documentation/web-api/tutorials/code-flow) to authorize **your own account** with the scopes `user-read-currently-playing user-top-read`. Register the exact redirect URI used by that flow in your app settings. Put the returned refresh token in `SPOTIFY_REFRESH_TOKEN`.
4. Restart `bun run dev`. Play a song and the panel will update on its next refresh (up to 30 seconds).

Do not put these credentials in `src/`, use a `VITE_` prefix, or paste them into chat. `.env.local` is ignored by Git and blocked by Vite's file server. For deployment, configure the same values as server environment variables. Spotify's app/account eligibility and development-mode restrictions are managed in its developer dashboard.

The server follows Spotify's [token refresh flow](https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens), [currently-playing endpoint](https://developer.spotify.com/documentation/web-api/reference/get-the-users-currently-playing-track), and [top-items endpoint](https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks). “On repeat” displays three favorites from the short-term window (approximately four weeks). Track links open Spotify; this is a listening-status display, not a player or playback remote.

Without credentials, the card says the soundtrack is coming. Paused playback, no current song, empty favorites, network errors, and loading each have their own state. Podcasts and local files are omitted. Polling pauses when the page is hidden. An upstream failure clears the live indicator instead of showing stale music as current.

### GitHub

`GITHUB_USERNAME` defaults to the portfolio's existing `rishi-vinod` profile. No token is needed or sent. The server uses GitHub's [commit search API](https://docs.github.com/en/rest/search/search#search-commits), sorted by committer date, to show three distinct public commits authored by that account. This includes contributions to others' repositories. Search indexing can lag behind a push. Private repositories and commit-body text are omitted; only the first message line is returned.

### Endpoints and interactions

- `GET /api/spotify/now-playing` — current track, paused/playing/idle state; cached for 15 seconds.
- `GET /api/spotify/top-tracks` — three short-term favorites; cached for 10 minutes.
- `GET /api/github/commits` — three public commits; cached for five minutes.

All endpoints also support `HEAD`; other methods return 405. Upstream calls time out, simultaneous requests share in-flight work, and temporary failures return a sanitized 503 response cached for 30 seconds. Caches are per server process.

Hover lift, press compression, and arrow movement provide tactile visual feedback. Browsers cannot reliably provide physical haptics on hover. A “Tap feedback” toggle appears in the footer only where the Vibration API exists; actual vibration depends on the device/browser and occurs on clicks after opt-in. Reduced-motion preferences disable animation and vibration.

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
server/             Activity API, production server, and endpoint tests
.env.example        Credential template (actual values stay in .env.local)
package.json        Dependencies and development commands
bun.lock            Locked dependency versions
```

## Deployment

`bun run build` generates the frontend in `dist/`. The live activity endpoints require a server; uploading `dist/` alone will leave the cards in their unavailable states. Use Node.js 24+ and run:

```sh
bun run build
bun run start
```

The included server serves `dist/` and `/api/*` on `127.0.0.1:3000`. Set `PORT` as needed; set `HOST=0.0.0.0` in a container/hosting platform, with HTTPS handled by the hosting proxy. Deploy `server/` alongside `dist/` and the package manifest. The server has no additional runtime dependencies. Configure Spotify secrets in the host's environment. `bun run dev` and `bun run preview` use the same API handler through Vite middleware.

The production server serves only built files and activity endpoints. It never exposes the private résumé or environment files. Pushing source to GitHub alone does not publish the website; this repository does not currently include an automated deployment workflow.

The included production server assumes hosting at `/`. For a subdirectory deployment, configure Vite's `base` and the reverse proxy's frontend and API path mapping together.
