const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  page.on('pageerror', err => {
    console.log('PAGE EXCEPTION:', err.toString());
  });
  
  await page.goto('http://localhost:3000/app/expenses', { waitUntil: 'networkidle2' });
  await browser.close();
})();
