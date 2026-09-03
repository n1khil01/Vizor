---
name: Vizor for Advisors
description: A ruled-ledger dashboard where a rationed three-color state grammar — maroon, gold, ink — is the only status law.
colors:
  maroon:
    value: "#8c1d40"
  maroon-ink:
    value: "#5c1129"
  gold:
    value: "#ffc627"
  gold-ink:
    value: "#7a5b00"
  ink:
    value: "#17140d"
  ink-soft:
    value: "#4a4536"
  ink-faint:
    value: "#837c65"
  paper:
    value: "#f6f2e9"
  paper-raised:
    value: "#fbf9f3"
  rule:
    value: "#ddd4bd"
  rule-strong:
    value: "#b9ac83"
typography:
  display:
    fontFamily: "var(--font-sans), Archivo, ui-sans-serif, sans-serif"
    fontSize: "clamp(2.75rem, 6vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.03
    letterSpacing: "-0.01em"
  display-accent:
    fontFamily: "var(--font-serif), Source Serif 4, ui-serif, serif"
    fontSize: "clamp(2.75rem, 6vw, 3.75rem)"
    fontWeight: 400
    lineHeight: 1.03
    letterSpacing: "normal"
  headline:
    fontFamily: "var(--font-serif), Source Serif 4, ui-serif, serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.2
  title:
    fontFamily: "var(--font-serif), Source Serif 4, ui-serif, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.25
  body-marketing:
    fontFamily: "var(--font-serif), Source Serif 4, ui-serif, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "var(--font-sans), Archivo, ui-sans-serif, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "var(--font-sans), Archivo, ui-sans-serif, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.06em"
    textTransform: "uppercase"
rounded:
  full: "9999px"
  md: "0.375rem"
  lg: "0.5rem"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  grid-rhythm: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-raised}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-raised}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    typography: "{typography.body}"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-raised}"
  card:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  input:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  nav-item-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-raised}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
---

# Design System: Vizor for Advisors

## Overview

**Creative North Star: "The Advising Ledger"**

Vizor for Advisors reads as a page from a physical ledger, not a SaaS dashboard: warm paper ground, a visible 32px ruled baseline grid running under every screen, and status recorded the way a ledger records a transaction — as one of exactly three committed states, never a decorative badge. The world is a Bauhaus foundation-workshop discipline (primaries as load-bearing law, never ornament) fused onto ASU's own maroon-and-gold identity and real academic-records content: DARS requirement trees, ticket queues, session transcripts.

The system is flat by construction. There is no shadow vocabulary anywhere in the build — depth comes from tonal contrast between the ruled paper ground and opaque raised surfaces, and from 1px rule borders, never from elevation. A geometric sans (Archivo) carries navigation, numerals, labels, and the landing display headline; a companion serif (Source Serif 4) is reserved for headline-scale moments — page greetings, ticket subject names, the login prompt, and one italicized accent phrase on the landing hero — rather than for body copy generally. Dashboard body text (ticket correspondence, DARS line items, summaries) renders in the sans at a small, dense size suited to fast triage, not leisurely reading.

The three state colors — maroon, gold, ink — are rationed and never used decoratively outside status law. The same three colors and the same filled-dot mark answer the same question everywhere they appear: does this need the advisor, did the student resolve it, or did the advisor commit a resolution.

**Key Characteristics:**
- Warm paper ground with a visible, structural 32px ruled baseline grid (`repeating-linear-gradient`, `--color-rule`), painted over by opaque surfaces where they need a clean field.
- Exactly three load-bearing state colors — maroon (needs the advisor), gold (student self-resolved), ink (advisor hard-resolved) — reused verbatim across tickets, DARS requirement status, and the landing legend.
- Flat throughout: zero `box-shadow` in the shipped codebase. Depth is tonal (paper vs. paper-raised) and linear (1px rule borders), never a drop shadow.
- Archivo (sans) for structure — nav, numerals, labels, the landing display headline; Source Serif 4 reserved for headline-scale prose moments, not body copy.
- A permanent three-pane desktop shell: icon rail, content, and a persistent right rail carrying the state-key legend and the live caseload — not page-specific content, part of the system.

## Colors

A rationed palette: three colors carry all status meaning, a warm paper neutral scale carries everything else, and nothing outside those two groups is decorative-color-bearing.

### Primary
- **Maroon** (`#8c1d40`, ink-shade `#5c1129`): the "needs you" state. Marks open tickets (`StateDot`), unmet DARS requirements (`not_satisfied`), the focus-visible ring, text selection, and the landing legend's first panel. Never used for anything but this one meaning.
- **Gold** (`#ffc627`, ink-shade `#7a5b00`): the "student resolved" state. Marks soft-resolved tickets, in-progress DARS requirements (`in_progress`), and the landing legend's second panel.
- **Ink** (`#17140d`, mid `#4a4536`, faint `#837c65`): both the "advisor hard-resolved" state color and the system's primary text/UI-chrome color. Marks hard-resolved tickets, satisfied DARS requirements, the active nav item, primary buttons, and body text at three legibility weights (`ink` / `ink-soft` / `ink-faint`).

### Neutral
- **Paper** (`#f6f2e9`): the base ground for `body`; carries the ruled baseline grid.
- **Paper Raised** (`#fbf9f3`): the opaque surface color for cards, the sidebar, the right rail, and list rows — paints over the ruled grid where a clean field is needed.
- **Rule** (`#ddd4bd`): the default border color (set globally via `* { border-color: var(--color-rule) }`) and the ruled-grid line color.
- **Rule Strong** (`#b9ac83`): hover/emphasis border state (card hover, scrollbar thumb).

### Named Rules
**The Rationed Three Rule.** Maroon, gold, and ink are the only colors ever assigned meaning by status. They appear in exactly one place across the whole system — `StateDot`'s `DOT_CLASS` map — and every surface that shows status (ticket rows, DARS requirement trees, the caseload strip, the right-rail legend, the landing legend bands) reads from that same map. No status is ever shown as a muted gray pill or a fourth color.

**The Never-Decorative Rule.** Outside status law, maroon and gold do not appear as accent color. Buttons, links, and chrome use ink and the neutral scale only; the two state colors are reserved entirely for the moment they mean something.

## Typography

**Display Font:** Archivo (with ui-sans-serif, system-ui, sans-serif fallback)
**Body Font:** Archivo (dashboard content); Source Serif 4 for headline-scale moments (with ui-serif, Georgia, serif fallback)

**Character:** A structural geometric sans carries the working interface — numerals, navigation, labels, dense dashboard body copy — while a warmer serif is spent sparingly, only at headline scale, to mark the few moments (a greeting, a student's name, a login prompt, one italic accent phrase) that read as human rather than tabular.

### Hierarchy
- **Display** (700, `clamp(2.75rem, 6vw, 3.75rem)`, line-height 1.03): the landing hero headline, set in Archivo bold with tight tracking; its closing clause switches to the serif italic accent for one phrase only.
- **Headline** (400 serif, 1.875rem/`text-3xl`, line-height 1.2): page-level greetings and identity lines — "Good to see you, {name}," a ticket's student name.
- **Title** (400 serif, 1.5rem/`text-2xl`): the login page's "Sign in" prompt.
- **Body** (400, 0.875rem/`text-sm`, line-height 1.55, sans): the default dashboard register — ticket summaries, correspondence, DARS line items, table content. Landing marketing copy alone uses a larger serif body (1.125–1.25rem, `leading-relaxed`).
- **Label** (500, 0.75rem/`text-xs`, tracking 0.06em, uppercase, sans, usually `text-ink-faint`): section headers ("Caseload," "Ticket queue," "State key"), form field labels, and category tags ("MAJOR CHANGE," "DARS REQUIREMENT"). The system's only small-caps register; used for structural labeling throughout, never as a marketing teaser.

### Named Rules
**The Headline-Only Serif Rule.** Source Serif 4 is spent only at headline/title scale (page greetings, a ticket's student name, the login prompt, one landing accent phrase). Reading-dense dashboard content — ticket bodies, DARS trees, correspondence — stays in the sans at body size. Where the direction contract framed the serif as a reading-content face, the shipped build reserves it for headline moments instead; that's the standing rule going forward.

## Layout

A persistent three-pane desktop shell: a left icon rail (`w-16`, expanding to `sm:w-60` with labels), a fluid center content column, and a right rail (`w-72`, `hidden` below the `xl` breakpoint) carrying a state-key legend and the advisor's live caseload list. All three panes are `sticky`/`h-dvh` and structural — the right rail is not page-specific content, it renders on every dashboard route from the shared `(dashboard)/layout.tsx`.

The ledger's ruled baseline grid is the literal ground plane: `body` carries a `repeating-linear-gradient` at a fixed 32px vertical rhythm (`color-mix(in srgb, var(--color-rule) 55%, transparent)`), visible in any gap between opaque surfaces. Cards, the sidebar, the right rail, and the landing's full-bleed legend bands paint over it with `paper-raised` or a state color; everywhere else, the rule lines show through.

Content columns use a `max-w-3xl`–`max-w-5xl` container with `px-8 py-8` page padding on dashboard routes; the landing page uses a wider `max-w-6xl mx-auto` container and breaks its bottom legend section full-bleed to the viewport edge. Card grids use `gap-3`–`gap-4`. List-style containers (ticket queue, correspondence) use `divide-y divide-rule` inside a single bordered, rounded wrapper rather than individually bordered cards.

## Elevation & Depth

Flat by construction — zero `box-shadow` anywhere in the shipped codebase. Depth is conveyed two ways only: tonal contrast between the paper ground and `paper-raised` opaque surfaces, and 1px `rule`-colored borders (upgrading to `rule-strong` on hover). The ruled baseline grid showing through negative space does the work a shadow would otherwise do — it tells you where the page's writing surface is, without lifting anything off it.

### Named Rules
**The Flat Ledger Rule.** No surface ever casts a shadow. A surface reads as "raised" only by switching from `paper` to `paper-raised` and gaining a `rule` border — never by gaining a shadow.

## Shapes

Two corner radii cover the system: `rounded-md` (6px) for buttons, nav items, and inputs; `rounded-lg` (8px) for cards, panels, and list containers. `rounded-full` is reserved for state dots, the sign-out affordance, and the scrollbar thumb — pure circles, never used for pill-shaped badges or buttons. Borders are always 1px and always `rule`-colored by default (set globally); nothing in the system uses a heavier border weight.

## Components

### Buttons
- **Shape:** `rounded-md` (6px).
- **Primary:** solid ink fill, paper-raised text, `px-4–5 py-2.5–3` (e.g. "Sign in as an advisor," "Sign in"). Hover dims to `bg-ink/90`.
- **Outline / Secondary:** transparent fill, 1px ink border, ink text (landing nav "Sign in" link). Hover inverts to solid ink fill with paper-raised text — the only invert-on-hover treatment in the system.
- **Signature — Resolve (press-and-hold commit):** `ResolveTicketButton` is outline-styled at rest ("Hold to hard-resolve") but requires an 850ms press-and-hold, filling left-to-right with a solid ink layer under `mix-blend-difference` white text, before committing. On commit it becomes a solid ink pill: "Resolved — recorded under your name." This is the system's literal answer to the STORY contract's "resolve reads as visibly committed, not a soft toggle" — a deliberate, non-accidental gesture standing in for a signature, not a general interaction pattern to reuse elsewhere.

### Cards / Containers
- **Corner Style:** `rounded-lg` (8px).
- **Background:** `paper-raised` on a `paper` ground.
- **Shadow Strategy:** none — see Elevation & Depth.
- **Border:** 1px `rule`, upgrading to `rule-strong` on hover (caseload cards).
- **Internal Padding:** `px-4 py-3.5–4`.

### Inputs / Fields
- **Style:** `paper-raised` background, 1px `rule` border, `rounded-md`, `px-3 py-2.5`.
- **Focus:** border shifts to maroon (`focus:border-maroon`), matching the global `:focus-visible` outline — the one place maroon appears outside status law, because focus is itself a "needs attention" signal.

### Navigation
- **Style:** left icon rail, icon-only at `w-16` below `sm`, expanding to labeled `w-60` above it. Active route: solid ink pill (`bg-ink text-paper-raised`, `rounded-md`). Inactive: `ink-faint` icon, `ink-soft` label, `hover:bg-rule/40`. Icons are a single authored set at a consistent 1.75 stroke weight with round joins/caps — structural marks only, never a status signal (status lives exclusively in `StateDot`'s filled circle).

### The State Dot (signature component)
A single filled circle (`w-2–2.5 h-2–2.5`, `rounded-full`) in one of exactly three colors, defined once in `StateDot.tsx` and reused verbatim by `TicketQueue`, `RequirementTree` (DARS `satisfied`/`in_progress`/`not_satisfied`), `CaseloadStrip`, `RightRail`'s state-key legend, and the landing page's example rows and full-bleed legend bands. This cross-surface reuse — one dot shape, one color map, five call sites — is the system's defining discipline: a ticket's status and a DARS requirement's status are visually the same kind of fact, and the build treats them that way everywhere.

## Do's and Don'ts

### Do:
- **Do** assign maroon, gold, and ink only through `StateDot`'s shared color map — any new status surface should read from that map, not invent a new color or a gray pill.
- **Do** keep the ruled baseline grid as the page's ground plane; new full-bleed sections should paint over it with `paper-raised` or a state color rather than hiding it with a container shadow.
- **Do** reserve Source Serif 4 for headline-scale moments (greetings, names, the login prompt); keep dense dashboard content — tables, correspondence, DARS trees — in Archivo at body size.
- **Do** use the authored 1.75-stroke icon set for structural/navigational marks; do not mix in an icon library or use icons to signal status.

### Don't:
- **Don't** introduce `box-shadow` anywhere; the system is flat by construction, with zero instances in the shipped build.
- **Don't** use maroon or gold decoratively (accent color, hover tint, illustration) outside their status meaning — the one confirmed exception is the maroon focus ring/border, itself a "needs attention" signal.
- **Don't** add a fourth state color or a muted/neutral status pill; the grammar is rationed to exactly three, by design.
