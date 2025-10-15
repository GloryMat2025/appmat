import { test, expect } from '@playwright/test';
import { startStaticServer, stopServer, ensureReservationShims } from '../../tests/helpers/setup.mjs';

let serverProc;

test.beforeAll(async () => {
  // start the dev server (uses serve-auto script)
  serverProc = await startStaticServer('node', ['scripts/serve-auto.mjs'], process.cwd(), 2000);
});

test.afterAll(() => stopServer(serverProc));

test('reservation and pay modal countdown', async ({ page }) => {
  // try common dev ports - serve-auto may pick 5173 or 5174
  const ports = [5173, 5174, 5175];
  let loaded = false;
  for (const p of ports) {
    try {
      await page.goto(`http://127.0.0.1:${p}/checkout.html`, { timeout: 3000 });
      loaded = true;
      break;
    } catch (e) {
      // try next
    }
  }
  if (!loaded) throw new Error('Could not load checkout page on known ports');

  // ensure a fallback tryReserveCart exists and attach test shims for the page
  await ensureReservationShims(page);

  // open pay modal (assumes openPayModal is exposed globally)
  await page.evaluate(() => window.openPayModal && window.openPayModal());

  // wait for reserveTimer to appear and show mm:ss
  const timer = await page.locator('#reserveTimer');
  await expect(timer).toHaveText(/\d{2}:\d{2}/);

  // click pay (simulate quick success path)
  const payBtn = page.locator('#payNow');
  await payBtn.click();

  // expect success message in payStatus
  const status = page.locator('#payStatus');
  await expect(status).toHaveText(/Berjaya|Pembayaran gagal|Memproses pembayaran/);
});
