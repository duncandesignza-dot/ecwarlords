# EC Warlords website - start here

Claude Code reads this file automatically. It is the short, current
summary for picking the project up in a new session or on another account.
For the full history and reasoning behind decisions, read
**`PROJECT-NOTES.md`**. It is a running log, so where an older section
disagrees with a later entry (the dated bullets under "Things explicitly
requested and done" near the bottom), the later entry wins.

## What this is

Website for the **Eastern Cape Warlords**, a tabletop wargaming club in
Gqeberha (Port Elizabeth), South Africa: https://ecwarlords.co.za

- Plain multi-page HTML/CSS/JS. No framework, no build step, no package.json.
- Shared files: `style.css`, `script.js`, `assets/`. Each page may also have
  its own inline `<style>`/`<script>`.
- Hosted on **GitHub Pages** from the `main` branch (`CNAME` =
  ecwarlords.co.za), with **Cloudflare** (free plan) in front for caching.
- Main pages plus `404.html`: home (`index.html`), about (menu name "The
  Lore"), gallery ("The Armoury"), members ("The Roster"), news ("The
  Dispatch"), `battlefield` ("The Battlefield", hub for events, standings and tournaments, which
  all highlight "The Battlefield" in the menu), games, join, and one page per game
  (`warhammer-40k`, `age-of-sigmar`, `kings-of-war`, `dungeons-and-dragons`,
  `star-wars-legion`, `trench-crusade`, `blood-bowl`, `board-games`), plus
  `privacy`. Game pages are built from the `.gp-*` styles at the end of
  `style.css`; photo boxes marked `IMAGE PLACEHOLDER` are for images still to
  come.
- **The Tools section was removed on 2026-09-28 at the owner's request.**
  That covered the Tools hub, Dice Roller, Damage Calculator, Army Builder,
  Datasheet Lookup, Turn Tracker, Mission Tracker, the Factions page, their
  data (`assets/data/`) and the data scripts (`parse.py`, `build/`). All of
  it is still in git history (before PR #12) if it's ever wanted back.
  Don't re-add tools unless asked.

## How changes go live (the owner's workflow)

1. Work on a branch, commit, push.
2. Show the owner screenshots of anything visual before merging (they
   like before/after comparisons).
3. When they say **"merge"**, open a PR into `main` and merge it. `main` is
   live within a minute or two. Don't merge without being asked.
4. Remind them they can "Purge Everything" in Cloudflare if the old version
   still shows.

The owner writes short requests, often with a screenshot. Reply in plain,
non-technical language.

## House rules (things that have bitten before)

- **Cache-busting:** `style.css` and `script.js` are loaded as
  `style.css?v=NNNNNNNNNNNN`. Whenever either file changes, bump the number
  on **every** HTML page (including `404.html`), all to the same value:
  `V=$(date +%Y%m%d%H%M); sed -i -E "s/(style\.css|script\.js)\?v=[0-9]+/\1?v=$V/g" *.html`
  See `CACHE-BUSTING.md`.
- **Replacing an image: use a NEW filename.** Cloudflare lets browsers keep
  images for a month, so a same-named replacement won't show for returning
  visitors.
- **Copy style:** plain hyphen `-`, never the long dash (em dash). UK
  spelling ("Armoury", "colour"). Wednesdays 7-10 PM is club night.
- **Internal links have no `.html`** (`href="gallery"`, home is `href="./"`).
  GitHub Pages resolves them. Consequence: **never create a folder with the
  same name as a page** (a `tools/` folder once broke the Tools link).
- **`404.html` uses root paths** (`/style.css`, `/assets/...`,
  `href="/gallery"`) because it can be served at nested URLs. Keep it that way.
- **The nav and footer are copied into every page, `404.html` included.**
  Change them everywhere, ideally with a script, then check they all match.
- **Real content only.** Armoury pieces and Dispatch posts are real (the
  Dispatch mirrors the club's Facebook page). Don't invent members, results
  or events. See "Open items" for the placeholder pages.
- Code identifiers keep the old spelling (`.home-armory`,
  `armory-banner.webp`, `HOME_ARMORY_PICKS`). Only visible text says
  "Armoury".

## Design system

- Warlords colours and fonts are fixed: crimson/bone on near-black, with
  Cinzel for headings and Rajdhani for body text (tokens on `:root` at the
  top of `style.css`).
- Buttons, cards, chips and the menu are styled to match the club's other
  product, the **Livery Ledger** app (repo `duncandesignza-dot/warhammer40k`,
  `css/styles.css`). This means rounded corners (`--r-sm` 10px ... `--r-xl`
  26px), slightly see-through surfaces, and a **crimson glow on hover
  instead of a lift**. Pills are used for filters, chips and tabs.
- All of that lives in the **"LIVERY LEDGER COMPONENT LAYER"** blocks at the
  end of `style.css`. Rules there are prefixed with `html` so they also beat
  page-level `<style>` blocks. New components should use `var(--r-lg)` and
  `var(--glow)` on hover.
- Buttons always have light text on red, including on hover. The owner
  dislikes dark-on-red.
- Header: crest only (no text), the menu as a rounded tab bar, and **Join Us
  as a separate red button** (`.nav-join`). The phone menu keeps its own Join
  Us inside `.navlinks`.
- Footer background is near-black `#080505`, like the header.
- The Battlefield page's Events, Standings and Tournaments cards reuse the
  old `.tool-card` styles (`.tool-card.hub-card`), so keep that CSS. `style.css` still has
  some unused styles from the removed tool pages (`.ab-*`, `.dl-*`, `.tt-*`,
  `.fcard`, dice and tracker styles); they're harmless and can be pruned.

## Adding a page

Copy the `<head>` of an existing page. Every page has:
- a title like `Page - Subtitle | EC Warlords` (under about 60 characters)
  and a meta description under 160 characters;
- `og:`/`twitter:` tags, including a 1200x630 share image in `assets/og/`
  (the page banner darkened with the crest on top, rendered with Playwright);
- a `theme-color` meta tag, the icon links (`assets/icons/`) and a link to
  `manifest.webmanifest`;
- a JSON-LD `<script id="ld-page">` block (a BreadcrumbList);
- the gtag snippet and the current `?v=` number.

Then add the page to `sitemap.xml` and link it from the nav or a hub page.

## Common content tasks

- **New Dispatch post:** add a `.news-item` at the top of `#newsFeed` in
  `news.html`, newest first. Five items stay visible and the rest get
  `is-extra`, which puts them behind "Show all". For text-heavy graphics use
  `<div class="news-media contain">` so they aren't cropped. The homepage
  pulls the three newest posts from news.html by itself, but also update the
  built-in fallback cards in `#homeDispatch` in `index.html`.
- **Armoury pieces:** the `ARMY_DATA` array in `script.js`.
  `HOME_ARMORY_PICKS` chooses which ones appear on the homepage.
- **League logos and standings:** `standings.html` (`.lg-head` per tab).

## Testing before you push

```
python3 dev/serve.py &          # GitHub-Pages-like server on :8765 (extensionless URLs + 404)
node dev/smoke-test.js          # every page at 1300px and 375px: JS errors, broken files, overflow
```

Playwright and Chromium are needed for the smoke test (they're pre-installed
in Claude Code cloud sessions). For visual changes, take screenshots at
desktop and phone width and look at them. Beware `html{scroll-behavior:smooth}`
when scripting scroll positions: use `behavior:'instant'`.

## Open items (need the owner's input)

- **Placeholder content:** the Standings tables say "Coach name" etc., the
  Events page dates may not be real and the page isn't in the nav, and the
  Roster spotlight isn't filled in. Also unconfirmed: the About page facts
  ("founded 2019 in a garage", venue "The Bastion Hall").
- No venue street address or map, no visible contact email or number, and
  no privacy notice (the site uses Google Analytics; South Africa's POPIA).
- "Crusade of Embers" is still named on the About and Events pages. The 40k
  league on Standings is now "Battle of the Bay". Ask whether to rename the
  others.
- Google Search Console showed "Couldn't fetch" for the sitemap on the day
  it was submitted (2026-09-27). The file is valid; recheck it later, and if
  it's still failing, check Cloudflare Bot Fight Mode.
