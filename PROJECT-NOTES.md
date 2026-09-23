# EC Warlords Website — Project Notes

Reference doc summarizing the site's structure, conventions, and content
policy as of this conversation. Read this before making further changes so
new work stays consistent with what's already been established.

## Club identity

- **Full name:** Eastern Cape Warlords ("EC Warlords" for short — used in the
  nav bar and browser tab; the full name is used in the footer).
- **Location:** Port Elizabeth (Gqeberha), Eastern Cape, South Africa.
- **Scope:** Warhammer 40,000, Age of Sigmar, Kings of War, Dungeons &
  Dragons, Blood Bowl, and board games generally — not a 40k-only club, even
  though most current content skews 40k. `games.html` (see below) is the
  canonical list of systems played.
- **Real Facebook page:** facebook.com/profile.php?id=61572983876990 (source
  for all Dispatch page content).
- **Domain:** ecwarlords.co.za, hosted on GitHub Pages
  (`duncandesignza-dot.github.io/ecwarlords` is the underlying Pages URL).
  Confirmed by the `CNAME` file in the repo root (contents: `ecwarlords.co.za`).
- **Contact email on file:** oliverwalterbillson@gmail.com

**Club nights: Wednesdays, 7–10 PM** (open painting from 6 PM) — changed
from Thursdays on 2026-09-23 at the user's request. Every "Thursday"
reference sitewide was switched (footers on all pages, homepage CTA and
Snapshots copy, About "When", Join step 1, Games, Tools, Events). The
Events page's sample club-night dates were moved back a day to Wednesdays
(Sep 23, Sep 30, Oct 7, Oct 14, Nov 4) and the painting clinic's "first
Thursday of the month" became "Monthly session".

**Join form → WhatsApp (2026-09-23):** `join.html`'s form has no backend.
On submit, `script.js` builds a message (name, experience, faction, optional
message) and opens `https://wa.me/27724749572?text=…` — WhatsApp to the
club on **+27 72 474 9572** (`CLUB_WHATSAPP` constant in `script.js`; change
it there if the number changes). The email field was replaced with an
"Experience" dropdown since replies come back over WhatsApp.
**Social links:** Discord and Instagram were removed (they were dead `#`
links). The only social link is the real Facebook page. Join step 04 is
now "Follow along" (Facebook); Events and Standings copy that mentioned
Discord now point to Facebook or just "an officer". Unused `ico-discord` /
`ico-camera` symbols were deleted from the page sprites.

**Caching / Cloudflare (decided 2026-09-23):** GitHub Pages serves every file
with a fixed 10-minute cache (`max-age=600`) that can't be changed from the
repo, which Lighthouse flags as "Use efficient cache lifetimes". The user
chose to put Cloudflare's free plan in front of ecwarlords.co.za (GitHub
Pages stays the host) with two Cache Rules: CSS/JS → Browser TTL 1 year
(safe because of the `?v=` cache-busting), images/fonts → Browser TTL 1
month. HTML is left on the default short cache so page edits show quickly.
SSL/TLS mode must be **Full** (Flexible causes redirect loops with GitHub's
Enforce HTTPS). **Consequence for future work: when replacing an image, give
it a NEW filename** (e.g. `banner-v2.webp`) and update the references —
returning visitors can keep an old same-named image cached for up to a month.
After uploading changes, "Purge Everything" in Cloudflare (Caching →
Configuration) clears Cloudflare's copy.

## Site structure

Plain multi-page HTML/CSS/JS site — no build step, no framework. Shared
files: `style.css`, `script.js`, `assets/` (all images).

**Nav-bar pages** (all eight appear in every page's `.navlinks`):

| Page | File | Nav label |
|---|---|---|
| Home | `index.html` | Home |
| About | `about.html` | About |
| Painting gallery | `gallery.html` | The Armory |
| Members/leadership | `members.html` | The Roster |
| News feed | `news.html` | The Dispatch |
| Games played | `games.html` | Games We Play |
| Tools hub | `tools.html` | Tools |
| Join info | `join.html` | Join Us |

**Orphan pages** (exist, work, and are cross-linked from other pages, but
have no link in the main nav — worth deciding whether that's deliberate):

| Page | File | Linked from |
|---|---|---|
| Events calendar | `events.html` | not linked from nav; nothing currently links *to* it either — reachable only by direct URL |
| League standings / Hall of Champions | `standings.html` | linked from `events.html` (a fixtures link) and mentioned in prose on `games.html` |

**Tools sub-pages** (linked from the `tools.html` hub, not from the main nav):

| Tool | File | Status |
|---|---|---|
| Dice Roller | `dice-roller.html` | Live |
| Damage Calculator | `damage-calculator.html` | Live |
| Turn Tracker | `turn-tracker.html` | Live |
| Army List Builder | `army-builder.html` (linked as `href="army-builder"`) | Live |
| Datasheet Lookup | `datasheet-lookup.html` (linked as `href="datasheet-lookup"`) | Live — 35 factions, 1,485 datasheets |
| Factions | `factions.html` (linked as `href="factions"`) | Live — 27 factions (see "Factions page" section below) |
| Mission & Objective Tracker | `mission-tracker.html` (linked as `href="mission-tracker"`) | Live — see "Mission & Objective Tracker" section below |

**Internal links have no `.html` extension** (e.g. `href="gallery"`, home
links use `href="./"`). This relies on GitHub Pages' automatic extension
resolution — it only works when served by an actual web server, not when
double-clicking the files locally.

## Known gaps

- **`ARMY-BUILDER-PLAN.md`** — referenced by name in `parse.py`'s docstring
  (as the spec for the data schema and an IP-related section explaining why
  the parser deliberately avoids rules prose). Not in this project.

`about.html` and `army-builder.html` were previously listed here as missing
from the synced project files — both have since been confirmed present,
read, and edited. No longer gaps.

`parse.py` (project root) is a BattleScribe `.cat` → JSON converter that
pulls from the BSData/wh40k-10e repo to feed the Army List Builder — one
faction at a time (`python3 parse.py Orks.cat orks ../../assets/data/orks.json`),
34 factions total per `tools.html`'s copy.

**2026-09-21: bug fixed in `parse.py`.** The `parse()` function's return dict
called `enhancements(root)`, but the function actually defined in the file
is named `detachments(root)` — a `NameError` on every run. This means the
`enhancements` field in the generated faction JSON was never successfully
produced by this exact version of the script (something else must have
generated the JSON currently live on the site, or an earlier working
revision existed outside this project). Fixed to call `detachments(root)`.

**Also found while testing the fix (2026-09-21, not yet fixed):**
`detachments()` only recognizes the "`<Detachment Name> Enhancements`"
nested-subgroup pattern for grouping enhancements per detachment. Tested
against live BSData files: Orks (11 enhancements, groups correctly) works;
Necrons and Tyranids both come back with 0 enhancements even though their
`.cat` files do have an `Enhancements` group — for those factions the
individual enhancement entries sit directly under the top-level
`Enhancements` group with no per-detachment subgrouping, so the function's
subgroup-only logic finds nothing. Likely affects other factions with the
same flat structure. Not fixed yet — flagging since it means the Army
Builder's enhancement picker is probably silently empty for more factions
than just those two. Worth a follow-up pass through `detachments()` to
also handle flat (non-nested) `Enhancements` groups.

**2026-09-21: `army-builder.html`'s live JS does not match `parse.py`'s
output schema — significant finding, unresolved, data kept deliberately
separate.** While building the Datasheet Lookup, reading `army-builder.html`'s
actual JS (via `project_search`) turned up field names it expects that
`parse.py` does not produce: `unitSizes` (parse.py: `models`), `options`
(parse.py: `wargear`), `detachments` at the top level (parse.py: `enhancements`,
pointing at what `detachments()` returns), `leads`/`transport` fields with no
`parse.py` equivalent, and uppercase keyword checks like
`(s.keywords||[]).indexOf('CHARACTER')` where `parse.py` emits BSData's native
Title Case ("Character"). Combined with the `enhancements`/`detachments`
NameError bug above, this means **this project's `parse.py` could not have
generated the JSON the live Army Builder actually runs on** — something else
(a different or earlier script, not present in this project) must have. This
was not investigated further or fixed — reverse-engineering the Army
Builder's real schema was out of scope for this pass. Decision made instead:
keep the Datasheet Lookup's data completely separate, in its own
`assets/data/lookup/` namespace with its own `index.json`, so there is zero
risk of this mismatch (or a regeneration) breaking the live Army Builder. If
the Army Builder's data ever needs regenerating, its actual expected schema
should be reverse-engineered from `army-builder.html`'s JS first — don't
assume `parse.py`'s current output shape is it.

## Datasheet Lookup (2026-09-21, live)

Decision from planning discussion: the tool surfaces unit stat blocks and
weapon profiles (the numbers people actually need mid-game) plus
ability/keyword **names**, but does NOT host GW's ability rules text —
that's a step further into IP exposure than this project has gone before.
Full rules wording links out to Wahapedia per-unit instead of being hosted
here.

`parse.py` was extended and tested against live BSData files (Orks, Necrons,
Tyranids first — three structurally different factions: squad-heavy,
vehicle/character-heavy, monster/swarm-heavy — then all 35 real playable
factions):

- **`stats`** — per datasheet, one row per distinct model type in the unit
  (e.g. Boyz has a "Boy" row and a "Boss Nob" row), each with M/T/SV/W/LD/OC.
- **`weapons`** (new **faction-level** field) — a deduplicated pool of every
  weapon profile in the faction (Range/A/BS-or-WS/S/AP/D + the weapon's own
  Keywords characteristic, e.g. "Pistol", "Blast"). Deduped by exact stat
  signature, not just name, so a Warboss's Big Choppa (hits harder) and a
  Boyz Boss Nob's Big Choppa stay separate pool entries even though they
  share a name. Each datasheet's own `weapons` field is a list of ids into
  this pool.
- **`abilities`** — per datasheet, a list of ability/named-rule **labels
  only** (e.g. "Waaagh!", "Invulnerable Save (5+)", "Piston-driven
  Brutality"). The extractor deliberately never reads a profile's
  `Description` characteristic (the actual GW rules text) and stops
  descending the moment it enters a weapon's own subtree, so weapon-level
  rule tags (Pistol, Twin-linked...) don't leak into the unit's ability
  list — confirmed clean against all three test factions.

Implementation notes for whoever picks this back up:
- Weapon and stat profiles are frequently **not** inline on the datasheet's
  top-level entry — they're reached via an `entryLink` (sometimes several
  hops, e.g. Necrons/Orks' "Gretchin"-style squads: a wrapper entry links to
  a separate model entry that holds the real stat block). `reachable_nodes()`
  in `parse.py` resolves this, cycle-safe, and both `datasheet_stats()` and
  `collect_weapons()` use it. `datasheet_abilities()` deliberately does
  **not** use it (see above — would leak weapon rule tags).
- A handful of top-level entries per faction (e.g. Orks' standalone "Loota",
  "Burna Boy", "Grot Tanks" — singular component entries, not real
  datasheets) come back with an empty `stats` list. This is a pre-existing
  quirk of the original top-level loop (`type in ('model','unit')` sweeps up
  more than just real datasheets) — the real plural datasheets ("Lootas",
  "Burna Boyz") parse correctly with full stats. Not fixed, to avoid
  touching the loop the live Army Builder already depends on. `main()` now
  prints which datasheet names came back with no stat block, per faction, so
  this is easy to spot when regenerating data.
- Verified zero occurrences of the string `"Description"` in generated JSON
  output — confirms no rules prose is leaking through.

**Library-catalogue extension.** 7 of the 35 faction `.cat` files have no
`sharedSelectionEntries` of their own at all — Craftworlds, Drukhari, Ynnari,
Chaos Daemons, Chaos Knights, Astra Militarum, and Imperial Knights are built
entirely from a shared BSData "Library" catalogue, referenced via
`catalogueLinks` + top-level `entryLinks` stubs pointing at the real
datasheet entries by `targetId`. `parse()`'s signature changed from
`parse(path, faction_id)` to `parse(paths, faction_id)` — `paths` can be a
single string (back-compat) or a list, main faction file first followed by
any library file(s) it needs, e.g.:
```
python3 parse.py "Aeldari - Craftworlds.cat" "Aeldari - Aeldari Library.cat" \
    craftworlds ../../assets/data/lookup/craftworlds.json
```
A new `gather_datasheet_entries()` tries `sharedSelectionEntries` first, and
falls back to resolving the root-level `entryLinks` against a combined index
built across every file passed in. This is the single biggest piece of new
parser logic this session — without it, those 7 factions (including
Craftworlds and Astra Militarum, both large/popular) would have no Datasheet
Lookup data at all.

**Full batch generation, done.** All 35 real playable factions (28 direct,
7 via the library-catalogue path above) parsed successfully into
`assets/data/lookup/<faction-id>.json`, plus an `assets/data/lookup/index.json`
of `{id, name, file, datasheets, weapons}` per faction. Totals: **1,485
datasheets, 3,955 weapon profiles** across all factions combined
(`astra-militarum.json` is the largest at 137 datasheets; `imperial-fists`/
`raven-guard`/`salamanders`/`white-scars`/`iron-hands` are near-empty since
those chapters' `.cat` files mostly just reference the core Space Marines
library — expected, not a bug). This data is **completely separate** from
whatever `assets/data/*.json` the live Army Builder actually uses — see the
schema-mismatch finding in "Known gaps" above for why.

**Wahapedia outbound link, decided and implemented.** Pattern:
`https://wahapedia.ru/wh40k10ed/factions/<faction-slug>/<Unit-Name-Hyphenated>`
— confirmed against Wahapedia's own `Factions.csv`. The faction-id → slug
map lives as a plain JS object (`WAHA_FACTION`) inline in
`datasheet-lookup.html`, not in the JSON data, specifically so it's easy to
patch without regenerating any faction file. Notable exceptions baked into
that map: Craftworlds and Ynnari both point at Wahapedia's single `aeldari`
page (Drukhari has its own separate `drukhari` page); every Space Marine
chapter (Black Templars, Blood Angels, Dark Angels, Deathwatch, Imperial
Fists, Iron Hands, Raven Guard, Salamanders, Space Wolves, Ultramarines,
White Scars) points at the single `space-marines` page — Grey Knights is the
one chapter-adjacent faction with its own page; "Agents of the Imperium"
maps to Wahapedia's differently-named `imperial-agents`; "T'au Empire" maps
to `t-au-empire` (apostrophe becomes a hyphen, not dropped); "Emperor's
Children" → `emperor-s-children`. The per-unit part of the link is generated
client-side from the datasheet name (apostrophes → hyphens, spaces →
hyphens, other punctuation stripped) — this is best-effort, not guaranteed
to land exactly right for every one of the 1,485 units; the page says so in
its own source-note copy, and a wrong link just 404s on Wahapedia rather
than showing anything broken on our side.

**Page built:** `datasheet-lookup.html`, following the standard tool-page
skeleton (nav/hero/footer) and reusing the Army Builder's `.ab-panel`/
`.ab-search`/`.ab-list`/`.ab-item`/`.ab-kw` CSS rather than duplicating them.
New CSS added to `style.css` under a `/* Datasheet Lookup */` comment block:
`.dl-cols` (two-column layout — list panel + detail panel, versus the Army
Builder's three), `.dl-stats`/`.dl-weapons` (stat block and weapon tables),
`.dl-kwrow`, `.dl-walink`. Faction picker populated from
`assets/data/lookup/index.json`; search filters by unit name, keyword, and
ability name at once; detail view renders every stat-block row (handles
multi-profile squads like Boyz's "Boy"/"Boss Nob"), ranged and melee weapon
tables split out, keyword chips, ability-name chips, and the Wahapedia link
button. `tools.html`'s card swapped from `.tool-card.soon`/`PLANNED` to a
real `LIVE · 35 FACTIONS` link, matching the Army Builder card's pattern.

## Cache-busting (important — do this on every CSS/JS edit)

`style.css` and `script.js` are loaded with a version query string, e.g.
`style.css?v=202609211701`, on every page. **Whenever either file's
contents change, bump this number on all HTML pages** (14 files, not just
six) or visitors may keep seeing a stale cached copy. Full explanation
in `CACHE-BUSTING.md`. Pattern used to bump it:
```
V=$(date +%Y%m%d%H%M)
sed -i -E "s/(style\.css|script\.js)\?v=[0-9]+/\1?v=$V/g" *.html
```

## SEO (added 2026-09-22)

- **Title tag format:** `<title>{Page Name} — {Subtitle}</title>` — no brand
  name in the browser-tab title (explicit user choice). The homepage is the
  one exception, since its "page name" *is* the club name:
  `Eastern Cape Warlords — Tabletop Club in Port Elizabeth`. Every other
  page follows `{Nav label or tool name} — {short benefit/descriptor}`, e.g.
  `About — Everything You Need to Know`,
  `Datasheet Lookup — Search Every Unit & Weapon`. Keep new pages consistent
  with this pattern.
- **Every page's `<head>`** now has, right after the existing
  charset/viewport/title/description block: a `<link rel="canonical">`
  pointing at the extensionless live URL (e.g.
  `https://ecwarlords.co.za/about`; homepage is
  `https://ecwarlords.co.za/`), a full Open Graph set (`og:type`,
  `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image`,
  `og:locale`), and a Twitter Card set (`twitter:card` set to
  `summary_large_image`, `twitter:title`, `twitter:description`,
  `twitter:image`) — then the existing favicon/stylesheet links.
- **`og:title`/`twitter:title`** = `{page <title>} | Eastern Cape Warlords`
  (brand appended — a social card shared out of context needs the brand
  even though the browser tab doesn't), except the homepage, whose title
  already contains the brand so it isn't duplicated.
- **Default social preview image:** `assets/logo.webp` (the club crest),
  absolute URL, on every page — user's explicit choice over a photo banner.
  If a page ever wants its own preview image instead, override just that
  page's `og:image`/`twitter:image`.
- **Homepage-only JSON-LD** (`SportsOrganization` schema, inserted right
  before `</head>` in `index.html`): name, logo, description, contact
  email, Facebook `sameAs` link, and a `PostalAddress`
  (Gqeberha/Port Elizabeth, Eastern Cape, ZA). Deliberately homepage-only —
  standard practice for org-level structured data, don't duplicate it on
  every page.
- **New root files:** `robots.txt` (`Allow: /` for all agents, points at the
  sitemap) and `sitemap.xml` (all 15 real pages, extensionless URLs,
  `lastmod` 2026-09-22, priorities weighted toward Home/Join/Gallery/News).
  Neither existed before this pass. **Update `sitemap.xml`'s URL list and
  `lastmod` dates whenever a page is added, removed, or meaningfully
  rewritten** — nothing automates this, unlike the cache-bust version
  string.
- Meta descriptions were reviewed and lightly tightened for length
  (~140–160 characters, the range search engines actually display) during
  this pass; the underlying facts in them weren't changed.
- `og:description`/`twitter:description` are set to the same value as the
  page's `<meta name="description">` — keep these three in sync on future
  edits rather than letting them drift apart.
- No cache-bust needed for this kind of change (head-only, `style.css`/
  `script.js` untouched) — but if a future SEO edit also touches CSS/JS,
  the usual cache-bust rule above still applies.

## Design system

- **Colors:** dark grimdark palette, crimson-dominant (not gold — an earlier
  gold-heavy version was explicitly replaced). Tokens defined as CSS
  variables at the top of `style.css` (`--crimson`, `--crimson-bright`,
  `--bone`, `--void`, etc).
- **Fonts:** Cinzel (display/headings), Rajdhani (body/UI).
- **Page hero banners:** each subpage's `.subhero` (and the homepage `.hero`)
  uses the shared `.texture-void` class, which paints a dark gradient overlay
  over a background image for legibility. The image itself is controlled by
  a CSS custom property, `--hero-img`, set inline per page:
  - Home: default banner (`assets/banner.jpg`) + two flanking character
    cutouts (`hero-left.webp` = Space Marine, `hero-right.webp` = Ork),
    hidden under 880px width. The same two flank images (`page-flank-left` /
    `page-flank-right`) now also appear pinned to the page edges on the
    newer tool/games/events/standings pages.
  - About → `assets/about-banner.webp`
  - Armory → `assets/armory-banner.webp`
  - Roster → `assets/roster-banner.webp`
  - Dispatch → `assets/dispatch-banner.webp`
  - Join → `assets/join-banner.jpg`
  - Games → `assets/games-banner.webp`
  - Events / Standings → both currently reuse `assets/banner-news.jpg`
  - Tools → no `--hero-img` override (uses whatever `.texture-void` default
    falls back to)
  To give a page its own banner: add `style="--hero-img:url('assets/x.webp');"`
  to that page's `.subhero` div.
- **Logo:** `assets/logo.webp`, transparent background (not a filled tile —
  don't re-add box-shadow/border-radius framing around it).
- **Nav brand text:** the `.brand` link (logo + wordmark) reads just
  "TABLETOP COMMUNITY" — the "GQEBERHA" subtitle span (`.b-sub`) was removed
  sitewide 2026-09-21 along with its CSS (font-size trimmed slightly,
  `line-height:1` added to keep the single remaining line tight against the
  logo). Don't re-add a `.b-sub` line under the wordmark without being asked.
- **Page-specific CSS:** the newer pages (`games.html`, `events.html`,
  `standings.html`) each carry their own `<style>` block in the `<head>`
  for page-specific components (`.game-card`, `.ev-*`, `.lg-*`) rather than
  adding those rules to `style.css`. `tools.html`'s `.tool-card`/`.tool-grid`
  and the Army Builder's `.ab-*` rules, dice tray (`.dice-tray`/`.die`) and
  turn tracker (`.tt-*`) rules, by contrast, *are* in `style.css`. No stated
  reason for the split — worth asking before assuming a pattern either way.

## The Armory (gallery.html) — real content only

**Every entry must be a real photo of a real member's real painted model.**
All fictional placeholder entries were explicitly removed at the user's
request — do not add new fictional/placeholder entries even to fill out a
faction filter. If a filter category has zero real entries, remove its
filter chip rather than leaving it to show an empty grid (re-add the chip
later if a real entry for that faction shows up).

Gallery data lives in `script.js` as the `ARMY_DATA` array. Each entry:
```js
{faction:'marines', label:'SPACE WOLVES', title:'...', painter:'...',
img:'assets/....webp', color:'#hex', desc:'...'}
```
`color` is used for the card's background glow, not the model's actual color
scheme necessarily — pick something evocative.

**Faction filter chips currently in use:** marines, custodes, seraphon,
tyranids, chaos, orks (chips only exist for factions with ≥1 real entry).

**Current real painters (as of this conversation):** Steven John Ovens,
Matthew Carslake, Devin Du Plessis, Gabriel Goddard, Oliver Bilson, Sjoerd
Leister. 26 real pieces total.

**When a person's name is given without confirmation the photos are real**,
ask before adding them as that person's own work — this came up once
already (images that turned out to be AI-generated/official product
photography) and got confirmed as real before proceeding. Don't assume.

**HTML-escaping gotcha:** titles/painter names are inserted into `alt=`
attributes via string concatenation in `script.js`. A title containing a
literal `"` character broke this once (see `escAttr()` in the code) and
caused the page to render blank on some mobile browsers. The fix is already
in place, but be aware if writing new titles with quotes, ampersands, or
`<` in them.

## The Roster (members.html)

**Leadership (real, confirmed):**
- Matthew Carslake — Club President
- Oli Billson — Finance
- Phil van Staden — Asset Management
- Steven Ovens — Public Relations

Each officer's ring icon now uses a distinct faction emblem (supplied by the
user as SVG files, converted to `currentColor` fill and embedded as new
sprite symbols): Matthew Carslake → Chaos Space Marines emblem, Oli Billson
→ Deathskulls (Ork clan) emblem, Steven Ovens → Space Wolves emblem, all
recolored solid white; Phil van Staden keeps the original crest icon at the
default crimson-glow color. The circular ring styling itself was left
unchanged for all four.

**Member spotlight grid:** the "Wren Ashby / Tyranids" placeholder card was
replaced with a real-format card for "Culum Morley / Death Guard" (icon:
the remaining uploaded emblem file, recolored white; new quote authored to
match the site's tone). The "Warlord of the Month" spotlight (previously
"Marika Ironbrow Voss") was removed sitewide 2026-09-22 (explicit user
instruction, with a screenshot). The rest of the 6-person spotlight grid
below the officers is still fictional placeholder content, pending real
content. Ask before removing/replacing further entries here.

## The Dispatch (news.html)

Real content sourced from the club's actual Facebook page (see URL above).
Currently 12 posts, Dec 30 2025 → May 12 2026, each with real photos except
one: "Sunday gaming, done" (a shared post from another page, The Gaming
Guild — no photo was available for that one specifically).

If asked to pull more posts from Facebook: the feed uses virtualized
scrolling that's prone to silently stalling after ~2 posts, especially on a
fresh page load. Expanding "See more" via a JS click-all snippet and reading
`get_page_text` works better than relying on scroll + screenshot alone, but
expect to hit a hard stall eventually — don't burn excessive turns fighting
it if it happens again.

## Games We Play (games.html)

Card grid, one per system: Warhammer 40,000 ("flagship," weekly pickup +
narrative campaign "Crusade of Embers" + 3v3 mixed-army nights), Age of
Sigmar, Kings of War, Dungeons & Dragons, Blood Bowl (its own running
league — Season 1 champions were "the Fossil Fuels," Season 2 underway on
3rd-edition rules), and Board Games generally. Logos are real image assets
(`w40k-logo.png`, `aos-logo.png`, `kow-logo.webp`, `dnd-logo.svg`,
`bloodbowl-logo.png`) except Board Games, which uses an inline SVG die icon
instead of a logo.

Note (2026-09-21 audit): every interactive tool on the site (Army Builder,
Datasheet Lookup, Dice Roller, Damage Calculator) and the entire Armory
gallery are 40k-only despite this page's broader system list — a real
content gap between what the club plays and what the site's tools/gallery
actually serve. Flagged to the user, not yet acted on.

## Events (events.html)

Calendar list grouped under "This month" / "Next month" headings, each
event showing date, kind (Club Night / Painting Clinic / Campaign Night /
League Night / Tournament), time, tags, and either an RSVP button or a seat
count. Currently shows real-looking near-term dates (Sep 24 → Nov 5 2026)
including one full tournament ("Embers Open," 24/24, waitlist only). Not
yet confirmed with the user whether these are real scheduled events or
illustrative placeholders — worth checking before treating the dates as
authoritative. Not linked from the main nav (see "Site structure" above).

## Standings (standings.html)

Tabbed page (Blood Bowl / Warhammer 40,000), each tab showing a live-style
league table, a fixtures/session-status table, and a shared "Hall of
Champions" grid below both tabs. The season **structure** looks real
(Blood Bowl Season 2, round 4 of 7 played; 40k "Crusade of Embers," session
3 of 6) but every actual row is still a placeholder — "Coach name" / "Team
or race" / "Player name" / "Faction" / "Champion name" repeated down the
table, same unfilled state as the Roster's spotlight section above. Treat
as pending real results, not as real data, until told otherwise.

## Tools (tools.html + sub-pages)

Hub page: a 3-column grid of six "LIVE" tools, with a single full-width
card (Factions) below it (see the Tools sub-pages table above). No sign-up,
client-side only, phone-friendly by design ("no sign-up, no ads, works on
your phone at the table" per the page's own copy).

- **Dice Roller** — full attack sequence (hits/wounds/saves/damage) with
  rerolls, Sustained Hits, Lethal Hits, Devastating Wounds, modified crit
  thresholds; shows every die rolled.
- **Damage Calculator** — attacker vs. defender profile, expected damage
  computed mathematically (not rolled).
- **Turn Tracker** — VP/CP/battle round/phase for both players, optional
  chess-clock timer, persists state across a page reload.
- **Army List Builder** — live, linked from `tools.html` and styled via the
  `.ab-*` rules in `style.css`. Data comes from `parse.py`'s BattleScribe
  extraction (see "Known gaps" and "Datasheet Lookup" above).
- **Datasheet Lookup** — live, 35 factions / 1,485 datasheets. Faction
  picker + live search, per-unit stat block(s), ranged/melee weapon tables,
  ability and keyword chips, and a "View full rules on Wahapedia ↗" outbound
  link per unit. Data lives at `assets/data/lookup/` — deliberately separate
  from whatever the Army Builder's `assets/data/*.json` actually is (see
  "Known gaps" and "Datasheet Lookup" sections above).

## Factions page (factions.html, added 2026-09-22)

A reference/browse page for all 27 currently-playable Warhammer 40,000
factions, grouped by allegiance (Imperium of Man 13, Chaos 6, Xenos 8 — the
user's own count, sourced from a third-party faction list). 3-column card
grid (`.faction-grid`/`.fcard`, 2-col under 980px, 1-col under 640px),
each card showing an icon, allegiance eyebrow, faction name (+ parenthetical
alt-name where one exists, e.g. "Adepta Sororitas — Sisters of Battle"), a
one-sentence description, and two tag chips. A search input (`#factionSearch`)
filters live by name/alt-name/tags/description text, combined (AND'd) with
the allegiance filter chips (`#factionFilterRow`, reusing the existing
`.filter-row`/`.filter-btn` classes from the Armory) — both are wired in
`script.js`'s `factionGrid` block, which also updates a live
"`X` of 27 factions" counter and an empty-state message.

**No official Games Workshop artwork or logos are used.** Rather than source
or approximate real faction heraldry (an IP/trademark risk this project has
avoided before — see the Armory's "real content only" policy and the
Datasheet Lookup's deliberate avoidance of GW's rules prose), each card gets
one of 23 small original SVG icon symbols (`ico-f*`, defined inline in
`factions.html`'s own `<svg><defs>` sprite, same pattern as every other
page's icon set) built from simple abstract shapes — a stylised helm, a
chaos star, a scarab, a sunburst, etc. Several related factions intentionally
share an icon shape (e.g. all six vanilla-pattern Space Marine chapters use
`ico-fhelm`; Imperial Knights and Chaos Knights both use `ico-fknight`;
Tyranids and Genestealer Cults both use `ico-fclaw`) and are told apart by
each card's own accent `color` instead — same "evocative, not literal"
convention the Armory's gallery `color` field already uses.

**Update 2026-09-22 — real faction logos now used for 15 factions (user's
request, user-supplied SVGs).** The user uploaded faction-logo SVGs as
`.txt` files and asked for them to replace the placeholders. Each was
cleaned (XML declaration, C2PA `<metadata>` blob, `<defs><style>` and all
`class`/`id`/`data-name` attributes stripped, contents wrapped in
`<g fill="currentColor">`) and added to `factions.html`'s sprite as
`ico-logo-<faction-id>`, keeping its original viewBox. Mapping:
space-marines ← `space-marines-icon` (helmet), blood-angels, dark-angels,
space-wolves, black-templars, deathwatch, adepta-sororitas,
adeptus-mechanicus, **astra-militarum ← `imperium-of-man-icon`** (aquila —
a judgement call; could equally suit Imperial Agents),
**chaos-space-marines ← `chaos-undivided-icon`** (eight-pointed star),
world-eaters, **death-guard ← `death-guard-icon-40k`** (uploaded in an
earlier session for the Roster, not this batch), thousand-sons, tyranids,
aeldari. Uploaded but unused: `Adeptus-Astartes` (winged skull — alternative
Space Marines mark) and `ultramarines-icon` (no Ultramarines faction card).
The user's list also named drukhari, genestealer-cults, grey-knights and
imperial-knights files, but those four never arrived — those cards, plus
Custodes, Emperor's Children, Chaos Knights, Orks, Necrons, T'au, Votann and
Imperial Agents, still use the original abstract `ico-f*` placeholders (the
12 placeholder symbols no longer referenced were deleted from the sprite).

**Follow-up same day:** `orks-icon` and `leagues-of-votann-icon` SVGs
uploaded and added the same way (`ico-logo-orks`, `ico-logo-leagues-of-votann`),
replacing `ico-ftusk`/`ico-fcoin` (both placeholders deleted). 17 of 27
factions now have real logos. Still on placeholders: Grey Knights, Custodes,
Imperial Knights, Imperial Agents, Emperor's Children, Chaos Knights,
Drukhari, Necrons, T'au, Genestealer Cults.

**Second follow-up same day:** Grey Knights, Imperial Knights, Drukhari and
Genestealer Cults logos added (`ico-logo-*`), placeholders `ico-fhalo`,
`ico-fclaw`, `ico-fthorn` deleted (`ico-fknight` kept — Chaos Knights still
uses it). **21 of 27 real logos.** Still on placeholders: Adeptus Custodes,
Imperial Agents, Emperor's Children, Chaos Knights, Necrons, T'au Empire.

Presentation changed at the same time: logos are drawn in `var(--bone)`
inside a larger 68px badge (40px icon, was 52/28px), and each faction's
accent `color` now tints the badge ring + background (`color + '2e'` alpha)
instead of colouring the icon itself — several accent colours (Deathwatch,
Black Templars) were near-invisible as icon fills on the dark card. Same
white-emblem treatment as the Roster's officer icons.

Descriptions and tags were written fresh for this page (not copied from any
source) — flavour text only, no stat lines or rules text, consistent with
the project's existing GW-IP caution.

**Linked from:** a "Factions" card in `tools.html` (`ico-crest` icon,
`LIVE · 27 FACTIONS` badge) and a "Browse all 40K factions →" text link
added inside `games.html`'s Warhammer 40,000 card. Added to `sitemap.xml`.
This avoids repeating the orphan-page pattern (`events.html`/
`standings.html`) documented above — not added to the main nav itself, to
avoid growing it past its current eight items, but reachable from two
logical entry points instead of only a direct URL.

**Card placement on `tools.html` changed on 2026-09-22 (later same day):**
originally a regular 3-column card positioned after Datasheet Lookup. When
the "11th edition" full-width news card (below) was removed at the user's
request, the Factions card was promoted to take its place — moved out of
the 3-column grid and re-styled as the full-width `.tool-card-wide` card
(same modifier class, same `ico-crest` icon, expanded body copy), so the
grid is now six regular cards with Factions as the single full-width card
underneath. Its own page (`factions.html`) and everything else about it —
data, icons, filtering — is unchanged; only its `tools.html` presentation
moved.

Cache-bust version bumped across all 16 HTML pages (15 existing + this new
one) since both `style.css` (`.faction-toolbar`/`.faction-search`/
`.faction-grid`/`.fcard`/`.f-tag`/`.faction-empty` rules, appended after the
Datasheet Lookup block) and `script.js` (`FACTION_DATA` array + the
`factionGrid` render/filter block, appended after the gallery block) changed.

**Update 2026-09-23 — 28 factions, not 27.** The original list was missing
**Chaos Daemons** (confirmed against Wargamer's faction guide, updated Aug
2026: 13 Imperium / 7 Chaos / 8 Xenos). Added a Chaos Daemons entry to
`FACTION_DATA` (original placeholder icon `ico-fdaemon`, no logo SVG yet)
and updated the "27" copy on `factions.html` and the `tools.html` card to 28.
The Space Marines description now names the Codex Chapters (Ultramarines,
Salamanders, Imperial Fists, Iron Hands, Raven Guard, White Scars) so the
search finds them. They are not separate factions: they play from the main
Space Marines codex, unlike Blood Angels, Dark Angels, Space Wolves, Black
Templars and Deathwatch, which have their own supplements.

**Update 2026-09-23 — Space Marines separated (user choice: "both").**
The six Codex Chapters now have their own cards straight after Space Marines:
Ultramarines (real logo `ico-logo-ultramarines`, from the SVG uploaded
earlier), Salamanders, Imperial Fists, Iron Hands, Raven Guard, White Scars
(original placeholder icons `ico-fflame`/`ico-ffist`/`ico-fgear`/
`ico-fraven`/`ico-fbolt`). Each has `chapter:true` and the sub-line "Codex
Chapter · plays from the Space Marines codex" — they are **not** counted as
factions (still 28 factions; the grid shows 34 "armies", and the counter
now says "X of 34 armies"). New **Adeptus Astartes** filter chip: entries
with `astartes:true` (Space Marines, the six Codex Chapters, Blood Angels,
Dark Angels, Space Wolves, Black Templars, Deathwatch, Grey Knights — 13
cards); the filter code matches `data-astartes="1"` for it.

## 11th edition (added 2026-09-22)

**Important context discovered while doing this work — not yet fully
reconciled with the rest of the site.** Warhammer 40,000 moved to **11th
edition** on 2026-06-20 (Armageddon launch box, Orks vs. Blood Angels).
Confirmed via web research: Games Workshop's own site, Warhammer Community,
Wargamer, Woehammer, GrimSlate. Key facts:
- The **27-faction roster is unchanged** (still 13 Imperium / 6 Chaos /
  8 Xenos, no mergers/splits/renames found) — so `factions.html` (built
  earlier this session, before this was discovered) is still accurate and
  did not need correcting.
- Codexes are rolling out **gradually, not all at once**: only Orks
  (2026-09-05) and Space Marines (2026-10, not yet released as of this
  writing) have 11th-edition codexes. Every other faction still plays on
  its prior rules/points in the interim via GW's free Interactive
  Munitorum Field Manual app.
- **Wahapedia has already stood up live 11th-edition pages** at
  `wahapedia.ru/wh40k11ed/...`, alongside its existing 10th-edition ones.

**Not yet addressed — flagging for a future pass, not fixed here:** the
Datasheet Lookup tool's per-unit outbound links (the `WAHA_FACTION` map
inline in `datasheet-lookup.html`) still point at the old
`wahapedia.ru/wh40k10ed/...` URL pattern. Whether/how to move those to
`wh40k11ed` — and whether Wahapedia's 11th-edition unit-slug scheme even
matches the 10th-edition one closely enough for the existing client-side
name-to-URL generation to still work — was not investigated. Given the
Datasheet Lookup and Army Builder's data pipeline is already documented
above as fragile (`parse.py`'s schema mismatch with the live Army Builder,
the BSData source repo itself being 10th-edition rules data), migrating
either tool to 11th-edition rules/points would be a substantial follow-up
project, not a small edit — raise it with the user before starting it.

A full-width card was added to `tools.html` (last item in `.tool-grid`,
spanning all 3 columns via a new `.tool-card-wide` modifier class —
horizontal icon+text layout on desktop, stacks on mobile) announcing the
edition change and linking out to Wahapedia's 11th-edition hub. Badge text:
"11TH EDITION". New icon: `ico-flag` (a simple pole+pennant shape, same
"original abstract icon" convention as the Factions page's `ico-f*` set).

**Removed later the same day (2026-09-22), at the user's explicit request:**
"take the warhammer 40000 is 11th edition now live card and replace it with
the factions card." The card, its copy, and the now-unused `ico-flag` icon
symbol were deleted from `tools.html` outright — the Factions card (see
above) was moved into the full-width slot instead. The `.tool-card-wide`
CSS class itself was kept (still used by the Factions card), but nothing on
the live site now announces the 11th-edition transition. The research
findings above (edition date, codex rollout status, Wahapedia's
`wh40k11ed` URLs) remain accurate and relevant to the still-open Datasheet
Lookup migration question below — only the on-page announcement card was
removed, not the underlying facts.

## Mission & Objective Tracker (mission-tracker.html, added 2026-09-22)

A new standalone tool page for tracking objective control and secondary
mission scoring per battle round, built to answer "what do we need to do to
get the mission tracker working" (the `tools.html` card had sat as
`PLANNED` since before this session). Two design questions were put to the
user via clarifying questions before building, both resolved with the
recommended option:

- **Own page vs. a panel bolted onto Turn Tracker** → its own page, chosen
  over cramming it into `turn-tracker.html`.
- **Official GW secondary-mission list/scoring vs. a flexible/generic
  scorer** → flexible/generic. GW's actual named secondary missions and
  their point values are copyrighted rules text — the same reasoning that's
  kept Datasheet Lookup from ever hosting GW's ability wording (it links out
  to Wahapedia instead). So Mission Tracker doesn't bake in any official
  mission pack: the user names their own secondaries and sets their own
  point values, which also means it keeps working no matter which mission
  pack (Pariah Nexus, a tournament pack, a narrative campaign, etc.) a game
  is actually using.

**Shares Turn Tracker's saved game, without any code changes to
`turn-tracker.html`'s logic.** Turn Tracker already persists its state to
`localStorage` under the key `ecw-turn-tracker` and loads it via
`Object.assign(state, s)` — which silently preserves and re-saves any extra
fields it doesn't recognise. Mission Tracker reads/writes the same
`ecw-turn-tracker` key and simply adds its own fields on top:
`objPoints` (points per objective, default 5), `objectives` (array of
per-round objective-control picks, P1/P2/contested/none), `primaryLog`
(round-by-round primary-score history), `primaryTotal` (running primary
total per player), and `secondaries` (two arrays — one per player — of
`{name, value}` entries, added/removed/scored freely). Turn Tracker itself
needed zero edits to interoperate.

**VP sync (with a documented tradeoff):** Mission Tracker computes each
player's primary + secondary total and writes it into the shared state's
existing `vp` field (`syncVP()`), so Turn Tracker's own VP counters reflect
Mission Tracker's math next time Turn Tracker is opened or reloaded. The
tradeoff — surfaced in the tracker's own on-page copy, not hidden — is that
a manual VP edit made directly on Turn Tracker will get overwritten the next
time Mission Tracker recalculates. Given the two tools are meant to be used
together for the same game, this was accepted as the right default.

**Page layout:** round stepper (mirrors Turn Tracker's own round control);
an objectives panel — adjustable objective count and per-objective point
value, a grid of objective cells you tap to assign P1/contested/P2/none per
round, a running round-points summary, and a log with "Log Round"/"Undo";
two secondary-mission columns (one per player) where you add a named
secondary and step its score up/down or remove it; a totals panel showing
primary/secondary/grand total per player side by side; and a bottom bar
linking back to Turn Tracker plus a "Reset" (with confirm) that clears only
Mission Tracker's own fields.

**Cross-linked, not an orphan:** the `tools.html` card was converted from
`PLANNED`/`<div class="tool-card soon">` to `LIVE`/`<a href="mission-tracker"
class="tool-card">`, and a line was added to `turn-tracker.html`'s subhero
pointing to Mission Tracker and noting the two pages share a saved game.
Added to `sitemap.xml`. Full SEO head block applied matching the site
convention (title `Mission Tracker — Objectives &amp; Secondary Scoring`).

**HTML-escaping:** secondary-mission names are user-typed text inserted via
string concatenation, same class of risk as Armory titles/painter names —
uses the same `escAttr()`-style escaping discipline documented under "The
Armory" above.

Cache-bust version bumped across all 17 HTML pages (16 existing + this new
one) since `style.css` gained a new block (`.obj-grid`/`.obj-cell`/
`.obj-summary`/`.sec-col`/`.sec-row`/`.sec-add`/`.mt-totals`/`.mt-total-card`,
appended after the Turn Tracker CSS section). `script.js` was **not**
changed for this feature — Mission Tracker's logic lives entirely in its own
inline `<script>` block at the bottom of `mission-tracker.html`, following
the same self-contained-page pattern as `turn-tracker.html`.

## Homepage headline (restyled 2026-09-23)

`index.html`'s hero `<h1>` now uses the Warhammer Academy-style treatment the
user supplied, recoloured to club red: **Anton** (Google Font, added to the
`@import` at the top of `style.css` — used only here), uppercase, solid
white fill with a thick gradient outline running dark grey (`#4f4f4f`, top)
→ `var(--crimson-bright)` (bottom). Markup:
`<h1 class="hero-title"><span class="hero-title__word" data-text="Eastern Cape">…`
— each word's text **must match its `data-text`**, because the white fill is
a `::after` copy drawn from that attribute (the copy uses the
`content: attr(data-text) / ""` alt-text syntax so screen readers don't read
the headline twice). Outline width is `.042em`, so it scales with size.
Size `clamp(2.6rem, 15vw, 8.4rem)` + `white-space:nowrap` keeps "EASTERN
CAPE" on one line from 320px phones up (verified 320/390/768/1024/1440).
`.hero-content` max-width widened 720 → 1000px to fit it; the lede keeps
its own 520px cap. Replaced the old Cinzel gradient `h1.title` and its
`flicker` animation (both deleted). At desktop widths the larger headline
may overlap the Space Marine / Ork flank cutouts a little (text sits above
them) — if that looks cluttered, lower the `8.4rem` cap.

## Homepage sections (added 2026-09-23)

Order on `index.html`: hero → ticker → "One club, four fronts" teasers →
**From the Armory** → **Latest from the Dispatch** → **What we play** →
**Free tools promo** → Snapshots photo grid → **closing CTA band**. New
sections use `.section.home-divided` (thin red rule + centre diamond on top)
and `.section-head-row` (head + right-aligned "view all" `.head-link`).
CSS lives in the "HOMEPAGE SECTIONS" block at the end of `style.css`.

- **From the Armory (`#homeArmory`)** — **hand-picked** (user's choice,
  2026-09-23): `HOME_ARMORY_PICKS` in `script.js` lists exact `ARMY_DATA`
  titles (Knight Abominant III, Venerable Dreadnought, Custodes Vexilla
  Detachment, Mortarion, Beastboss, Abaddon the Despoiler, Dark Apostle,
  Slann Starmaster, Kairos Fateweaver — 9 cards, a 3×3 grid on desktop). Edit that list to
  change the showcase; a title that doesn't match is silently skipped. Cards
  are 1:1 `<button>`s and open the **same Armory lightbox as the gallery**
  (1:1 image + faction/title/description/painter) — its markup
  (`#lightbox`, `#lbArt`, `#lbFaction`, `#lbTitle`, `#lbDesc`, `#lbPainter`)
  is duplicated into `index.html`.
- **Latest from the Dispatch (`#homeDispatch`)** — `index.html` ships with
  the 3 newest posts baked in as a fallback; on load `script.js` fetches
  `news.html`, reads every `.news-item` (date/`h3`/`.news-tag`/first image),
  sorts by the `.news-date` text ("Month D, YYYY" — keep that format) and
  swaps in the newest 3. Posts without a photo get the club logo. All cards
  link to the Dispatch page (no per-post anchors exist). The fetch only works
  when served (GitHub Pages) — opened as a local file it keeps the baked-in
  cards.
- **What we play** — static 8-tile logo grid, each tile links to `games`.
  Mirrors `games.html`'s list; update both if a system is added. Board Games
  uses the `ico-dice` symbol (added to the homepage sprite).
- **Tools promo** — one wide card linking to `tools` plus quick links to all
  seven tool pages.
- **Closing CTA ("Pull up a chair.")** — Wednesdays 7–10 PM, Join + About
  buttons. **Now on every page** (2026-09-23), as the last block inside
  `<main>` (`.home-cta`); on `join.html` the primary button is "Message us
  on WhatsApp" → `#joinForm`, on `about.html` the second button is "See the
  Armory". Add it to any new page too. CSS-only background (red glow from the bottom + fine stripes)
  defined once as `--cta-bg` in `:root`. (The footer briefly shared it;
  reverted at the user's request — the footer is solid `--void-2` with
  `position:relative; z-index:1` so the fixed `.page-flank` cutouts, z-index
  0, never show through it. Same for `.footer-banner`.)
- Dialog focus helper now retries focusing the close button at 320ms as well
  as 40ms (a mouse click could land before the fade-in made it focusable).

## Accessibility (audit + fixes, 2026-09-23)

Audited with axe-core (WCAG 2.1 A/AA + best-practice) on all 17 pages at
desktop and mobile widths, plus a scripted keyboard walkthrough. After the
fixes below, axe reports **zero violations** on every page. Conventions to
keep following:

- **Colour contrast:** `--crimson-glow` changed `#e63946` → `#e9505b` (was
  4.45:1 on `--panel`, just under the 4.5:1 AA minimum — it's used for every
  small red label/eyebrow on the site). `--crimson-bright` (`#c41e2a`, ~3.2:1)
  must not be used for small text — `.teaser .t-num` moved to `--crimson-glow`.
  `.die.miss` moved off `--steel` (2:1) to `#95807b`. Don't dim text with
  `opacity` (full events now use a dashed border instead).
- **Skip link:** every page starts with `<a class="skip-link" href="#main">`
  and `<main id="main" tabindex="-1">`. Add both to any new page.
- **Headings:** no skipped levels. Pages that go straight from the hero `h1`
  to card `h3`s get a visually-hidden `<h2 class="sr-only">` at the top of
  the first `.section`. Join steps, Roster officer/member cards and Armory
  cards were `h4` → now `h3` (CSS selectors cover both).
- **Decorative icons:** `<svg aria-hidden="true" focusable="false"><use …>`.
- **Nav:** `aria-label="Main"`; `script.js` sets `aria-current` on the
  active link (`page`, or `true` on tool sub-pages under Tools); burger has
  `aria-controls="navlinks"` and closes on Escape.
- **Toggle buttons:** `script.js` keeps `aria-pressed` in sync with the
  `.on`/`.active` class on every `button.chip` / `button.filter-btn`
  (MutationObserver) — page scripts only need to toggle the class.
- **Dialogs:** Armory + homepage photo lightboxes use `makeDialog()` in
  `script.js`: focus moves to the close button (after a 40ms delay because
  the dialog fades in from `visibility:hidden`), Tab is trapped, focus
  returns to the card on close. Gallery/photo cards are made
  keyboard-operable with `makeActivatable()` (tabindex, role=button,
  aria-label, Enter/Space).
- **Live regions:** faction count, join form note, Turn/Mission Tracker
  counters and round/points summaries announce changes (`aria-live`).
- **Icon-only buttons** (−/+ steppers etc.) need an `aria-label`.
- **Turn Tracker:** the round stepper had buttons nested inside a `<button>`
  (invalid HTML) — outer element is now a `<div>`.
- **Standings:** tabs have ids/`aria-labelledby`, roving tabindex and
  arrow/Home/End keys; scrollable tables are focusable labelled regions.
- **FAQ accordion:** `aria-expanded`/`aria-controls` set by `script.js`.
- **Focus rings:** fields keep a visible `:focus-visible` outline even where
  component CSS sets `outline:none`. Inline links inside `main p` are
  underlined so they aren't distinguished by colour alone.

## Reveal-on-scroll behavior

`.reveal` elements fade in via `IntersectionObserver` in `script.js`. The
observer uses `threshold:0` (not an area-ratio threshold) specifically
because large containers (the full Armory grid, the full Dispatch timeline)
are taller than the viewport and would never satisfy an area-ratio threshold
on initial load — this caused a real "page loads blank until you touch
something" bug that's now fixed. There's also a 2-second timeout fallback
that force-reveals anything the observer somehow misses. Don't reintroduce
an area-based threshold.

## Asset inventory

All images live in `assets/`. Notable non-obvious ones:
- `banner.jpg` — default sitewide hero background (Home only, now)
- `gallery-1.webp` through `gallery-8.webp` (were .jpg until 2026-09-23) — Home page's real club photo grid
- `dispatch-*.webp` — Dispatch page post photos
- `w40k-logo.png`, `aos-logo.png`, `kow-logo.webp`, `dnd-logo.svg`,
  `bloodbowl-logo.png` — system logos used on `games.html`
- `games-banner.webp`, `banner-news.jpg` (reused by both Events and
  Standings) — hero banners for the newer pages
- Everything else is either a page banner (`*-banner.webp/jpg`) or an Armory
  piece named after the model/title

## Things explicitly requested and done (don't re-litigate)

- Site rebuilt from a single-file SPA into real separate `.html` files.
- Color scheme changed from gold-accented to crimson-dominant.
- All internal links made extension-less.
- Gallery lightbox enlarged twice (currently ~1080px wide) with internal
  scroll safety.
- Hero title changed from "EC / Warlords" to "Eastern Cape / Warlords",
  sized to guarantee "Eastern Cape" never wraps.
- Homepage headline restyled to the Warhammer Academy look (Anton, white
  fill, grey→red gradient outline) (2026-09-23). See "Homepage headline".
- Nav subtitle changed from "Warhammer 40,000 Club" to "Tabletop Club".
- Hero content (title/text/buttons) centered, not left-aligned.
- Site expanded from 6 pages to a nav of 8 plus 2 orphan pages plus a
  4-tool suite (Games We Play, Tools hub, Dice Roller, Damage Calculator,
  Turn Tracker, Events, Standings) — done outside this conversation, synced
  into the project 2026-09-21.
- About page's "Warlords Crest" card replaced with `assets/spacemarine-overlay.webp`
  (2026-09-21).
- Nav brand "GQEBERHA" subtitle removed sitewide; wordmark size/line-height
  tightened to sit centered against the logo now that it's a single line
  (2026-09-21).
- Roster officer icons (Matthew Carslake, Oli Billson, Steven Ovens)
  replaced with real faction emblems, recolored white; Wren Ashby spotlight
  card replaced with Culum Morley / Death Guard (2026-09-21).
- `parse.py` `enhancements(root)` → `detachments(root)` NameError bug fixed;
  parser extended with stats/weapons/abilities extraction plus a
  library-catalogue resolution path (for the 7 factions with no datasheets
  of their own), and run against all 35 real playable factions (2026-09-21).
- Datasheet Lookup tool shipped: `datasheet-lookup.html` built, `.dl-*` CSS
  added to `style.css`, Wahapedia outbound-link mapping decided and wired
  up, `tools.html` card swapped from `PLANNED` to `LIVE · 35 FACTIONS`,
  cache-bust version bumped across all HTML pages (2026-09-21).
- Games page card hover-lift bug fixed (shared `style.css` selector was
  grouping `.game-card` with `.pillar`/`.mcard`/`.news-card`); homepage
  "Front 0X" teaser cards made fully clickable via a stretched-link
  technique; homepage stat plaque (2019/40+/7/THU) removed from the hero;
  Roster's "Warlord of the Month" spotlight removed; mobile hero height and
  ticker text-wrap regressions (both caused by the plaque removal) fixed
  (2026-09-22).
- Sitewide SEO pass: title tags reworked to `{Page} — {Subtitle}` format
  (no brand in the tab title except the homepage), meta descriptions
  tightened, `<link rel="canonical">` + full Open Graph + Twitter Card tags
  added to all 15 pages, homepage-only JSON-LD `SportsOrganization` schema
  added, `robots.txt` and `sitemap.xml` created (2026-09-22). See "SEO"
  section above for the conventions to keep following.
- New Factions page (`factions.html`) shipped: all 27 current 40k factions
  in a searchable/filterable 3-column card grid, original abstract icons
  (no GW artwork), linked from `tools.html` and `games.html`, added to
  `sitemap.xml`, full SEO head block applied matching the convention above,
  cache-bust bumped across all 16 pages (2026-09-22). See "Factions page"
  section above.
- Full-width "11TH EDITION" news card added to `tools.html` (last item in
  the tool grid, new `.tool-card-wide` CSS modifier, new `ico-flag` icon),
  linking out to Wahapedia's 11th-edition hub; `tools.html` meta description
  updated to mention the faction browser (2026-09-22). See "11th edition"
  section above.
- Mission & Objective Tracker shipped: `mission-tracker.html` built as a
  standalone page sharing Turn Tracker's saved game via `localStorage`,
  flexible/generic secondary-mission scoring (no official GW mission data,
  by design), `tools.html` card flipped from `PLANNED` to `LIVE`, a
  cross-link added to `turn-tracker.html`, `sitemap.xml` updated, full SEO
  head block applied, cache-bust bumped across all 17 pages (2026-09-22).
  See "Mission & Objective Tracker" section above.
- `tools.html` layout changed: the "11TH EDITION" full-width news card
  removed outright (copy, badge, and its now-unused `ico-flag` icon symbol
  all deleted), and the Factions card moved out of the 3-column grid into
  that same full-width slot (re-styled with `.tool-card-wide`, expanded
  body copy). Grid is now six regular cards with Factions as the one
  full-width card below (2026-09-22). See "11th edition" and "Factions
  page" sections above.
- Factions page: placeholder icons replaced with the user's real faction
  logo SVGs for 15 factions, badge enlarged, logos drawn bone-white with
  accent-tinted ring; cache-bust bumped across all 17 pages (2026-09-22).
  See "Factions page" section above.
- Orks and Leagues of Votann logos added to the Factions page (17/27 real
  logos now); cache-bust bumped (2026-09-22).
- Grey Knights, Imperial Knights, Drukhari, Genestealer Cults logos added
  (21/27 real logos now); cache-bust bumped (2026-09-22).
- Sitewide accessibility audit + fixes (contrast token, skip links, heading
  order, dialog focus management, keyboard-operable cards, aria-pressed/
  aria-current/aria-expanded, live regions, labelled icon buttons);
  cache-bust bumped (2026-09-23). See "Accessibility" section above.
- Homepage expanded: Armory showcase (auto from ARMY_DATA), latest Dispatch
  posts (auto from news.html), What we play logo grid, tools promo, section
  dividers and closing CTA band (2026-09-23). See "Homepage sections".
- Homepage Armory showcase switched to 6 hand-picked models, 1:1 cards,
  opening the gallery-style lightbox; footer given the CTA background
  sitewide (2026-09-23).
- Club nights moved from Thursday to Wednesday sitewide (2026-09-23).
- Join form sends via WhatsApp to +27 72 474 9572; Discord/Instagram removed,
  Facebook is the social link (2026-09-23).
- "Pull up a chair" CTA added to the bottom of every page (2026-09-23).
- Factions page: Chaos Daemons added (28 factions); Space Marines entry
  names the Codex Chapters so e.g. "Salamanders" is searchable (2026-09-23).
- Factions page: six Codex Chapters split into their own cards + Adeptus
  Astartes filter chip (2026-09-23).
