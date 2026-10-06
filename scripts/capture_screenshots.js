import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const screenshotsDir = path.resolve('screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function run() {
  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });

  console.log('Navigating to http://127.0.0.1:3000...');
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });

  // Screenshot 1: Clean Initial View
  console.log('Capturing 01_initial_view.png...');
  await page.screenshot({ path: path.join(screenshotsDir, '01_initial_view.png'), fullPage: true });

  // Upload requirements file
  const sampleReqPath = path.resolve('sample-pack/requirements.json');
  const reqInput = await page.$('input[type="file"]');
  if (reqInput && fs.existsSync(sampleReqPath)) {
    console.log('Uploading sample requirements.json...');
    await reqInput.uploadFile(sampleReqPath);
    await new Promise(r => setTimeout(r, 1200));
  }

  // Once requirements are loaded, find the document upload input
  const allInputs = await page.$$('input[type="file"]');
  const sampleDocsDir = path.resolve('sample-pack/documents');
  if (allInputs.length > 1 && fs.existsSync(sampleDocsDir)) {
    const docFiles = fs.readdirSync(sampleDocsDir)
      .filter(f => f.endsWith('.pdf'))
      .map(f => path.join(sampleDocsDir, f));

    console.log(`Uploading ${docFiles.length} sample PDF documents...`);
    await allInputs[1].uploadFile(...docFiles);
    await new Promise(r => setTimeout(r, 2500));
  }

  // Screenshot 2: Loaded requirements and auto-matched documents
  console.log('Capturing 02_documents_matched.png...');
  await page.screenshot({ path: path.join(screenshotsDir, '02_documents_matched.png'), fullPage: true });

  // Switch to Bangla
  console.log('Switching to Bangla language...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const bnBtn = buttons.find(b => b.textContent && (b.textContent.includes('বাংলা') || b.textContent.includes('বাং')));
    if (bnBtn) bnBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  console.log('Capturing 03_bilingual_bangla_view.png...');
  await page.screenshot({ path: path.join(screenshotsDir, '03_bilingual_bangla_view.png'), fullPage: true });

  // Switch back to English
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const enBtn = buttons.find(b => b.textContent && b.textContent.includes('English'));
    if (enBtn) enBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Enable Digital Stamp and TOC
  console.log('Toggling options...');
  await page.evaluate(() => {
    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    checkboxes.forEach(cb => {
      if (!cb.checked) cb.click();
    });
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('Capturing 04_advanced_options.png...');
  await page.screenshot({ path: path.join(screenshotsDir, '04_advanced_options.png'), fullPage: true });

  console.log('All screenshots completed successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error taking screenshots:', err);
  process.exit(1);
});
