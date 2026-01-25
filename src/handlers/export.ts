
import { Request, Response } from 'express';
import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import { PdfService } from '../services/pdf.service';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for large HTML/CSS payloads

app.post('/resumes/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const { html, css } = req.body;

    if (!html) {
      res.status(400).json({ success: false, message: 'HTML content is required' });
      return;
    }

    console.log('Generating PDF...');
    const pdfBuffer = await PdfService.generatePdf(html, css);
    
    console.log('PDF generated successfully, size:', pdfBuffer.length);

    // Return as base64 encoded string for Lambda compatibility if needed, 
    // but serverless-http handles binary if configured right. 
    // For standard API Gateway v2, returning base64 with isBase64Encoded is safest if not using serverless-http's binary support.
    // However, since we are using serverless-http wrapping express, we can define binary media types or return base64.
    
    // Let's try standard binary response first. serverless-http might need config for this.
    // If we face issues, we can switch to explicit base64 return.
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Export handler error:', error);
    res.status(500).json({ 
        success: false, 
        message: 'Failed to generate PDF',
        error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Wrap express app
export const handler = serverless(app, {
    binary: ['application/pdf'] // Important: tell serverless-http to treat this as binary
});
