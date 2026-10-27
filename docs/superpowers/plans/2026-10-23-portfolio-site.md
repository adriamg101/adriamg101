# Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A JSON-driven, terminal-styled, trilingual (en/es/ca) portfolio site on GitHub Pages, where skills are derived from entry tags and every skill opens a panel listing where it was used.

**Architecture:** Vite + React + TypeScript SPA with hash routing. Content lives in JSON files validated by zod (strict) at build time. All aggregation logic (skills union, usages, `home` filtering, sorting) is plain TypeScript in `src/lib/` with no React imports, so the future README generator can reuse it. Components receive data as props; `App` wires the real content.

**Tech Stack:** Vite, React 18+, TypeScript, react-router-dom (`HashRouter`), react-icons, zod, Vitest + React Testing Library (jsdom), tsx, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-23-portfolio-site-design.md`

## Global Constraints

- `README.md` must not be modified.
- Vite `base` is `/adriamg101/`; published at `https://adriamg101.github.io/adriamg101/`.
- Languages `en` (default), `es`, `ca`; translatable text is `{ "en": "...", "es": "...", "ca": "..." }`; missing `es`/`ca` falls back to `en`.
- Dark theme is the default (not the OS preference); light theme via toggle. Language and theme choices persist in the browser.
- Entries have arrays `languages`, `tools`, `frameworks`, a boolean `home`, and an optional custom icon is set per skill in `skills.json`.
- The marquee scrolls right to left, is draggable, pauses on hover, shuffles once per page load, repeats items to fill the row.
- Skill panel opens over the page, groups results by section with a heading + line under it, hides empty groups, links to the specific entry.
- No backend, no GitHub API calls, no analytics.
- A typo in a content JSON file must fail `npm run build`; a missing icon or translation must never break the page.

## Review Focus

- Skill spelled `"React"`, `"react"`, `" Node.js "`, `"nodejs"` counts as one skill each; `C`, `C++`, `C#` stay distinct (Task 4).
- A section whose JSON is `[]` is hidden from the top bar and Home, and its route redirects Home (Task 7).
- Corrupt or unavailable `localStorage` values fall back to `en` / dark without throwing (Task 3).
- Zero skills renders no marquee and no crash; one skill still fills the row (Task 6).
- Deep link `#/projects/does-not-exist` renders the Projects page with no error and no highlight (Task 7).

---

## File Structure

```
index.html, package.json, tsconfig*.json, vite.config.ts, .gitignore
.github/workflows/deploy.yml
scripts/validate-content.ts          build-time validation + translation warnings
docs/CONTENT.md                      how to add entries / a section / an icon
src/main.tsx, src/App.tsx, src/styles.css, src/test-setup.ts
src/data/{about,projects,experience,education}.json, src/data/skills.json
src/lib/schema.ts                    zod schemas + types + parseContent
src/lib/content.ts                   imports JSON, section registry, sortEntries, content export
src/lib/skills.ts                    normalizeSkillKey, collectSkills, usagesOf, homeEntries
src/lib/i18n.ts                      pickText, ui strings, UiKey
src/lib/settings.tsx                 SettingsProvider, useSettings, useT, safe storage
src/lib/shuffle.ts                   shuffle
src/lib/iconMap.ts                   skill key -> react-icons component (editable)
src/lib/marquee.ts                   copiesNeeded, wrapOffset, isDrag
src/components/                      TopBar, LanguageSwitch, ThemeToggle, SkillIcon, SkillsMarquee,
                                     SkillPanel (+provider), SectionHeading, EntryCard
src/pages/{Home,SectionPage}.tsx
```

Tests sit next to the file they cover (`*.test.ts(x)`).

---

### Task 1: Scaffold, tooling, smoke test

**Files:**
- Create: `package.json`, `index.html`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/test-setup.ts`, `src/App.test.tsx`

**Interfaces:**
- Produces: `App(): JSX.Element`; npm scripts `dev`, `build` (`tsc -b && vite build`), `preview`, `test` (`vitest run`).

- [ ] **Step 1: Create the project files by hand** (do not run `npm create vite` in the repo root; it can touch `README.md`). Install runtime deps `react react-dom react-router-dom react-icons zod` and dev deps `vite @vitejs/plugin-react typescript vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event tsx @types/react @types/react-dom`. `.gitignore` covers `node_modules`, `dist`.
- [ ] **Step 2: Configure `vite.config.ts`**: react plugin, `base: '/adriamg101/'`, `test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'], globals: true }`. `src/test-setup.ts` imports `@testing-library/jest-dom/vitest`.
- [ ] **Step 3: Write the failing test** `src/App.test.tsx`: render `<App />`, `expect(screen.getByRole('main')).toBeInTheDocument()`.
- [ ] **Step 4: Run** `npx vitest run` → FAIL (App has no `main`).
- [ ] **Step 5: Implement** `App` returning `<main>` placeholder; `main.tsx` mounts it.
- [ ] **Step 6: Run** `npx vitest run` → PASS; `npm run build` → succeeds and emits `dist/`.
- [ ] **Step 7: Commit** `chore: scaffold vite react ts app` (stage all except `README.md`; confirm `git status` shows README untouched).

---

### Task 2: Content schema, loading, sorting, warnings

**Files:**
- Create: `src/lib/schema.ts`, `src/lib/content.ts`, `src/data/about.json`, `src/data/projects.json`, `src/data/experience.json`, `src/data/education.json`, `src/data/skills.json`
- Test: `src/lib/schema.test.ts`, `src/lib/content.test.ts`

**Interfaces:**
- Produces (in `schema.ts`):
  - `type Lang = 'en'|'es'|'ca'`; `type Translatable = { en: string; es?: string; ca?: string }`; `type SkillCategory = 'languages'|'tools'|'frameworks'`
  - `type Entry` = `{ id: string; title: Translatable; description: Translatable; start?: string; end?: string; links?: {label: string; url: string}[]; image?: string; languages: string[]; tools: string[]; frameworks: string[]; home: boolean }` plus, for experience, `organization: string; role: Translatable`, and for education, `institution: string; degree: Translatable` (typed as `Entry & Partial<...>` union members `ExperienceEntry`, `EducationEntry`). `start`/`end` are `YYYY-MM` strings; `end` may be `"present"`.
  - `type Section = { key: string; titleKey: UiKey; entries: Entry[] }`
  - `type About = { name: string; tagline: Translatable; bio: Translatable; contacts: {label: string; url: string}[] }`
  - `type SkillOverrides = Record<string, { name?: string; category?: SkillCategory; icon?: string }>` (keys are normalized skill keys)
  - `parseContent(raw: { about: unknown; sections: {key: string; titleKey: UiKey; data: unknown}[]; skills: unknown }): Content` where `Content = { about: About; sections: Section[]; skillOverrides: SkillOverrides }`. Throws an `Error` whose message names the file/section and field path.
- Produces (in `content.ts`): `sortEntries(entries: Entry[]): Entry[]` (newest `start` first, undated last, stable, non-mutating); `missingTranslations(content: Content): string[]`; `export const content: Content`.
- `UiKey` is defined in `src/lib/i18n.ts` (Task 3); until then declare `type UiKey = string` in `schema.ts` and switch the import in Task 3.

- [ ] **Step 1: Write failing tests** in `schema.test.ts`: valid entry parses; unknown field (`framwork: []`) throws with the field name in the message; duplicate `id` within one section throws; missing `languages` throws; `end: 'present'` accepted, `end: 'next week'` rejected. In `content.test.ts`: `sortEntries` puts `2024-03` before `2022-01` before undated; does not mutate input; `missingTranslations` returns one string per missing `es`/`ca` field, e.g. `projects/foo: description.ca`.
- [ ] **Step 2: Run** `npx vitest run src/lib` → FAIL.
- [ ] **Step 3: Implement** the zod schemas with `.strict()` on every object; section schema is an array refined for unique ids. `content.ts` imports the five JSON files and a registry `sectionDefs = [{ key: 'projects', titleKey: 'section.projects', file: projects }, …experience, education]`, calls `parseContent`, sorts each section's entries with `sortEntries`.
- [ ] **Step 4: Create minimal valid JSON** (`about.json` with placeholder name, empty arrays elsewhere, `skills.json` = `{}`).
- [ ] **Step 5: Run** `npx vitest run src/lib` → PASS.
- [ ] **Step 6: Commit** `feat: content schema and loader`.

---

### Task 3: i18n and settings

**Files:**
- Create: `src/lib/i18n.ts`, `src/lib/settings.tsx`
- Modify: `src/lib/schema.ts` (import `UiKey`)
- Test: `src/lib/i18n.test.ts`, `src/lib/settings.test.tsx`

**Interfaces:**
- Produces: `pickText(t: Translatable, lang: Lang): string` (falls back to `t.en` when the language is missing or empty); `ui: Record<Lang, Record<UiKey, string>>`; `type UiKey` including at least `section.projects`, `section.experience`, `section.education`, `nav.home`, `home.skills`, `panel.usedIn`, `panel.close`, `theme.toggle`, `lang.label`, `empty.skill`; `SettingsProvider({children})`; `useSettings(): { lang: Lang; setLang(l: Lang): void; theme: 'dark'|'light'; toggleTheme(): void }`; `useT(): (key: UiKey) => string`. Storage keys `portfolio.lang`, `portfolio.theme`. The provider sets `document.documentElement.dataset.theme` and `lang`.

- [ ] **Step 1: Write failing tests**: `pickText({en:'a'}, 'ca') === 'a'`; `pickText({en:'a', es:''}, 'es') === 'a'`; `pickText({en:'a', ca:'b'}, 'ca') === 'b'`; every `UiKey` has a non-empty string in all three `ui` languages; default is `en`/`dark` with empty storage even if `matchMedia` prefers light; stored `'es'` is restored; stored garbage (`'xx'`) and a `localStorage` whose `getItem`/`setItem` throw both give `en`/`dark` and `setLang('ca')` does not throw; `toggleTheme` flips `document.documentElement.dataset.theme`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** the files; storage reads/writes wrapped in try/catch inside small `readSetting`/`writeSetting` helpers.
- [ ] **Step 4: Run** `npx vitest run` → PASS.
- [ ] **Step 5: Commit** `feat: i18n and persisted settings`.

---

### Task 4: Skills aggregation (pure)

**Files:**
- Create: `src/lib/skills.ts`
- Test: `src/lib/skills.test.ts`

**Interfaces:**
- Consumes: `Section`, `Entry`, `SkillOverrides`, `SkillCategory` from `schema.ts`.
- Produces:
  - `type Skill = { key: string; name: string; category: SkillCategory; icon?: string }`
  - `normalizeSkillKey(name: string): string`: lowercase, trim, drop every character that is not `a-z`, `0-9`, `+` or `#`.
  - `collectSkills(sections: Section[], overrides: SkillOverrides): Skill[]`: one `Skill` per key; name = override name else first spelling seen; category = override else the array it was first found in; sorted by name for determinism (the marquee shuffles later).
  - `usagesOf(key: string, sections: Section[]): { section: Section; entries: Entry[] }[]`: sections in input order, empty groups omitted.
  - `homeEntries(sections: Section[]): { section: Section; entries: Entry[] }[]`: entries with `home: true`, empty groups omitted.

- [ ] **Step 1: Write failing tests**: `'React'`, `'react'`, `' React '` → one skill; `'Node.js'`, `'nodejs'`, `'NodeJS'` → key `nodejs`; `'C'`, `'C++'`, `'C#'` → keys `c`, `c++`, `c#`; same skill in `languages` of one entry and `tools` of another → one skill, first category wins unless overridden; override `{ name: 'React', icon: '/x.svg' }` applies; `usagesOf('python', …)` returns Projects and Education groups but omits Experience when unused; `usagesOf('unknown', …)` → `[]`; `homeEntries` returns only flagged entries and omits empty sections; empty `sections` → `[]` for all.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** the four functions (no React imports).
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** `feat: skill aggregation`.

---

### Task 5: Icons

**Files:**
- Create: `src/lib/iconMap.ts`, `src/components/SkillIcon.tsx`
- Test: `src/components/SkillIcon.test.tsx`

**Interfaces:**
- Consumes: `Skill`.
- Produces: `iconMap: Record<string, IconType>` keyed by normalized skill key (initial entries: `python, java, javascript, typescript, c, c++, c#, html, css, react, nodejs, docker, git, github, linux, sql, postgresql, mysql, mongodb, vite, tailwindcss, bash, rust, go` using `react-icons/si` or `/fa` — verify each import name exists); `SkillIcon({ skill, size = 20 }: { skill: Skill; size?: number }): JSX.Element` rendering `<img src={skill.icon} alt="">` when `skill.icon` is set, else the mapped icon, else the skill name as text; always followed by or wrapped with an accessible name (`aria-label={skill.name}`).

- [ ] **Step 1: Write failing tests**: skill `react` renders an `svg`; skill with `icon: '/x.svg'` renders an `img` with that `src` even if mapped; unmapped skill `foobar` renders its name as text and does not throw.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS. **Step 5: Commit** `feat: skill icons with text fallback`.

---

### Task 6: Shuffle and skills marquee

**Files:**
- Create: `src/lib/shuffle.ts`, `src/lib/marquee.ts`, `src/components/SkillsMarquee.tsx`
- Test: `src/lib/shuffle.test.ts`, `src/lib/marquee.test.ts`, `src/components/SkillsMarquee.test.tsx`

**Interfaces:**
- Consumes: `Skill`, `SkillIcon`, `useSkillPanel()` (Task 8; until it exists, the marquee takes an `onSelect` prop instead and Task 8 wires it).
- Produces:
  - `shuffle<T>(items: T[], random: () => number = Math.random): T[]` (Fisher-Yates, non-mutating).
  - `copiesNeeded(contentWidth: number, viewportWidth: number): number` = `contentWidth <= 0 ? 2 : Math.max(2, Math.ceil(viewportWidth / contentWidth) + 1)`.
  - `wrapOffset(offset: number, loopWidth: number): number`: result in `(-loopWidth, 0]`; returns `0` when `loopWidth <= 0`.
  - `isDrag(dx: number): boolean` true when `Math.abs(dx) > 5`.
  - `SkillsMarquee({ skills, onSelect }: { skills: Skill[]; onSelect: (key: string) => void })`: `skills` arrive already shuffled. Moves leftward via `requestAnimationFrame`, speed ~40 px/s, pauses on pointer hover, supports pointer-drag in both directions (pointer capture), resumes from the released offset, a drag longer than `isDrag` does not trigger `onSelect`. Each item is a `<button>` with the skill's icon and name.

- [ ] **Step 1: Write failing tests**: `shuffle` with a seeded `random` returns a permutation of the input, leaves the input unchanged, `shuffle([])` → `[]`; `copiesNeeded(0, 1000) === 2`, `copiesNeeded(300, 1000) === 5`, `copiesNeeded(2000, 1000) === 2`; `wrapOffset(-350, 300) === -50`, `wrapOffset(20, 300) === -280`, `wrapOffset(5, 0) === 0`; `isDrag(5) === false`, `isDrag(-6) === true`; component: renders a button per skill, clicking one calls `onSelect('react')`, `skills={[]}` renders nothing (`container` is empty), a single skill renders at least 2 copies of its button.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Measure content and viewport widths with a `ResizeObserver` guarded for jsdom (`typeof ResizeObserver === 'undefined'` → assume 1 copy set repeated `copiesNeeded(0, 0)`).
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** `feat: draggable skills marquee`.

---

### Task 7: Layout, routing, sections, cards

**Files:**
- Create: `src/components/{TopBar,LanguageSwitch,ThemeToggle,SectionHeading,EntryCard}.tsx`, `src/pages/{Home,SectionPage}.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`
- Test: `src/components/TopBar.test.tsx`, `src/pages/SectionPage.test.tsx`, `src/pages/Home.test.tsx`

**Interfaces:**
- Consumes: `Section`, `About`, `Skill`, `pickText`, `useSettings`, `useT`, `homeEntries`, `SkillsMarquee`, `shuffle`, `SkillIcon`.
- Produces:
  - `TopBar({ sections }: { sections: Section[] })`: links `#/` and `#/{section.key}` for sections with at least one entry only; contains `LanguageSwitch` (buttons EN / ES / CA, `aria-pressed` on the active one) and `ThemeToggle`.
  - `SectionHeading({ children }: { children: ReactNode })`: an `<h2>` with a full-width line (border-bottom) under it.
  - `EntryCard({ entry, sectionKey }: { entry: Entry; sectionKey: string })`: element `id="entry-{entry.id}"`; shows title, subtitle line (organization/role or institution/degree if present), dates, description in the current language, links, image, and a row of skill buttons (one per tag, opening the skill panel; stubbed no-op until Task 8). Takes optional `highlighted?: boolean` which sets `data-highlighted="true"`.
  - `SectionPage({ sections }: { sections: Section[] })`: reads route params `:section` and optional `:entryId`; unknown or empty section → `<Navigate to="/" replace />`; renders `SectionHeading` + cards; when `entryId` matches, calls `scrollIntoView?.()` on it and sets `highlighted` for 2 s; unknown `entryId` renders normally.
  - `Home({ about, skills, sections }: { about: About; skills: Skill[]; sections: Section[] })`: name, tagline, bio, contact links; `SkillsMarquee`; then for each group from `homeEntries`, a `SectionHeading` and the flagged cards.
  - `App` builds `skills = useState(() => shuffle(collectSkills(content.sections, content.skillOverrides)))[0]` so the order is fixed for the page load, and routes `/` → `Home`, `/:section/:entryId?` → `SectionPage`, inside `HashRouter` and `SettingsProvider`.

- [ ] **Step 1: Write failing tests**: TopBar hides a section with `entries: []` and shows the others; clicking `ES` sets `aria-pressed` and persists `es`; `SectionPage` at `/projects` with `MemoryRouter` shows the Projects heading and a card per entry; at `/projects/foo` the card `entry-foo` has `data-highlighted="true"`; at `/projects/does-not-exist` it renders all cards with no `data-highlighted` and no throw; `/experience` with an empty section redirects to Home content; `Home` shows only `home: true` entries under their section headings and omits sections with none; descriptions render in Spanish after switching language, falling back to English when `es` is missing.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** `scrollIntoView` does not exist in jsdom, hence the optional call.
- [ ] **Step 4: Run** → PASS; `npm run build` → succeeds. **Step 5: Commit** `feat: layout, routing, home and section pages`.

---

### Task 8: Skill panel

**Files:**
- Create: `src/components/SkillPanel.tsx`
- Modify: `src/App.tsx`, `src/components/SkillsMarquee.tsx` (use the hook), `src/components/EntryCard.tsx` (wire tag buttons)
- Test: `src/components/SkillPanel.test.tsx`

**Interfaces:**
- Consumes: `usagesOf`, `Skill`, `Section`, `pickText`, `useT`, `SectionHeading`.
- Produces: `SkillPanelProvider({ sections, skills, children })`; `useSkillPanel(): { openSkill(key: string): void; close(): void }`. The panel is `role="dialog"` with `aria-modal="true"`, labelled by the skill name and icon; it renders over the page (fixed overlay) so the underlying scroll position is untouched; closes on `Esc`, backdrop click, or a close button; lists `usagesOf` groups each under a `SectionHeading` with the section title (`t(section.titleKey)`); each item is a link to `#/{section.key}/{entry.id}` that also closes the panel; if there are no usages shows `t('empty.skill')`.

- [ ] **Step 1: Write failing tests**: opening `python` shows a dialog titled "Python" with a "Projects" heading and "Education" heading and no "Experience" heading; each item has `href` ending `/projects/<id>`; `Esc` closes; backdrop click closes; clicking an item closes; `window.scrollY` is unchanged after open/close (set to 120 before, assert after); an unknown key shows the empty message.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**, then replace the marquee `onSelect` wiring in `Home` with `useSkillPanel().openSkill`.
- [ ] **Step 4: Run** `npx vitest run` → PASS. **Step 5: Commit** `feat: skill usage panel`.

---

### Task 9: Terminal styling, placeholder content, content docs, build validation

**Files:**
- Create: `src/styles.css`, `scripts/validate-content.ts`, `docs/CONTENT.md`
- Modify: `src/data/*.json` (placeholder content), `package.json` (`build`), `src/main.tsx` (import css)

**Interfaces:**
- Consumes: `parseContent`, `missingTranslations`, `content`.
- Produces: `npm run validate` (`tsx scripts/validate-content.ts`) exits 1 with the zod error message on invalid content, exits 0 and prints each `missingTranslations` line prefixed `warning:` otherwise; `build` becomes `tsx scripts/validate-content.ts && tsc -b && vite build`.

- [ ] **Step 1: Write the placeholder content**: about, 3 projects, 2 experience, 2 education entries, each with en/es/ca text, tags spanning all three categories (use skills present in `iconMap` plus one deliberately unmapped), at least one `home: true` per section, one entry with no dates. `skills.json` overrides one skill with a custom icon (a small SVG under `public/icons/`).
- [ ] **Step 2: Style** with CSS variables on `:root[data-theme="dark"|"light"]`: monospace font stack (system, no web font), prompt-style headings (e.g. `~/projects`), blinking cursor accent, responsive down to phone width, `prefers-reduced-motion` disables marquee auto-scroll and cursor blink.
- [ ] **Step 3: Write the failing check**: temporarily rename a field in `projects.json` to a typo, run `npm run validate` → expect exit code 1 and the field name in the output; revert.
- [ ] **Step 4: Implement** the script and the `build` change. Run `npm run validate` → exit 0; `npm run build` → succeeds.
- [ ] **Step 5: Write `docs/CONTENT.md`**: how to add an entry, every field, how translations/fallback work, how to add a custom icon, how to add a new section (JSON file + one `sectionDefs` line + `section.<key>` in all three `ui` languages).
- [ ] **Step 6: Verify visually**: `npm run dev`, open the site, check dark default, light toggle, language switch, marquee scroll/drag/hover, skill panel and deep link, at desktop and phone width. State what was checked and what could not be.
- [ ] **Step 7: Commit** `feat: terminal theme, placeholder content, validation, docs`.

---

### Task 10: GitHub Pages deployment

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: a workflow named `Deploy` on `push` to `main` and `workflow_dispatch`, permissions `contents: read`, `pages: write`, `id-token: write`, concurrency group `pages`; jobs `build` (checkout, `actions/setup-node` Node 22 with npm cache, `npm ci`, `npm test`, `npm run build`, `actions/configure-pages`, `actions/upload-pages-artifact` with `path: dist`) and `deploy` (`actions/deploy-pages`, environment `github-pages`). Use current stable major versions of each action.

- [ ] **Step 1: Write the workflow.**
- [ ] **Step 2: Verify locally**: `npm ci && npm test && npm run build && npx vite preview --port 4173`, then `curl -s http://localhost:4173/adriamg101/ | grep -c "<div id=\"root\""` → `1`.
- [ ] **Step 3: Commit** `ci: deploy to github pages`.
- [ ] **Step 4: Tell Adrià** the one manual step: in the repo's Settings → Pages, set Source to "GitHub Actions", then push to `main`; confirm the site loads at the published URL once the first run finishes.
