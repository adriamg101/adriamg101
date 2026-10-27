# Personal portfolio site: design

## Intent

A personal presentation site (a CV on the web) for Adrià, published on GitHub Pages from the existing `adriamg101` profile repo. The README stays as the GitHub profile page and is **not modified**; the site is linked from the README, the CV and LinkedIn by Adrià himself.

The core idea: Adrià edits JSON files by hand (initially with Claude's help) and the site builds itself from them. Skills shown on the home page are never typed in; they are derived from the tags on projects, experience and education.

Published URL: `https://adriamg101.github.io/adriamg101/`.

## Goals

- Content-driven: adding an entry to a JSON file is the only step needed to see it on the site.
- Skills (languages, tools, frameworks) aggregate automatically from entry tags.
- Clicking a skill shows everywhere it was used.
- Developer-terminal look, dark by default, with a light mode.
- Three languages: English (default), Spanish, Catalan.
- Deploys automatically on push.

## Non-goals / anti-goals

- No backend, accounts, CMS, or analytics.
- No automatic fetching from the GitHub API; projects are written by hand.
- Do not touch `README.md` in this first version. Generating it from the JSON is a planned future step (see "Future work"), not part of this build.
- Failure even if it "works": a content entry that needs code changes to appear, or a missing icon/translation that breaks the page.

## Decided by Adrià

**Stack and tooling**
- React, with icons from `react-icons` (Devicon / Simple Icons sets). Entries may also specify a custom icon (SVG or image path) overriding the library.

**Look**
- "Developer terminal" dark style. Dark is the default; a light mode toggle exists.
- Top bar to navigate sections (Projects, Experience, Education/titles, etc.).

**Home page**
- Name and About me.
- Directly under the name: a skills marquee (infinite carousel) scrolling right to left continuously. The user can grab and drag it left/right to pick a skill. If there are too few skills, they repeat to fill the row. The order of the skills is randomized, so it is not the same every time.
- Entries from any section can appear on the home page via a boolean flag in their JSON (e.g. `home: true`).

**Sections**
- About me, Projects (from GitHub work), Experience, Education / titles, plus the skills row at the top. Further sections of the same kind are expected over time.
- Each section is introduced by a horizontal heading with a line underneath naming the type (Projects, Education, Experience…).

**Content model**
- One JSON file per content type, written by hand.
- Every entry (project, experience, education…) carries tags: languages, tools, frameworks.
- The home skills row is the union of all tags across all entries, so it grows automatically.

**Skill detail panel**
- Clicking a skill (in the marquee or on a card) opens a panel/overlay on top of the page, preserving the user's scroll position.
- The panel lists every entry using that skill, grouped by type with the same horizontal-heading-with-line style; empty groups are hidden.
- Each listed item links to its section.

**Languages**
- English (default), Spanish, Catalan, switched with a button.

**Repo**
- The site lives in this repo (`adriamg101`); `README.md` untouched.

## Builder's calls (Adrià can override)

- Vite + React + TypeScript; JSON validated by types (and a schema check at build time) so a typo fails the build instead of breaking the site.
- Deploy with a GitHub Actions workflow to GitHub Pages; Vite `base` set to `/adriamg101/`.
- Translatable text in JSON as `{ "en": "...", "es": "...", "ca": "..." }`; missing translation falls back to English. Static UI strings (section titles, buttons) are translated separately in the same three languages. Chosen language is remembered in the browser; theme choice likewise.
- The marquee order is shuffled once per page load (not continuously, so icons don't jump while the user is trying to click or drag). When skills repeat to fill the row, the shuffled order is reused for the copies so the loop stays seamless.
- Marquee pauses on hover; after a drag it resumes from where it was released.
- If a tag has no library icon and no custom icon, show it as text.
- Routing vs. single-page scroll for sections is left to the builder (must work on GitHub Pages without server rewrites, e.g. hash-based or anchor scroll).
- Tag names are normalized (case-insensitive, one canonical entry per skill) so "React" and "react" are the same skill.
- Skill-to-icon mapping lives in one editable file so Adrià can add or override icons manually.

## Further calls made after the builder check (Adrià can override)

- **Tags:** each entry has three arrays, `languages`, `tools`, `frameworks` (matching how Adrià described them), holding skill names. An optional `skills.json` can set a display name, category or custom icon for a skill; absent that, the name is looked up in the icon library and the array it was written in gives its category. The same skill in two arrays counts as one skill.
- **Information architecture:** multi-page with hash-based routing: a Home page plus one page per section. Home shows About me, the skills marquee, and every entry flagged `home: true` as a summary card. The top bar switches pages. Items in the skill panel link to the specific entry (anchored and briefly highlighted) on its section page.
- **Entry fields:** title, translatable description, optional dates, optional links (repo, demo), optional image, tags, `home`. Experience adds organization and role; education adds institution and degree. Entries sort newest first when dated.
- **Sections at launch:** Projects, Experience, Education. Adding a new content type is a new JSON file plus a one-line registration; adding entries to an existing type needs no code.
- **About me:** a single JSON file with name, tagline, translatable bio and contact links (GitHub, LinkedIn, email). It is shown on Home and has no tags.
- **Repo layout:** the Vite app lives at the repo root next to `README.md`; the specs stay in `docs/`. The repo's Pages source must be set to "GitHub Actions" in the repo settings, which Adrià does by hand once.
- **Placeholder content:** includes real en/es/ca text. The build prints a non-failing warning for missing translations.

## Future work (not in this build)

Adrià wants the profile README to stay in sync with the same JSON files. Intended later design, recorded so the data model doesn't block it:

- A GitHub Actions workflow runs on push, only when the content JSON files change (path filter).
- A script reads the JSON and rewrites generated sections of `README.md` (skills, and every entry flagged `home: true`), then commits the result back. Hand-written parts of the README stay untouched; the generated parts live between marker comments.
- The README skills list is the same union of tags used by the site, and the README highlights are the same `home: true` entries.
- Constraints for the current build: keep the aggregation logic (skills union, `home` filtering) in plain functions that don't depend on React, so the later script can reuse them.
- Adrià also plans to redesign the README later; that is a separate piece of work.

## Left to the builder

- Exact visual design within the terminal style (fonts, colors, spacing, animations), accessibility details, responsive behavior.
- Component structure and file layout.
- Initial placeholder content to demonstrate every section and feature, which Adrià will replace with real content.
