// Smoke test: loads every page at desktop and phone width and reports
// JavaScript errors, broken local files (4xx), and horizontal overflow.
//
// Needs Playwright + Chromium, and dev/serve.py running:
//   python3 dev/serve.py &        (port 8765)
//   node dev/smoke-test.js        (exit code 1 if anything failed)
//
// Third-party requests (Google Fonts, Google Analytics) are ignored.
let playwright;
try { playwright = require('playwright'); }
catch (e) { playwright = require('/opt/node22/lib/node_modules/playwright'); }

const BASE = process.env.BASE || 'http://127.0.0.1:8765/';
const PAGES = ['', 'about', 'gallery', 'members', 'news', 'games', 'join',
  'events', 'standings', 'tournaments', 'privacy', 'no-such-page'];

(async () => {
  const browser = await playwright.chromium.launch();
  let failed = 0;
  for (const width of [1300, 375]) {
    for (const pg of PAGES) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      const problems = [];
      page.on('pageerror', e => problems.push('JS error: ' + e.message));
      page.on('response', r => {
        const u = r.url();
        if (u.startsWith(BASE) && r.status() >= 400 && !u.endsWith('no-such-page')) problems.push(r.status() + ' ' + u);
      });
      await page.goto(BASE + pg, { waitUntil: 'networkidle' }).catch(e => problems.push('load: ' + e.message));
      // scroll through so lazy images and reveal-on-scroll content load
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 25)); }
      });
      await page.waitForTimeout(600);
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      if (sw > width) problems.push(`page is ${sw}px wide at ${width}px (horizontal overflow)`);
      const label = `${width}px /${pg}`;
      if (problems.length) { failed++; console.log('FAIL ' + label); problems.forEach(p => console.log('     ' + p)); }
      else console.log('ok   ' + label);
      await page.close();
    }
  }
  await browser.close();
  console.log(failed ? `\n${failed} page(s) with problems` : '\nAll pages clean');
  process.exit(failed ? 1 : 0);
})();
