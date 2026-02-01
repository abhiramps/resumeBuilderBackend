
import { PdfService } from '../src/services/pdf.service';
import * as fs from 'fs';
import * as path from 'path';

async function verifyFonts() {
  const html = `
    <div style="padding: 20px;">
      <h1>Resume Title</h1>
      <p>This text should be in Inter font.</p>
      <p style="font-weight: 700">This should be Bold Inter.</p>
    </div>
  `;
  
  const css = `
    body { font-family: 'Inter', sans-serif; color: #333; }
    h1 { font-weight: 600; font-size: 24px; }
  `;

  try {
    console.log('Generating PDF...');
    const buffer = await PdfService.generatePdf(html, css);
    
    const outputPath = path.join(__dirname, 'test-resume.pdf');
    fs.writeFileSync(outputPath, buffer);
    console.log(`PDF generated at: ${outputPath}`);
    
    // Check file size - if fonts are embedded, it should be larger than empty
    console.log(`PDF Size: ${buffer.length} bytes`);
    
  } catch (error) {
    console.error('Verification failed:', error);
  }
}

verifyFonts();
