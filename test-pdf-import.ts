import 'dotenv/config';
import * as fs from 'fs';
import { FileParserService } from './src/services/file-parser.service';
import { AIParserService } from './src/services/ai-parser.service';

async function testPDFImport() {
    console.log('🧪 Testing PDF Import...\n');

    // Check if test PDF exists
    const testPdfPath = process.argv[2];

    if (!testPdfPath) {
        console.error('❌ Please provide a PDF file path as argument');
        console.log('Usage: ts-node test-pdf-import.ts <path-to-pdf>');
        process.exit(1);
    }

    if (!fs.existsSync(testPdfPath)) {
        console.error(`❌ File not found: ${testPdfPath}`);
        process.exit(1);
    }

    try {
        // Read PDF file
        console.log(`📄 Reading PDF: ${testPdfPath}`);
        const buffer = fs.readFileSync(testPdfPath);
        console.log(`✅ File loaded: ${buffer.length} bytes\n`);

        // Test file parser
        console.log('🔍 Step 1: Testing File Parser...');
        const fileParser = new FileParserService();

        // Detect file type
        const fileType = fileParser.detectFileType(buffer);
        console.log(`   File type detected: ${fileType}`);

        if (fileType !== 'pdf') {
            console.error(`   ❌ Not a valid PDF file (detected as: ${fileType})`);
            process.exit(1);
        }

        // Extract text
        console.log('   Extracting text from PDF...');
        const text = await fileParser.extractTextFromPDF(buffer);
        console.log(`   ✅ Text extracted: ${text.length} characters`);
        console.log(`   Preview (first 500 chars):\n   ${text.substring(0, 500).replace(/\n/g, '\n   ')}\n`);

        // Test AI parser
        console.log('🤖 Step 2: Testing AI Parser...');
        console.log(`   OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set'}`);
        console.log(`   AI Model: ${process.env.AI_MODEL || 'gpt-4o-mini'}`);

        if (!process.env.OPENAI_API_KEY) {
            console.error('   ❌ OPENAI_API_KEY not set in .env file');
            process.exit(1);
        }

        const aiParser = new AIParserService();
        console.log('   Calling OpenAI API...');
        const result = await aiParser.extractResumeData(text);

        console.log(`   ✅ AI extraction completed`);
        console.log(`   Confidence score: ${result.confidence}%`);
        console.log(`   Validation: ${result.validation.isValid ? '✅ Valid' : '❌ Invalid'}`);

        if (result.validation.errors.length > 0) {
            console.log(`   Errors: ${result.validation.errors.join(', ')}`);
        }

        if (result.validation.warnings.length > 0) {
            console.log(`   Warnings: ${result.validation.warnings.join(', ')}`);
        }

        if (result.validation.incompleteSections.length > 0) {
            console.log(`   Incomplete sections: ${result.validation.incompleteSections.join(', ')}`);
        }

        console.log('\n📊 Extracted Data:');
        console.log(`   Name: ${result.extraction.personalInfo.fullName || 'N/A'}`);
        console.log(`   Email: ${result.extraction.personalInfo.email || 'N/A'}`);
        console.log(`   Phone: ${result.extraction.personalInfo.phone || 'N/A'}`);
        console.log(`   Experience entries: ${result.extraction.experience.length}`);
        console.log(`   Education entries: ${result.extraction.education.length}`);
        console.log(`   Skills: ${result.extraction.skills.length}`);
        console.log(`   Projects: ${result.extraction.projects.length}`);
        console.log(`   Certifications: ${result.extraction.certifications.length}`);

        console.log('\n✅ All tests passed!');

    } catch (error) {
        console.error('\n❌ Test failed:');
        console.error(error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        process.exit(1);
    }
}

testPDFImport();
