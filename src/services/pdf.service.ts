
import puppeteer, { Browser } from 'puppeteer-core';

export class PdfService {
  private static async getBrowser(): Promise<Browser> {
    const isOffline = process.env.IS_OFFLINE;
    const isLambda = !isOffline && (process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.AWS_EXECUTION_ENV);

    let executablePath: string;
    let args: string[] = [];

    if (isLambda) {
      console.log('Running in Lambda environment');

      // Use @sparticuz/chromium for Lambda (from Layer)
      try {
        const chromium = await import('@sparticuz/chromium');
        executablePath = await chromium.default.executablePath();
        console.log('Chromium executable path:', executablePath);

        if (!executablePath) {
          throw new Error('Chromium executable path is undefined');
        }

        args = [
          ...chromium.default.args,
          '--disable-dev-shm-usage', // Important for Lambda
          '--single-process',
        ];

        console.log('Chromium args:', args);
      } catch (error) {
        console.error('Error getting Chromium executable path:', error);
        throw error;
      }
    } else {
      console.log('Running in local environment');
      // Local development fallback paths
      const platform = process.platform;
      if (platform === 'darwin') {
        executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      } else if (platform === 'win32') {
        executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      } else {
        executablePath = '/usr/bin/google-chrome'; // Linux fallback
      }
    }

    console.log('Launching browser with executablePath:', executablePath);

    return puppeteer.launch({
      args,
      defaultViewport: { width: 1920, height: 1080 },
      executablePath,
      headless: true,
    });
  }

  static async generatePdf(html: string, css: string): Promise<Buffer> {
    let browser: Browser | null = null;
    try {
      browser = await this.getBrowser();
      const page = await browser.newPage();

      // Wrap content in full HTML structure with tailwind-like base styles
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              /* Tailwind-like base reset */
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
              /* Inject received CSS */
              ${css}
            </style>
          </head>
          <body>
            ${html}
          </body>
        </html>
      `;

      // Set content and wait for fonts to load
      await page.setContent(fullHtml, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for fonts to be loaded
      await page.evaluateHandle('document.fonts.ready');

      // Generate PDF
      // We want standard Letter size, no headers/footers, and print background colors
      // Margins are primarily handled by the CSS @page directive, but we can set a fallback here or 0 if CSS handles it.
      // Ideally, we respect the CSS @page rules.
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
        displayHeaderFooter: false,
        margin: {
          top: '0px',
          bottom: '0px',
          left: '0px',
          right: '0px'
        },
        preferCSSPageSize: true // Respect @page rules from CSS
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
