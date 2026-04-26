/// <reference lib="dom" />

import puppeteer, { Browser } from 'puppeteer-core';
import { logger } from '../utils/logger';

let cachedBrowser: Browser | null = null;
let launchPromise: Promise<Browser> | null = null;

async function launchBrowser(): Promise<Browser> {
  const isOffline = process.env.IS_OFFLINE;
  const isLambda = !isOffline && (process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.AWS_EXECUTION_ENV);

  let executablePath: string;
  let args: string[] = [];

  if (isLambda) {
    const chromium = await import('@sparticuz/chromium');
    executablePath = await chromium.default.executablePath();

    if (!executablePath) {
      throw new Error('Chromium executable path is undefined');
    }

    args = [
      ...chromium.default.args,
      '--disable-dev-shm-usage',
      '--single-process',
    ];

    logger.info('[PDF][launch] Lambda Chromium configuration', {
      executablePath,
      sparticuzArgsCount: chromium.default.args.length,
      finalArgs: args,
      lambdaEnv: {
        functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
        functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION,
        executionEnv: process.env.AWS_EXECUTION_ENV,
        memoryLimitMb: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE,
        region: process.env.AWS_REGION,
      },
    });
  } else {
    const platform = process.platform;
    if (platform === 'darwin') {
      executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else if (platform === 'win32') {
      executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    } else {
      executablePath = '/usr/bin/google-chrome';
    }

    args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];

    logger.info('[PDF][launch] Local Chromium configuration', {
      executablePath,
      platform,
      nodeVersion: process.version,
    });
  }

  const launchStart = Date.now();
  const browser = await puppeteer.launch({
    args,
    defaultViewport: { width: 1920, height: 1080 },
    executablePath,
    headless: true,
  });

  try {
    const version = await browser.version();
    const userAgent = await browser.userAgent();
    logger.info('[PDF][launch] Browser ready', {
      version,
      userAgent,
      launchMs: Date.now() - launchStart,
      isLambda: !!isLambda,
    });
  } catch (err) {
    logger.warn('[PDF][launch] Could not read browser version/userAgent', { err: String(err) });
  }

  return browser;
}

function extractFontFamiliesFromCss(css: string): { fontFamilyDeclarations: string[]; fontFaceFamilies: string[]; importUrls: string[] } {
  const fontFamilyDeclarations: string[] = [];
  const fontFaceFamilies: string[] = [];
  const importUrls: string[] = [];

  try {
    const declRegex = /font-family\s*:\s*([^;{}]+)/gi;
    let m: RegExpExecArray | null;
    while ((m = declRegex.exec(css)) !== null) {
      const value = m[1].trim();
      if (!fontFamilyDeclarations.includes(value)) fontFamilyDeclarations.push(value);
    }

    const faceRegex = /@font-face\s*{[^}]*font-family\s*:\s*([^;}]+)/gi;
    while ((m = faceRegex.exec(css)) !== null) {
      const value = m[1].trim().replace(/['"]/g, '');
      if (!fontFaceFamilies.includes(value)) fontFaceFamilies.push(value);
    }

    const importRegex = /@import\s+(?:url\()?["']([^"')]+)["']\)?/gi;
    while ((m = importRegex.exec(css)) !== null) {
      importUrls.push(m[1]);
    }
  } catch (err) {
    logger.warn('[PDF][css] Failed to parse font declarations from CSS', { err: String(err) });
  }

  return { fontFamilyDeclarations, fontFaceFamilies, importUrls };
}

async function getBrowser(): Promise<Browser> {
  if (cachedBrowser && cachedBrowser.connected) {
    return cachedBrowser;
  }

  // Dedupe concurrent launch attempts (warm container, two requests racing).
  if (launchPromise) {
    return launchPromise;
  }

  launchPromise = launchBrowser()
    .then((browser) => {
      cachedBrowser = browser;
      browser.on('disconnected', () => {
        if (cachedBrowser === browser) {
          cachedBrowser = null;
        }
      });
      return browser;
    })
    .finally(() => {
      launchPromise = null;
    });

  return launchPromise;
}

export class PdfService {
  static async generatePdf(html: string, css: string): Promise<Buffer> {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const requestStart = Date.now();

    const cssAnalysis = extractFontFamiliesFromCss(css || '');
    logger.info('[PDF][request] Incoming PDF request', {
      requestId,
      htmlLength: (html || '').length,
      cssLength: (css || '').length,
      htmlPreview: (html || '').slice(0, 300),
      cssPreview: (css || '').slice(0, 600),
      fontFamilyDeclarations: cssAnalysis.fontFamilyDeclarations,
      fontFaceFamilies: cssAnalysis.fontFaceFamilies,
      cssImportUrls: cssAnalysis.importUrls,
    });

    const browser = await getBrowser();
    const page = await browser.newPage();

    page.on('pageerror', (err) => {
      const e = err as { message?: string; stack?: string };
      logger.error('[PDF][page] pageerror', { requestId, message: e?.message, stack: e?.stack });
    });
    page.on('console', (msg) => {
      logger.info('[PDF][page] console', { requestId, type: msg.type(), text: msg.text() });
    });
    page.on('requestfailed', (req) => {
      logger.warn('[PDF][page] requestfailed', {
        requestId,
        url: req.url(),
        method: req.method(),
        failure: req.failure()?.errorText,
      });
    });

    try {
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              *, ::before, ::after {
                box-sizing: border-box;
                border-width: 0;
                border-style: solid;
                border-color: #e5e7eb;
              }
              html, body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              ${css}
            </style>
          </head>
          <body>
            ${html}
          </body>
        </html>
      `;

      const setContentStart = Date.now();
      await page.setContent(fullHtml, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });
      logger.info('[PDF][page] setContent complete', {
        requestId,
        setContentMs: Date.now() - setContentStart,
        fullHtmlLength: fullHtml.length,
      });

      const fontsReadyStart = Date.now();
      await page.evaluateHandle('document.fonts.ready');
      logger.info('[PDF][page] document.fonts.ready resolved', {
        requestId,
        fontsReadyMs: Date.now() - fontsReadyStart,
      });

      try {
        const fontDiagnostics = await page.evaluate(() => {
          const out: Record<string, unknown> = {};
          const fontsApi = (document as unknown as { fonts?: { check: (s: string) => boolean; values?: () => IterableIterator<unknown> } }).fonts;

          const declared: Array<{ family: string; weight: string; style: string; status: string; unicodeRange?: string }> = [];
          if (fontsApi && typeof (fontsApi as unknown as { forEach?: unknown }).forEach === 'function') {
            try {
              (fontsApi as unknown as { forEach: (cb: (f: { family: string; weight: string; style: string; status: string; unicodeRange?: string }) => void) => void }).forEach((f) => {
                declared.push({
                  family: f.family,
                  weight: f.weight,
                  style: f.style,
                  status: f.status,
                  unicodeRange: f.unicodeRange,
                });
              });
            } catch (e) {
              out.declaredEnumerationError = String(e);
            }
          }
          out.declared = declared;

          const sampleSelectors = ['html', 'body', 'h1', 'h2', 'h3', 'h4', 'p', 'li', 'a', 'span', 'strong'];
          const computed: Record<string, { fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string; color: string } | null> = {};
          for (const sel of sampleSelectors) {
            const el = document.querySelector(sel);
            if (el) {
              const cs = getComputedStyle(el as Element);
              computed[sel] = {
                fontFamily: cs.fontFamily,
                fontSize: cs.fontSize,
                fontWeight: cs.fontWeight,
                lineHeight: cs.lineHeight,
                color: cs.color,
              };
            } else {
              computed[sel] = null;
            }
          }
          out.computed = computed;

          const probeFamilies = [
            'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
            'Arial', 'Helvetica', 'Helvetica Neue', 'Times New Roman', 'Times',
            'Georgia', 'Calibri', 'Cambria', 'Verdana', 'Tahoma',
            'Courier New', 'Courier',
            'Liberation Sans', 'Liberation Serif', 'DejaVu Sans', 'DejaVu Serif', 'Noto Sans', 'Noto Serif',
          ];
          const availability: Record<string, boolean> = {};
          for (const family of probeFamilies) {
            try {
              availability[family] = fontsApi ? fontsApi.check(`16px "${family}"`) : false;
            } catch {
              availability[family] = false;
            }
          }
          out.availability = availability;

          out.userAgent = navigator.userAgent;
          out.documentReadyState = document.readyState;
          out.bodyClientWidth = document.body ? document.body.clientWidth : null;
          out.bodyClientHeight = document.body ? document.body.clientHeight : null;
          out.devicePixelRatio = window.devicePixelRatio;

          return out;
        });

        logger.info('[PDF][page] Font diagnostics', { requestId, ...fontDiagnostics });
      } catch (diagErr) {
        logger.warn('[PDF][page] Font diagnostics evaluate() failed', {
          requestId,
          err: String(diagErr),
        });
      }

      const pdfStart = Date.now();
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
        displayHeaderFooter: false,
        margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
        preferCSSPageSize: true,
      });

      logger.info('[PDF][result] PDF generated', {
        requestId,
        pdfBytes: pdfBuffer.length,
        pdfRenderMs: Date.now() - pdfStart,
        totalMs: Date.now() - requestStart,
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      logger.error('[PDF][error] generatePdf failed', {
        requestId,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        totalMs: Date.now() - requestStart,
      });
      throw error;
    } finally {
      await page.close().catch((err) => logger.warn('[PDF][cleanup] page.close failed', { requestId, err: String(err) }));
    }
  }
}
