# Phase 1 handoff

Implemented November 1, 2026. Phase 2 has not been implemented.
The exact user design section is in DESIGN.md.

## Run and publish

- Use the installed dependencies: `bun run dev`.
- `bun run build` creates **dist/phase-1/**. `bun run preview` serves it.
- Publish only **dist/phase-1/**. The prior dist output remains untouched.
- `bun run start` is the preserved legacy server, not this phase's entry point.
- No packages were added. No files were deleted, staged, committed, or pushed.

## Implementation

- App.tsx: BOOT, IDENTIFY, GREETING, MENU, ABOUT, and locked record screens.
- content.ts: the original About paragraphs and placeholder project data.
- useScreenTransition.ts: reusable transitionTo(nextScreen), guarded against
  concurrent navigation; reduced-motion navigation is immediate.
- PixelTransition.tsx: clipped live DOM layers plus a 1,080 ms canvas seam.
  Cells are 18px normally and grow on very large viewports to keep the entire
  grid below 6,000 cells. Only three seam rows per column are drawn.
  ResizeObserver updates geometry; completion/unmount cancels animation,
  removes event listeners, releases the input lock, and restores focus.
- Typewriter.tsx: initial/line pauses, skip button, Escape, and any-key BOOT
  skip. Reduced motion shows complete text. Assistive technology gets complete
  paragraphs rather than per-character announcements.
- TerminalMenu.tsx: native buttons with menu semantics, expansion state,
  arrow keys, Home/End, Enter/Space, Escape, Tab/Shift+Tab, and letter matching.
- Identity is React memory only, resets on reload, and is never sent, stored,
  or logged. Custom text is trimmed and capped at 40 characters and rendered
  through React text nodes. All views share the same access.
- Three CSS colors, system monospace, square controls, no external assets.
- Vite no longer mounts the API or local PDF middleware. publicDir is disabled;
  only imported assets ship. The new favicon is a metadata-free authored SVG.

## Existing content and work

The pre-edit working copies of App.tsx and vite.config.ts are preserved in
docs/legacy as text snapshots, including the user's uncommitted changes.
The two About paragraphs were checked verbatim against the snapshot.
Project labels, original descriptions, and alt text are retained in content.ts.
Project images and all other existing files are still present.
Fuller existing project/résumé descriptions remain unchanged in
server/resume-faq.ts. The original private résumé remains untouched.
The README's prior instructions were retained below a Phase 1 notice.

## Phase 2 boundaries

PROJECTS, RESUME, and CONTACT show only [ RECORD LOCKED ] and a return command.
Use the existing content without rewriting it. Implement expandable records,
an image-only résumé with zoom, and the hosted-endpoint contact form per DESIGN.md.
VITE_CONTACT_ENDPOINT is a blank public placeholder, not currently read or used
by a form. Configure the recipient solely in the hosted service dashboard.
Do not restore legacy Resend/Turnstile/GitHub integration.
Do not add original PDF/DOCX files or metadata-bearing images.

## Verification

Build, lint, browser checks, content comparison, and privacy-scan results are
recorded in SECURITY-AUDIT.md. The optional .verification/ directory contains
ignored local test fixtures only and is excluded from the build.
