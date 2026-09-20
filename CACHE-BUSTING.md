# Why the site sometimes doesn't update after a change

Browsers cache `style.css` and `script.js` aggressively so the site loads fast on
repeat visits. That's normally great — but it means when those files change,
some visitors (and sometimes even you, testing) will keep seeing the *old*
version until the cached copy expires or they hard-refresh.

## The fix already in place

Every page loads these two files with a version tag on the end, like:

```html
<link rel="stylesheet" href="style.css?v=202609201752">
<script src="script.js?v=202609201752"></script>
```

Browsers treat `style.css?v=202609201752` as a completely different file from
`style.css?v=202609201753`. So as long as that number changes every time the
file's *contents* change, every visitor gets the fresh version immediately —
no cache-clearing, no hard refresh, no waiting.

## When you need to bump it yourself

If Claude updates `style.css` or `script.js` for you, the version tag gets
bumped automatically as part of that — you don't need to do anything.

If you ever edit `style.css` or `script.js` **directly on GitHub** yourself
(without asking Claude), bump the version number in **all 6 HTML files** so
the change actually shows up for visitors:

1. Pick any new number — the current date and time works well, e.g. `202601151030`
   (year-month-day-hour-minute), or just increment the existing number by 1.
2. In each of `index.html`, `about.html`, `gallery.html`, `members.html`,
   `news.html`, and `join.html`, find these two lines near the top and bottom
   of the file:
   ```html
   <link rel="stylesheet" href="style.css?v=OLD_NUMBER">
   ...
   <script src="script.js?v=OLD_NUMBER"></script>
   ```
3. Replace `OLD_NUMBER` with your new number in **both places, in every file**.
4. Commit and push. Done — no more stale cache.

## Why not one file that "clears cache" instead?

A static site like this one has no way to reach into a visitor's browser and
delete something from their cache — that's a one-way street. Versioned URLs
are the standard workaround: instead of clearing the old cached file, you give
the browser a brand-new URL to fetch, so it never has a reason to reuse the
stale one.
