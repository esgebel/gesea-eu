# GESEA website

The GESEA Educational Programme website, built with **Jekyll** and published with **GitHub Pages**.

The design and the code are kept apart from the words. To change text, add a centre or swap a logo you only edit plain text files. GitHub rebuilds the website by itself 1–2 minutes after you save.

---

## Part 1 – Editor's manual (no coding needed)

### How to edit a file on GitHub

1. Open the repository on github.com and click the file you want to change.
2. Click the **pencil icon** (Edit this file).
3. Make your change. Keep the spaces at the start of each line exactly as they are.
4. Scroll down, write a short note in **Commit message** (for example "Update Level 1 text") and click **Commit changes**.
5. Wait 1–2 minutes and reload the website. The **Actions** tab shows a green tick when the new version is online.

If something goes wrong, open the file's **History** and restore the previous version.

### Where each piece of text lives

| What you see on the website | File to edit |
| --- | --- |
| Menu, "OSP Log in" link, "Get Started" button, footer links | `_data/navigation.yml` |
| Every heading and paragraph on the home page (hero, philosophy, OSP, assessment, centres, community, final) | `_data/home.yml` |
| Text inside the GESEA Pathway (each stage, the scrolling steps, the Expert Level disciplines) | `_data/pathway.yml` |
| The four programmes in "A structured path to certification" | `_data/certification.yml` |
| The introduction on the GESEA Centres page | `centres/index.md` |
| One centre's page (description, team, address, website, logo) | `_centres/<centre-name>.md` |
| Site name, description, sessions settings | `_config.yml` |

### Rules for `.yml` files

- Text goes between double quotes: `title: "Train first."`
- If your text contains a double quote, use single quotes around it instead: `title: 'The "best" course'`
- Lines starting with `#` are notes for editors and do not appear on the website.
- A dash `-` starts a new item in a list. Copy an existing item to add a new one.
- Never use the Tab key. Use spaces.

### Add a new centre

1. Put the centre's logo in `assets/img/centres/`. Click **Add file → Upload files**. A wide PNG, JPG or WEBP of about 320 × 160 pixels is enough.
2. Open the `_centres` folder, click **Add file → Create new file** and name it after the centre in lower case with hyphens, ending in `.md`, for example `_centres/university-of-example.md`. The file name becomes the web address: `/centres/university-of-example/`.
3. Paste this template and fill it in:

```yaml
---
name: "Short name shown on cards"
title: "Full official name shown at the top of the centre page"
type: diploma            # diploma | training | robotics
city: "City"
country: "Country"
lat: 50.8834             # latitude  (right-click the place in Google Maps to copy it)
lng: 4.7124              # longitude
logo: "/assets/img/centres/university-of-example.webp"
website: "https://www.example.org/"
email:
  - "info@example.org"
phone:
  - "+32 16 00 00 00"
address:
  - "Street and number"
  - "City"
  - "Country"
team:
  - name: "Prof A. Example"
    role: "Director"
  - name: "Dr B. Example"
    role: "Chief Mentor"
calendar_keywords:
  - "university of example"
---
Write the "About the centre" text here. Leave an empty line between paragraphs.
```

4. Commit. The centre automatically appears on:
   - the GESEA Centres page (list and filters)
   - the world map and the list on the home page
   - the rotating globe

If a field is unknown, leave it empty (`website: ""`, `email: []`). The page then shows a clear "to be supplied" note instead of a gap.

### Remove a centre

Open the centre's file in `_centres/`, click the **⋯** menu → **Delete file**, and commit. You can also delete its logo from `assets/img/centres/`.

### Change a centre's details

Open its file in `_centres/` and edit the lines between the two `---` lines (details) or the text below them (description).

### Training and certification sessions

You do **not** enter sessions on this website. Each centre page reads them live from the **ESGE Educational Calendar** (esge.org/events). When a GESEA event is published there, it appears on the centre page. Upcoming events show under "Upcoming", finished ones under "Past", and the next one appears at the top of the page and on the centre's card.

- An event is linked to a centre when one of the centre's `calendar_keywords` appears in the event's **venue** or **organiser** name on esge.org. If a session does not show up, add a word from that venue or organiser name to `calendar_keywords`.
- Only events with "GESEA" in the title, category or organiser are shown. This can be switched off in `_config.yml` (`only_gesea: false`).
- If the calendar cannot be reached, the site shows a saved copy (`assets/data/sessions-snapshot.json`, dated) and says so under the heading.

### OSP screenshots

1. Upload the images to `assets/img/osp/`.
2. In `_data/home.yml`, under `osp → tabs`, fill in `screenshot: "/assets/img/osp/your-file.png"` for "For doctors" and for "For centres".

While `screenshot` is empty, the website shows a labelled placeholder frame.

### Pathway text

All words in the pathway diagram panels are in `_data/pathway.yml`, one block per stage:

- `l1` Level 1
- `l2` Level 2
- `l2m` / `l2e` Level 2 MIGS / ECRES
- `migs` / `ecres` the diplomas
- `robc` / `robd` Robotics Certificate / Diploma
- `expM` / `expE` Expert Level for MIGS / ECRES

The shape of the diagram (boxes, arrows, colours) is code. Ask the developer before changing it.

---

## Part 2 – Technical notes (for whoever maintains the code)

### Folder structure

```
_config.yml            site settings, centres collection, defaults
_data/                 all editable text (YAML)
_centres/              one Markdown file per centre (collection, output: true)
_layouts/              default, home, centres (list), centre (detail)
_includes/             head, nav, footer, icons, OSP block, world-map SVG paths, centres JSON
assets/css/            home.css (home page), centres.css (centres pages)
assets/js/common.js    menu, smooth scroll, ESGE calendar loader + matching
assets/js/pathway.js   pathway diagram (shape in code, words from _data/pathway.yml)
assets/js/home.js      reveals, certification scroll, OSP tabs, centres map, globe, logo intro
assets/js/centres.js   list filters, sessions, locator map
assets/data/           land-110m.geojson (globe + locator map), sessions-snapshot.json
assets/img/            logo parts, centre logos, OSP screenshots
```

### External libraries (loaded from CDNs, pinned versions)

- GSAP 3.12.5 and ScrollTrigger (home only)
- Lenis 1.1.13 (home only)
- d3 7.9.0 (home globe and map, centre locator map)
- Poppins from Google Fonts

### Sessions API

The site reads `https://www.esge.org/wp-json/tribe/events/v1/events` (The Events Calendar REST API) from the browser, 50 events per page, from 1 January of the current year. The result is cached in the visitor's `sessionStorage` for one hour. Cross-origin requests to this endpoint are allowed by esge.org. If that ever changes, the site falls back to `assets/data/sessions-snapshot.json`. To refresh the snapshot, export the same API response and keep the fields `title, start, end, url, organizer, venue`.

### Home map projection

The land shapes in `_includes/home/world-map-paths.svg` were drawn with d3 `geoNaturalEarth1()` at scale `181.3127` and translate `[500, 301.77]` (viewBox 1000 × 530). `home.js` uses the same numbers to place the centres, so keep them in sync if the SVG is ever regenerated.

### Publishing with GitHub Pages

1. Repository **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
2. Set `url` and `baseurl` in `_config.yml`:
   - Project page `https://<org>.github.io/<repo>/` → `url: "https://<org>.github.io"`, `baseurl: "/<repo>"`
   - Own domain (e.g. gesea.eu) → add the domain under Settings → Pages → Custom domain, and set `baseurl: ""`

### Preview on your own computer (optional)

Requires Ruby. Run `bundle install` once, then `bundle exec jekyll serve` and open http://localhost:4000.
