# Eastern Cape Warlords website

The website of the Eastern Cape Warlords, a tabletop wargaming club in
Gqeberha (Port Elizabeth), South Africa. It's live at https://ecwarlords.co.za

It's a plain HTML/CSS/JS site with no build step. It's hosted on GitHub
Pages from the `main` branch, with Cloudflare in front. Anything merged into
`main` goes live within a minute or two.

## Working on it with Claude

Open this repository in Claude Code. It automatically reads **`CLAUDE.md`**,
which covers the house rules, how to test, how changes go live, and what's
still unfinished. The full decision history is in **`PROJECT-NOTES.md`**.

A good first message in a new session:

> Read CLAUDE.md and PROJECT-NOTES.md, then [what you want changed].

## Previewing locally

```
python3 dev/serve.py        # then open http://127.0.0.1:8765/
node dev/smoke-test.js      # checks every page (needs Playwright)
```

Opening the `.html` files directly by double-clicking won't work fully,
because links between pages have no `.html` extension.

## After a change goes live

If you still see the old version, go to Cloudflare → Caching →
Configuration → **Purge Everything**, then refresh.
