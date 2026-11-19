import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 3 });
const p = await ctx.newPage();
await p.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 60000 });
const m = await p.evaluate(() => ({
  innerWidth: innerWidth,
  docScrollW: document.documentElement.scrollWidth,
  bodyScrollW: document.body.scrollWidth,
  viewportMeta: document.querySelector('meta[name="viewport"]')?.content ?? 'MISSING',
}));
console.log(JSON.stringify(m, null, 1));
// find elements wider than viewport
const wide = await p.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width > innerWidth + 2 || r.right > innerWidth + 50) {
      const cls = typeof el.className === 'string' ? el.className.slice(0, 90) : '';
      out.push({ tag: el.tagName, cls, w: Math.round(r.width), right: Math.round(r.right) });
    }
  }
  return out.slice(0, 25);
});
console.log(JSON.stringify(wide, null, 1));
await p.screenshot({ path: 'mobile-check.png' });
await b.close();
