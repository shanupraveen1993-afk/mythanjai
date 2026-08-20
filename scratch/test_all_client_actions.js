const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting Automated Playwright Client-Side Action & Route Audit...\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile Viewport (iPhone 12/13/14)
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36 Capacitor',
  });

  const page = await context.newPage();
  const errors = [];
  const warnings = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`Console Error on [${page.url()}]: ${msg.text()}`);
    }
  });

  page.on('pageerror', (exception) => {
    errors.push(`Uncaught Page Exception on [${page.url()}]: ${exception.message}`);
  });

  const routesToTest = [
    { name: 'Home Page', path: '/' },
    { name: 'Sell Marketplace', path: '/sell' },
    { name: 'Need Requests', path: '/need' },
    { name: 'Services Directory', path: '/services' },
    { name: 'Shop Offers', path: '/shops' },
    { name: 'Profile Dashboard', path: '/profile' },
    { name: 'Profile My Listings', path: '/profile?tab=my_posts' },
    { name: 'Profile Saved Items', path: '/profile?tab=saved' },
    { name: 'Direct Chat', path: '/chat' },
    { name: 'Post Form (Sell)', path: '/post/sell' },
  ];

  let passedRoutes = 0;

  for (const route of routesToTest) {
    try {
      console.log(`🔍 Testing: ${route.name} (${route.path})...`);
      const response = await page.goto(`http://localhost:3000${route.path}`, { waitUntil: 'networkidle' });
      const status = response ? response.status() : 0;
      
      // Check for Application Error card text
      const hasAppError = await page.evaluate(() => {
        const text = document.body.innerText || '';
        return text.includes('Application Error') || text.includes('Something went wrong');
      });

      if (status === 200 && !hasAppError) {
        console.log(`   ✅ PASS: ${route.name} loaded cleanly (HTTP 200, 0 Error Card)\n`);
        passedRoutes++;
      } else {
        console.log(`   ❌ FAIL: ${route.name} (Status: ${status}, AppError: ${hasAppError})\n`);
      }
    } catch (e) {
      console.log(`   ❌ EXCEPTION on ${route.name}: ${e.message}\n`);
    }
  }

  // Action Testing: Tap Profile Icon, Tap Post Button, Test Modals
  console.log('🧪 Testing Interactive Button Actions...\n');
  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    
    // Tap Profile Icon
    console.log('👉 Action: Tapping Top Header Profile Button...');
    const profileBtn = page.locator('header button[aria-label="View profile"]');
    if (await profileBtn.count() > 0) {
      await profileBtn.click();
      await page.waitForTimeout(500);
      console.log(`   Result URL: ${page.url()} (Expected /profile)`);
    }

    // Tap Post Button
    console.log('👉 Action: Tapping Dynamic Post Button...');
    await page.goto('http://localhost:3000/sell', { waitUntil: 'networkidle' });
    const postBtn = page.locator('button:has-text("Post")').first();
    if (await postBtn.count() > 0) {
      await postBtn.click();
      await page.waitForTimeout(500);
      console.log(`   Result URL / Modal: ${page.url()}`);
    }
  } catch (err) {
    console.log(`   Action Test Exception: ${err.message}`);
  }

  await browser.close();

  console.log('==================================================');
  console.log(`📊 AUDIT RESULTS: ${passedRoutes} / ${routesToTest.length} Routes Passed Cleanly`);
  console.log(`❗ Total Uncaught Client Errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log('Errors caught:');
    errors.forEach((e) => console.log('  - ' + e));
  } else {
    console.log('🎉 0 UNCAUGHT CLIENT EXCEPTIONS OR HYDRATION ERRORS DETECTED!');
  }
  console.log('==================================================');
})();
