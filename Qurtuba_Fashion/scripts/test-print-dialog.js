const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.fill('#username', 'ADMIN001');
  await page.fill('#password', 'admin123');
  await page.click('button:has-text("تسجيل الدخول")');

  await page.screenshot({ path: 'playwright-dashboard.png', fullPage: true });

  const invoicesButton = page.getByRole('button', { name: /الفواتير/ }).first();
  await invoicesButton.waitFor({ timeout: 30000 });
  await invoicesButton.click();

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'playwright-invoices.png', fullPage: true });

  const printButtons = page.getByRole('button', { name: /طباعة القائمة/ });
  console.log('عدد أزرار طباعة القائمة:', await printButtons.count());
  const printButton = printButtons.first();
  await printButton.waitFor({ timeout: 10000 });
  await printButton.evaluate((node) => node.click());

  await page.waitForSelector('text=تحديد فترة الطباعة', { timeout: 5000 });
  console.log('✅ Print dialog appeared successfully');

  await browser.close();
}

run().catch((error) => {
  console.error('❌ Print dialog test failed:', error);
  process.exit(1);
});

