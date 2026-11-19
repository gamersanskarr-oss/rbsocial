import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ storageState: 'e2e/.auth/manager.json' });
const p = await ctx.newPage();
await p.goto('http://localhost:3000/manager/tasks');
await p.waitForSelector('select[name="assignedToId"]', { timeout: 20000 });
const opts = await p.$$eval('select[name="assignedToId"] option', os => os.map(o => ({ v: o.value, t: o.textContent, dis: o.disabled })));
console.log(JSON.stringify(opts, null, 1));
await b.close();
