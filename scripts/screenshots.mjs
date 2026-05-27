import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'screenshots');
const BASE = 'http://localhost:3000';

const CREDS = { email: 'admin@barbearia.com', senha: '123456' };

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

async function shot(name) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: false });
  console.log(`✓ ${name}.png`);
}

// Login page
await page.goto(BASE);
await page.waitForLoadState('networkidle');
await shot('01-login');

// Login
await page.fill('input[type="email"]', CREDS.email);
await page.fill('input[type="password"]', CREDS.senha);
await page.click('button[type="submit"]');
await page.waitForURL('**/gestor/dashboard', { timeout: 15000 });
await page.waitForLoadState('networkidle');
await shot('02-dashboard');

const pages = [
  ['03-agendamentos', '/gestor/agendamentos'],
  ['04-calendario',   '/gestor/calendario'],
  ['05-profissionais','/gestor/profissionais'],
  ['06-servicos',     '/gestor/servicos'],
  ['07-whatsapp',     '/gestor/whatsapp'],
];

for (const [name, path] of pages) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  await shot(name);
}

await browser.close();
console.log(`\nDone → screenshots/`);
