# Phase 1 security audit — November 1, 2026

## Scope and initial findings

Before application edits, inspected package.json, source/content locations,
public/, ignored private-file paths, git status, git ls-files, and
git log --all --stat. Reviewed patches and scanned every file snapshot in all
six reachable commits, including deleted historical files. The repository had
pre-existing modified and untracked work; it was preserved.

- No live API key, token, password, private key, personal contact email, phone
  number, or street address was detected in reachable committed file contents.
- No PDF, DOCX, private directory, or real .env file was present in those
  commits. The committed .env.example had blank secret fields.
- Commit author metadata contains the user's GitHub noreply email address.
  This identifying metadata remains in history.
- Commit f7e23fa contains dummy Spotify credential/token fixtures in
  server/activity.test.ts; these are test strings, not detected live secrets.
- The ignored .env.local contains a recipient email. Its credential fields
  were empty. Private values were not printed, copied, or modified.
- The ignored .private/resume.pdf exists locally (119,596 bytes). It was not
  found in tracked files or reachable history, and remains untouched.
- public/ contains three SVGs; no résumé or private file was found there.
- The previous app could serve the local PDF through a Vite middleware route
  and load an external Cloudflare script through BotCheck. Those integrations
  are no longer imported or mounted by the active Phase 1 app.

Deleting a file from today's tree would not erase an earlier commit.
No history was rewritten. These findings cover locally reachable refs, not
unavailable remote refs, deleted/unreachable objects, or every possible secret
format. Pattern scans cannot prove the absence of arbitrary sensitive data.

## Phase 1 controls

- .gitignore covers .env, .env.*, the .env.example exception, node_modules,
  dist, .DS_Store, *.pem, *.key, private/, .private/, *.pdf, and *.docx.
- .env.example contains only comments, a placeholder endpoint example, and a
  blank VITE_CONTACT_ENDPOINT. No private recipient or credential is included.
- The active app has no network calls, storage writes, analytics, external
  scripts, font requests, mailto links, or PDF links/viewers.
- Identity is held only in React memory. Custom designations are trimmed,
  capped at 40 characters, and rendered as text. Refresh resets identity.
- The legacy API/PDF Vite plugins were disconnected. Vite's file-deny list
  includes env files, private directories, private keys, PDF/DOCX originals,
  and the legacy snapshots.
- The new favicon is an authored SVG with no EXIF, GPS, embedded raster, or
  other metadata. No raster images were added or modified. The image-signature
  scan found no EXIF/XMP/GPS signatures in the existing tracked raster assets;
  this is not an exhaustive metadata-parser audit.
- public/ is not copied into the Phase 1 output. Only the app's imported
  favicon, JS, CSS, and HTML ship.

## Verification results

- **Build PASS:** bun run build (TypeScript plus Vite).
- **Lint PASS:** bun run lint.
- **Content PASS:** both About paragraphs match the original working copy
  verbatim. Original placeholder project descriptions and alt text match too.
  The original application/config are preserved in docs/legacy; the private
  résumé and fuller server/resume-faq.ts summaries were not edited.
- **Browser PASS:** number-key recruiter selection; greeting; keyboard menu
  expansion, End/Enter navigation; MENU → ABOUT → MENU; all three locked
  records and return commands; Escape skips BOOT; custom HTML-looking text
  appears literally with surrounding spaces trimmed.
- **Responsive PASS:** 320px-wide menu checked visually and by DOM widths,
  without horizontal overflow.
- **Transition PASS:** both clipped DOM layers and the canvas seam observed
  during navigation; accessibility tree/input hidden while loading; destination
  heading receives focus after completion.
- **Reduced-motion logic PASS:** ignored local browser harness simulates
  matchMedia's reduced-motion result. BOOT completes immediately; Anonymous
  greeting, menu, and About navigate without a canvas; About text is complete
  with no typewriter skip control. The actual OS motion setting was not changed.
- **Console:** no warnings/errors observed in the normal navigation checks.
- **Sensitive scan PASS with reviewed fixtures:** python3 scripts/security_scan.py
  checks tracked working files, nonignored new files, every reachable commit,
  and all dist output, including the retained old build. It also checks for
  exact private values from .env.local without displaying them.
  No high-confidence credential, private-key, private-file, or private-config
  exposure was found. Matches were example email fixtures and dummy test
  credentials in existing legacy files/history, plus an example email in the
  retained old build. The Phase 1 build had no sensitive-pattern findings.

## Files retained for the user's cleanup decision

Nothing was deleted. These paths need attention before a final public release:

1. **.private/resume.pdf:** move it outside the repository or remove it yourself
   to satisfy the final “no PDF anywhere in the repo” requirement. It is ignored
   and unserved, but still physically present. Phase 1 did not convert it.
2. **Old dist output outside dist/phase-1/:** obsolete build containing the old
   UI and external-script integration. Publish only dist/phase-1/, never all
   of dist/. It was retained because deletion was prohibited.
3. **Legacy integration files:** src/components/BotCheck.tsx,
   src/components/ContactHub.tsx, src/components/ContactHub.css,
   src/components/GitHubPanel.tsx, src/components/ActivityPanels.css,
   src/hooks/useActivity.ts, src/hooks/useHaptics.ts, and the old server/API
   files are inactive in the Phase 1 app. They can be retired after reviewing
   the pre-existing work. Preserve server/resume-faq.ts content for Phase 2.
   The old bun run start command still launches the legacy server; use dev
   or preview for this phase.
4. **Unused public and template artwork:** public/favicon.svg, public/icons.svg,
   public/rv-favicon.svg, src/assets/react.svg, src/assets/vite.svg, and
   src/assets/hero.png are not shipped by this build. They can be reviewed for
   later removal. Existing project artwork remains available for Phase 2.

No dependencies were installed. No files were staged, committed, pushed, or
deleted, and no other git-state-changing commands were run.
