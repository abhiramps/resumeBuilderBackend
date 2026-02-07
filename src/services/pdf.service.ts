import puppeteer, { Browser } from 'puppeteer-core';
import { INTER_FONT_BASE64 } from '../assets/fonts/inter';
import axios from 'axios';
import { config } from '../config';

export class PdfService {
  private static async getBrowser(): Promise<Browser> {
    const isOffline = process.env.IS_OFFLINE;
    const isLambda = !isOffline && (process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.AWS_EXECUTION_ENV);

    let executablePath: string;
    let args: string[] = [];

    if (isLambda) {
      console.log('Running in Lambda environment');
      try {
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
      } catch (error) {
        console.error('Error getting Chromium executable path:', error);
        throw error;
      }
    } else {
      console.log('Running in local environment');
      const platform = process.platform;
      if (platform === 'darwin') {
        executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      } else if (platform === 'win32') {
        executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      } else {
        executablePath = '/usr/bin/google-chrome';
      }
    }

    return puppeteer.launch({
      args,
      defaultViewport: { width: 1920, height: 1080 },
      executablePath,
      headless: true,
    });
  }

  static async generatePdf(html: string, css: string): Promise<Buffer> {
    const externalServiceUrl = config.pdfService.url;

    console.log('PDF Generation requested. PDF_SERVICE_URL:', externalServiceUrl || 'NOT SET (using local)');

    if (externalServiceUrl) {
      const targetUrl = `${externalServiceUrl.replace(/\/$/, '')}/generate-pdf`;
      console.log(`Delegating PDF generation to: ${targetUrl}`);
      try {
        const response = await axios.post(targetUrl, {
          html,
          css
        }, {
          responseType: 'arraybuffer',
          timeout: 25000
        });

        console.log(`External service responded with status: ${response.status}, content-length: ${response.data.byteLength}`);
        return Buffer.from(response.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('External PDF service axios error:', {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            data: error.response?.data ? 'present' : 'absent'
          });
        } else {
          console.error('External PDF service unexpected error:', error instanceof Error ? error.message : error);
        }
        console.log('Falling back to local PDF generation...');
      }
    }

    let browser: Browser | null = null;
    try {
      browser = await this.getBrowser();
      const page = await browser.newPage();

      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              @font-face {
                font-family: 'Inter';
                font-style: normal;
                font-weight: 300 700;
                font-display: swap;
                src: url(data:font/woff2;base64,${INTER_FONT_BASE64}) format('woff2');
              }
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
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              }
              * { font-family: inherit; }
              ${css}
            </style>
          </head>
          <body>
            ${html}
          </body>
        </html>
      `;

      await page.setContent(fullHtml, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      await page.evaluate(async () => {
        const fontLoads = [
          document.fonts.load('16px "Inter"'),
          document.fonts.load('700 16px "Inter"'),
          document.fonts.load('500 16px "Inter"')
        ];
        await Promise.all(fontLoads);
        await document.fonts.ready;
      });

      const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
        displayHeaderFooter: false,
        margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
        preferCSSPageSize: true
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