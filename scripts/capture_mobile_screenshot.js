import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const screenshotsDir = path.resolve('screenshots');

async function run() {
  console.log('Launching Chrome for mobile snapshot...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  // Set iPhone 14 viewport
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });

  // Upload requirements
  const sampleReqPath = path.resolve('sample-pack/requirements.json');
  const reqInput = await page.$('input[type="file"]');
  if (reqInput && fs.existsSync(sampleReqPath)) {
    await reqInput.uploadFile(sampleReqPath);
    await new Promise(r => setTimeout(r, 1200));
  }

  // Upload sample documents
  const allInputs = await page.$$('input[type="file"]');
  const sampleDocsDir = path.resolve('sample-pack/documents');
  if (allInputs.length > 1 && fs.existsSync(sampleDocsDir)) {
    const docFiles = fs.readdirSync(sampleDocsDir)
      .filter(f => f.endsWith('.pdf'))
      .map(f => path.join(sampleDocsDir, f));

    await allInputs[1].uploadFile(...docFiles);
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('Capturing 05_mobile_view.png...');
  await page.screenshot({ path: path.join(screenshotsDir, '05_mobile_view.png'), fullPage: false });

  console.log('Mobile screenshot captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error taking mobile screenshot:', err);
  process.exit(1);
});
