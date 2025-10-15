import { test, expect } from '@playwright/test';
import { startStaticServer, stopServer } from '../../tests/helpers/setup.mjs';

let serverProc;
const CANDIDATE_PORTS = [5173, 5174, 5175, 5176, 5177, 8082, 8083, 8084, 8085];

test.beforeAll(() => {
  // do not start a server here; the test will try to reuse an existing dev server or start one on-demand
});

test.afterAll(() => stopServer(serverProc));

test('product details popup opens and Add to Cart works', async ({ page }) => {
  // Try known dev ports first (reuse serve-auto if it's running), otherwise start a local http-server
  let baseUrl = null;
  for (const p of CANDIDATE_PORTS) {
    try {
      await page.goto(`http://127.0.0.1:${p}/menu.html`, { timeout: 2000 });
      baseUrl = `http://127.0.0.1:${p}`;
      break;
    } catch (e) {
      // not available, try next
    }
  }
  if (!baseUrl) {
    // try to start a local http-server on the first candidate that isn't in use
    for (const p of CANDIDATE_PORTS) {
      try {
        serverProc = await startStaticServer('npx', ['http-server', 'public', '-p', String(p)], process.cwd(), 1200);
        // try connecting
        await page.goto(`http://127.0.0.1:${p}/menu.html`, { timeout: 5000 });
        baseUrl = `http://127.0.0.1:${p}`;
        break;
      } catch (e) {
        // failed to start/listen on that port, stop proc and try next
        if (serverProc) { stopServer(serverProc); serverProc = null; }
      }
    }
  }
  if (!baseUrl) throw new Error('Could not start or find a server to serve menu.html');

  // wait for at least one product card button
  const cardBtn = page.locator('[data-modal-target]');
  await expect(cardBtn.first()).toBeVisible({ timeout: 5000 });

  // click the first card to trigger controller
  await cardBtn.first().click();

  // the controller creates a fragment that contains #prodName and #addToCart
  const prodName = page.locator('#prodName');
  await expect(prodName).toBeVisible({ timeout: 3000 });
  const nameText = await prodName.textContent();
  console.log('Loaded product name:', nameText);

  // click add to cart
  const addBtn = page.locator('#addToCart');
  await expect(addBtn).toBeVisible();
  await addBtn.click();

  // fragment should be removed (controller removes container after done callback)
  await expect(prodName).toHaveCount(0, { timeout: 2000 });
});