test('AppMat main page loads', async ({ page }) => {
  await page.goto('http://localhost:5173');
  console.log(await page.content()); // 👉 print HTML sebenar
  await page.waitForSelector('h1', { timeout: 10000 });
  await expect(page.locator('h1')).toHaveText('Welcome to AppMat 🎉');
});
