import puppeteer, { Browser, Page } from 'puppeteer';

let browserPromise: Promise<Browser> | null = null;

export const getBrowser = async (): Promise<Browser> => {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
    });
  }
  return browserPromise;
};

const waitForReady = async (page: Page) => {
  await page.evaluate(async () => {
    if ('fonts' in document) {
      await (document as Document & { fonts: FontFaceSet }).fonts.ready;
    }
  });
  await new Promise((r) => setTimeout(r, 600));
};

// ─── PNG Screenshot ───────────────────────────────────────────────────────────

export const screenshotHtml = async (
  html: string,
  width = 1200,
  height = 800,
): Promise<Buffer> => {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width, height, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForReady(page);
    const buffer = await page.screenshot({ type: 'png', fullPage: false });
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  } finally {
    await page.close();
  }
};

// ─── PDF Export ───────────────────────────────────────────────────────────────

export const exportHtmlToPdf = async (
  html: string,
  width = 1200,
  height = 800,
): Promise<Buffer> => {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForReady(page);

    const pdfBuffer = await page.pdf({
      width: `${width}px`,
      height: `${height}px`,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
};

// ─── Multi-page PDF (for presentations) ──────────────────────────────────────

export const exportPresentationToPdf = async (html: string): Promise<Buffer> => {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForReady(page);

    const pdfBuffer = await page.pdf({
      width: '1280px',
      height: '720px',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      pageRanges: '',
    });

    return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
};

// ─── PPTX from Presentation HTML (image slides) ──────────────────────────────

export const exportPresentationToPptx = async (
  html: string,
  title = 'Design Studio Presentation',
): Promise<Buffer> => {
  // @ts-expect-error — pptxgenjs lacks ESM type declarations
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();

  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = title;

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForReady(page);

    // Detect slide count from common presentation patterns
    const slideCount = await page.evaluate(() => {
      const bySlideClass = document.querySelectorAll('.slide');
      const bySection = document.querySelectorAll('section');
      const byDataSlide = document.querySelectorAll('[data-slide]');
      return Math.max(bySlideClass.length, bySection.length, byDataSlide.length, 1);
    });

    // Capture each slide by activating it
    for (let i = 0; i < Math.min(slideCount, 20); i++) {
      await page.evaluate((idx) => {
        // Try multiple navigation patterns
        const slides = document.querySelectorAll('.slide, section, [data-slide]');
        if (slides.length > 1) {
          slides.forEach((s, j) => {
            (s as HTMLElement).style.display = j === idx ? '' : 'none';
            (s as HTMLElement).style.visibility = j === idx ? 'visible' : 'hidden';
          });
        }
        // Also simulate right arrow key for deck navigation
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      }, i);

      await new Promise((r) => setTimeout(r, 400));

      const buf = await page.screenshot({ type: 'png' });
      const base64 = (Buffer.isBuffer(buf) ? buf : Buffer.from(buf)).toString('base64');

      const slide = pptx.addSlide();
      slide.addImage({ data: `data:image/png;base64,${base64}`, x: 0, y: 0, w: '100%', h: '100%' });
    }
  } finally {
    await page.close();
  }

  const pptxBuffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
  return pptxBuffer;
};

// ─── Motion: multi-frame PNG strip (for client-side GIF assembly) ─────────────

export const captureMotionFrames = async (
  html: string,
  width = 960,
  height = 540,
  durationMs = 3000,
  fps = 10,
): Promise<string[]> => {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForReady(page);

    const frameCount = Math.ceil((durationMs / 1000) * fps);
    const frameInterval = Math.round(1000 / fps);
    const frames: string[] = [];

    for (let i = 0; i < frameCount; i++) {
      const buf = await page.screenshot({ type: 'png' });
      const b64 = (Buffer.isBuffer(buf) ? buf : Buffer.from(buf)).toString('base64');
      frames.push(`data:image/png;base64,${b64}`);
      await new Promise((r) => setTimeout(r, frameInterval));
    }

    return frames;
  } finally {
    await page.close();
  }
};
