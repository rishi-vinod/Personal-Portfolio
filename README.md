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
```

The preview command prints its own local URL. It is intended for checking the built site locally.

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
package.json        Dependencies and development commands
bun.lock            Locked dependency versions
```

## Deployment

`bun run build` generates the static site in `dist/`. Deploy that folder with a static hosting service. Pushing the source code to GitHub alone does not publish the website; this repository does not currently include an automated deployment workflow.

If hosting under a subdirectory, configure Vite's `base` and check asset URLs before deploying.
