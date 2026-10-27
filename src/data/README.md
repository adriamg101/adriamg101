# Content data (`src/data/*.json`)

Everything the site shows comes from the JSON files in this folder. Nothing else needs to change to
edit the site. This page documents the exact shape of every file, as enforced by
`src/lib/schema.ts`. For the longer editing guide (views, routes, animation, deploying) see
[`docs/CONTENT.md`](../../docs/CONTENT.md).

| File | Shape | Purpose |
| --- | --- | --- |
| [`about.json`](#aboutjson) | object | The neofetch card on Home: name, photo, info lines, bio |
| [`projects.json`](#entry-sections-projects-experience-education-hobbies) | array of entries | Projects section |
| [`experience.json`](#experiencejson-extra-fields) | array of entries + `organization`, `role` | Experience section |
| [`education.json`](#educationjson-extra-fields) | array of entries + `institution`, `degree` | Education section |
| [`hobbies.json`](#entry-sections-projects-experience-education-hobbies) | array of entries (same as projects) | Hobbies section |
| [`skills.json`](#skillsjson) | object | Optional overrides for skills |

## Rules that apply everywhere

- **Strict schemas.** Unknown or misspelled fields are rejected, and so is a missing required field.
  `npm run validate` prints the file/section and field path of the first problem and exits with 1.
- **Translatable text** is an object `{ "en": "...", "es": "...", "ca": "..." }`. `en` is required;
  `es` and `ca` are optional. In Spanish or Catalan, a missing translation falls back to the English
  text on the site and is reported as a warning by `npm run validate`.
- **Plain strings** are used where text is not translated (names, organizations, skill names, labels
  such as `GitHub`). A plain string never produces a warning.
- **Paths to files** (`photo`, `image`, `media[].src`, skill `icon`, a local `href` with `download`)
  point into `public/`. Write `icons/x.svg` or `/icons/x.svg`: both are resolved against the site
  base (for GitHub Pages `/<repo>/`), so they work when deployed. Full URLs (`https://...`) and
  `data:` URIs are left as they are.
- **Dates** are `YYYY-MM` (month 01 to 12). `end` may also be `"present"`.

## `about.json`

An object with the neofetch card. Strict: no other top-level keys.

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `name` | string | yes | Full name. Title of the card (the page's only `h1`) and the photo's alt text. Do not repeat it in `lines`. |
| `tagline` | translatable | yes | First line of the card (labelled "About"). |
| `bio` | translatable | yes | Paragraph shown under the card. |
| `photo` | string | yes | Image path under `public/` (or URL). Square, around 400 x 400 px, looks best. |
| `prompt` | `{ "user": string, "host": string }` | yes | Shell prompt shown before each command: `user@host:~$`. |
| `lines` | array of lines | yes | Info lines, shown in order after the tagline. May be `[]`. |

A line has one of two shapes. Both have a `label` (plain string or translatable). A line must have
**exactly one** of `value` or `rows`.

**Text line**: `{ "label", "value", "href"?, "download"? }`

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `label` | string or translatable | yes | Left column, shown with a trailing `:`. |
| `value` | string or translatable | yes | The text. |
| `href` | string | no | Makes the value a link. `https://...` opens in a new tab; `mailto:...` does not. |
| `download` | boolean | no | With `href`: the link downloads the file (no new tab). A local `href` (`cv.pdf`) is resolved against the site base. |

**Table line**: `{ "label", "rows": [ { "name", "level" }, ... ] }`

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `label` | string or translatable | yes | As above. |
| `rows` | array of rows | yes | Must not be empty. Rendered as a small table with one row per item, no title row. |
| `rows[].name` | string or translatable | yes | First cell (for example the language). |
| `rows[].level` | string or translatable | yes | Second cell, shown muted. |

A table line cannot also have `value`, `href` or `download`.

```json
{
  "name": "Ada Lovelace",
  "tagline": { "en": "Mathematician and programmer", "es": "Matemática y programadora", "ca": "Matemàtica i programadora" },
  "bio": { "en": "I write about engines.", "es": "Escribo sobre máquinas.", "ca": "Escric sobre màquines." },
  "photo": "photo.jpg",
  "prompt": { "user": "ada", "host": "portfolio" },
  "lines": [
    { "label": { "en": "Location", "es": "Ubicación", "ca": "Ubicació" }, "value": "London" },
    {
      "label": { "en": "Languages", "es": "Idiomas", "ca": "Idiomes" },
      "rows": [
        { "name": { "en": "English", "es": "Inglés", "ca": "Anglès" }, "level": { "en": "Native", "es": "Nativo", "ca": "Natiu" } },
        { "name": { "en": "French", "es": "Francés", "ca": "Francès" }, "level": "B2" }
      ]
    },
    {
      "label": "CV",
      "value": { "en": "Download CV", "es": "Descargar CV", "ca": "Descarrega el CV" },
      "href": "cv.pdf",
      "download": true
    },
    { "label": "GitHub", "value": "github.com/ada", "href": "https://github.com/ada" },
    { "label": "Email", "value": "ada@example.com", "href": "mailto:ada@example.com" }
  ]
}
```

`download` only works for same-origin files (your own file in `public/`); browsers ignore it for
other sites. A local `href` **without** `download` is used exactly as written (it is not resolved
against the site base), so for local files use a `download` line, or write a full `https://` URL.

To change the CV, put the PDF in `public/` (for example `public/cv.pdf`) and set `"href": "cv.pdf"`.

## Entry sections (`projects`, `experience`, `education`, `hobbies`)

Each of these files is an **array of entries**. Order in the file does not matter: entries are sorted
by `start`, newest first, and entries without `start` go last. `id` must be unique within the file.

| Field | Type | Required | Meaning / constraints |
| --- | --- | --- | --- |
| `id` | string | yes | Letters, digits and hyphens, starting with a letter or digit (`my-project-1`). Used in the URL `#/projects/my-project`. |
| `title` | translatable | yes | Name of the entry. |
| `description` | translatable | yes | Full text, shown only in the detail view. Separate paragraphs with a blank line (`\n\n` inside the JSON string). |
| `summary` | translatable | no | Short text for the cards. If missing, cards use the first paragraph of `description`, cut to two lines. |
| `start` | `YYYY-MM` | no | Start date. |
| `end` | `YYYY-MM` or `"present"` | no | End date. Not allowed without `start`. |
| `links` | array of `{ "label": string, "url": string }` | no | Link buttons in the detail view. |
| `downloads` | array of `{ "label": translatable, "file": string }` | no | Download buttons in the detail view, after the links (a thesis, documentation). `file` is a path under `public/` (`docs/thesis.pdf`), resolved like the CV file. |
| `image` | string | no | Cover image on the cards. In the detail view it is shown only when `media` is empty. Alt text: the entry title. |
| `media` | array of `{ "src": string, "alt"?: string or translatable }` | no | Images for the detail view (one is shown large, two or more in a grid). Images only: any other field (a video URL, `type`, ...) is rejected. A missing `alt` falls back to the entry title; `"alt": ""` marks a decorative image. |
| `languages` | array of strings | yes | Skill names (may be `[]`). |
| `tools` | array of strings | yes | Skill names (may be `[]`). |
| `frameworks` | array of strings | yes | Skill names (may be `[]`). |
| `home` | boolean | yes | `true` puts the entry on Home. |

Notes:

- **Skills** listed in `languages`/`tools`/`frameworks` become clickable tags and feed the skills
  carousel and the `/skills` view. Names are matched case-insensitively ignoring spaces and
  punctuation (`Node.js` = `nodejs`), so spelling variants merge into one skill. A name with no
  Latin letters or digits is ignored (with a warning).
- `links[].url` is not validated as a URL; every link opens in a new tab.
- The `cat <section>/<slug>` command shown in the detail view builds its slug from `title.en`
  (display only; URLs use `id`).
- **Home is curated.** A section appears on Home only if at least one of its entries has
  `"home": true`. The section view (`#/<section>`) and each detail view always show everything.
- `hobbies.json` has exactly the same shape as `projects.json`.

```json
{
  "id": "log-analyzer",
  "title": { "en": "Log analyzer", "es": "Analizador de logs", "ca": "Analitzador de logs" },
  "summary": { "en": "Parses and summarises server logs.", "es": "Analiza y resume logs de servidor.", "ca": "Analitza i resumeix logs de servidor." },
  "description": {
    "en": "First paragraph.\n\nSecond paragraph.",
    "es": "Primer párrafo.\n\nSegundo párrafo.",
    "ca": "Primer paràgraf.\n\nSegon paràgraf."
  },
  "start": "2025-03",
  "end": "present",
  "links": [{ "label": "GitHub", "url": "https://github.com/ada/log-analyzer" }],
  "image": "images/log-analyzer.png",
  "media": [
    { "src": "media/log-analyzer-1.png", "alt": { "en": "Main screen", "es": "Pantalla principal", "ca": "Pantalla principal" } },
    { "src": "media/log-analyzer-2.png", "alt": "" }
  ],
  "languages": ["Python"],
  "tools": ["Docker"],
  "frameworks": [],
  "home": true
}
```

### `experience.json` extra fields

All the entry fields above, plus:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `organization` | string | yes | Company or organization (not translated). |
| `role` | translatable | yes | Your role. |

```json
{
  "id": "acme-dev",
  "title": { "en": "Backend developer", "es": "Desarrollador backend", "ca": "Desenvolupador backend" },
  "organization": "Acme Corp",
  "role": { "en": "Software developer", "es": "Desarrollador de software", "ca": "Desenvolupador de programari" },
  "description": { "en": "Built internal services.", "es": "Construí servicios internos.", "ca": "Vaig construir serveis interns." },
  "start": "2024-09",
  "end": "present",
  "languages": ["Python", "SQL"],
  "tools": ["Docker"],
  "frameworks": [],
  "home": true
}
```

### `education.json` extra fields

All the entry fields above, plus:

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `institution` | string | yes | School or university (not translated). |
| `degree` | translatable | yes | Degree or course name. |

```json
{
  "id": "uni",
  "title": { "en": "Computer science", "es": "Informática", "ca": "Informàtica" },
  "institution": "Example University",
  "degree": { "en": "BSc in Computer Science", "es": "Grado en Informática", "ca": "Grau en Informàtica" },
  "description": { "en": "Core CS topics.", "es": "Temas básicos de informática.", "ca": "Temes bàsics d'informàtica." },
  "start": "2020-09",
  "end": "2024-06",
  "languages": ["C"],
  "tools": [],
  "frameworks": [],
  "home": false
}
```

## `skills.json`

An object of **optional overrides**, normally `{}`. Skills themselves are collected automatically from
the entries; use this file only to change how one is shown. Each key is a skill name, matched after
normalization (lower case, only letters, digits, `+` and `#` kept), so `"Node.js"` and `"nodejs"` are
the same key. Each value is an object (no other fields):

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `name` | string | no | Display name (default: the spelling of the first entry that uses it). |
| `category` | `"languages"` \| `"tools"` \| `"frameworks"` | no | Group the skill belongs to (default: the list of the first entry that uses it). |
| `icon` | string | no | Path under `public/` (for example `icons/csharp.svg`) or URL. Without an icon (and no built-in one in `src/lib/iconMap.ts`) the skill is shown as text. |

```json
{
  "c#": { "name": "C#", "icon": "/icons/csharp.svg" },
  "nodejs": { "category": "tools" }
}
```

## Validating

```sh
npm run validate   # checks every file; exit 1 and a field path on error
npm run build      # runs the same validation first, so invalid content never ships
```

Errors stop the build. **Warnings** (`warning: ...`) never do:

- `warning: projects/foo: description.ca`: the field is translatable but has no `ca` (or `es`)
  text, so Catalan (or Spanish) shows the English text. For `about.json` the path looks like
  `about: lines[2].rows[0].name.ca`.
- `skills.json override "x" matches no tag in any entry`: nothing uses that skill, or the key is
  misspelled.
- `tag ... has no Latin letters or digits and is ignored as a skill`: a skill name such as `"+++"`
  normalizes to nothing.

## Adding a new section

1. Create `src/data/<key>.json` with an array of entries (the plain entry shape; only the keys
   `experience` and `education` use their special shapes).
2. Register it in `sectionDefs` in `src/lib/content.ts`: import the file and add
   `{ key: '<key>', titleKey: 'section.<key>', file: <imported> }`.
3. Add `'section.<key>'` to the `UiKey` type and to the `en`, `es` and `ca` dictionaries in
   `src/lib/i18n.ts`.

The keys `skills` and `home` are reserved (routes/pages with those names already exist). The top
bar, section view, detail views, Home block (when an entry has `"home": true`) and skill panel pick the
new section up automatically.

## Copying this repo: checklist

1. Replace all placeholder content (anything marked "(placeholder)", "(ejemplo)" or "(exemple)", and
   `you@example.com`) in every file here, and choose which entries get `"home": true`.
2. Replace the photo: put yours in `public/` and set `photo` in `about.json`; delete
   `public/photo-placeholder.svg`. Replace or remove the placeholder images in `public/media/`.
3. Set `prompt.user` and `prompt.host` in `about.json`.
4. Replace the CV: put the real PDF in `public/` (for example `public/cv.pdf`), set
   `"href": "cv.pdf"` on the CV line, delete `public/cv-placeholder.pdf`. Fix or remove the LinkedIn line.
5. **Set the Vite base.** `vite.config.ts` hard-codes `base: '/adriamg101/'`. Change it to
   `'/<your-repo-name>/'` (with both slashes), or to `'/'` if the repo is a user site named
   `<user>.github.io`. Otherwise every asset and path 404s on your copy.
6. Run `npm run validate` and `npm run build`.
7. Enable GitHub Pages: repository Settings > Pages > Source: "GitHub Actions".
   `.github/workflows/deploy.yml` runs `npm test` and `npm run build` and deploys on every push to
   `main` (or manually via "Run workflow"); if your default branch has another name, change
   `branches: [main]` there. Note that `npm test` must pass for the deploy to run.
8. The site is then at `https://<user>.github.io/<repo-name>/` (or `https://<user>.github.io/` for a
   user site), with routes after a `#`, for example `.../#/projects`.
