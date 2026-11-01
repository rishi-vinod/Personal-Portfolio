### Theme: retro green military database
- One hue only: flat phosphor green on near-black. Use 2-3 flat tones max
  (background, primary green, dim green) as CSS variables.
- STRICTLY NO: rounded corners (border-radius 0 everywhere), box-shadow,
  text-shadow/glow, gradients, blur/backdrop-filter, translucent glass panels,
  neon colors, emoji, icon libraries, or card-style boxes.
- Monospace font only. Borders are flat 1px lines or ASCII-drawn (+--+, ===).
  Headers in caps, e.g. "DATABASE ACCESS // CLEARANCE: RECRUITER". Dry,
  archive-system copy. Blinking block cursor.
- It must look like a real mainframe/records terminal, not a themed website
  template.

### Flow (state machine)
BOOT -> IDENTIFY -> GREETING -> MENU -> (PROJECTS | RESUME | ABOUT | CONTACT)
and every view can return to MENU.

1. BOOT: blank screen, blinking cursor, typewriter text:
   "Ah, we have a visitor..."  (pause)
   "Please identify yourself as one of the following..." (pause)
   Options: [1] Friend  [2] Family  [3] Recruiter  [4] Anonymous  [5] Someone else
   Selectable by click, arrow keys + Enter, or number keys.
   Any key / Esc / a visible SKIP control finishes the typing instantly
   (recruiters shouldn't have to wait).
2. IDENTIFY -> GREETING: "Hello, friend." / "Hello, family." / "Hello, recruiter."
   Anonymous: "Identity withheld. Access granted anyway."
   Someone else: prompt "State your designation:", then "Hello, <typed text>."
3. MENU: two flat custom dropdowns (real <button>, aria-expanded, full keyboard
   support):
   - "ACCESS RISHI'S DATABASE": PROJECTS, RESUME, ABOUT
   - "OTHER ACTIONS": CONTACT
4. Every screen change uses the pixel-flip transition below, including going
   back to the menu.

### Pixel-flip transition (the centerpiece; build it as a reusable
### transitionTo(nextScreen))
- A wave front sweeps from the top of the viewport to the bottom in about
  900-1200ms, with a slightly wavy edge so it reads as a ripple.
- Along the front is a band of square cells (about 14-20px; keep the total cell
  count under about 6,000). Each cell rapidly flips between "0" and "1" glyphs
  in flat green, with small random per-cell timing jitter so it looks like
  individual pixels flickering, not a smooth wipe.
- Above the front is the new screen. Below it is the old screen.
  Suggested approach: both screens are real DOM layers, clipped at the front
  with clip-path, and a canvas draws only the flickering band at the seam. No
  html2canvas or other libraries without asking me.
- Use requestAnimationFrame and clean up on completion. Ignore input while a
  transition is running. Handle resize.
- Respect prefers-reduced-motion by switching screens instantly.

### Views (content stays exactly as it is today)
- ABOUT: existing about text, typed in.
- PROJECTS: existing projects shown as flat "records" (RECORD 001, etc.), each
  expandable in place. Same info, different presentation.
- RESUME: displayed as an IMAGE only. No download link or button, no PDF viewer
  or embedded PDF, and no PDF anywhere in the repo or public/. Image goes in a
  flat frame with alt text, with an in-page zoom option.
- CONTACT: a terminal-style form (name, reply-to email, message). Client-side
  validation, length caps, a hidden honeypot field, and a short cooldown after
  sending. It POSTs to an endpoint URL read from VITE_CONTACT_ENDPOINT, from a
  hosted form service like Formspree, where my email is configured in the
  service's dashboard and not in code. States: idle, TRANSMITTING, SENT, ERROR.
  If no endpoint is configured, show "CHANNEL OFFLINE". No mailto link, no
  backend that needs SMTP credentials.
- Responsive down to phone width. Keyboard accessible. Include a <noscript>
  fallback and a proper <title>/meta description.
