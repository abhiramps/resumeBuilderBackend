/**
 * Ollama Model Benchmark Script
 * Tests different local models for speed and quality
 * 
 * Usage:
 *   npm run test:ollama-models
 *   npm run test:ollama-models -- --model llama3.2
 *   npm run test:ollama-models -- --all
 */

import 'dotenv/config';
import { OllamaProvider } from './src/config/llm/ollama.provider';
import { FileParserService } from './src/services/file-parser.service';
import { AIParserService } from './src/services/ai-parser.service';
import * as fs from 'fs';
import * as path from 'path';

// Popular models to test
const RECOMMENDED_MODELS = [
    // Llama models
    { name: 'llama3.2', size: '3B', description: 'Fast, good for dev' },
    { name: 'llama3.2:1b', size: '1B', description: 'Very fast, basic quality' },
    { name: 'llama3.1', size: '8B', description: 'Balanced speed/quality' },

    // Mistral models
    { name: 'mistral', size: '7B', description: 'Fast and accurate' },
    { name: 'mistral-small', size: '7B', description: 'Optimized for speed' },

    // Qwen models
    { name: 'qwen2.5', size: '7B', description: 'Good multilingual' },
    { name: 'qwen2.5:3b', size: '3B', description: 'Fast, decent quality' },
    { name: 'qwen2.5:1.5b', size: '1.5B', description: 'Very fast' },

    // Phi models (Microsoft)
    { name: 'phi3', size: '3.8B', description: 'Small but powerful' },
    { name: 'phi3:mini', size: '3.8B', description: 'Optimized version' },

    // Gemma models (Google)
    { name: 'gemma2', size: '9B', description: 'High quality' },
    { name: 'gemma2:2b', size: '2B', description: 'Fast and efficient' },

    // DeepSeek
    { name: 'deepseek-coder-v2', size: '16B', description: 'Good for structured data' },

    // Specialized
    { name: 'codellama', size: '7B', description: 'Code-focused' },
    { name: 'neural-chat', size: '7B', description: 'Conversational' },
];

// Test resume file paths (hardcoded)
// Place your test resume files in the project root or update these paths
const TEST_RESUME_PATHS = {
    pdf: './test-resume.pdf',
    docx: '/Users/admin/Downloads/Resume.docx',
};

// Fallback: Create a test directory if it doesn't exist
const TEST_DIR = './test-resumes';

interface TestResult {
    model: string;
    available: boolean;
    simpleTest?: {
        success: boolean;
        duration: number;
        response: string;
        error?: string;
    };
    jsonTest?: {
        success: boolean;
        duration: number;
        isValidJson: boolean;
        response: string;
        error?: string;
    };
    resumeTest?: {
        success: boolean;
        duration: number;
        extractedFields: number;
        textExtractionTime: number;
        aiParsingTime: number;
        totalTime: number;
        confidenceScore?: number;
        response: string;
        error?: string;
    };
    overallScore?: number;
}

async function findTestResume(): Promise<{ path: string; type: 'pdf' | 'docx' } | null> {
    // Check for test resume files in order of preference
    const possiblePaths = [
        { path: TEST_RESUME_PATHS.pdf, type: 'pdf' as const },
        { path: TEST_RESUME_PATHS.docx, type: 'docx' as const },
        { path: path.join(TEST_DIR, 'test-resume.pdf'), type: 'pdf' as const },
        { path: path.join(TEST_DIR, 'test-resume.docx'), type: 'docx' as const },
        { path: './sample-resume.pdf', type: 'pdf' as const },
        { path: './sample-resume.docx', type: 'docx' as const },
    ];

    for (const { path: filePath, type } of possiblePaths) {
        if (fs.existsSync(filePath)) {
            return { path: filePath, type };
        }
    }

    return null;
}

async function testResumeParsingWithFile(
    modelName: string,
    resumePath: string,
    fileType: 'pdf' | 'docx'
): Promise<{
    success: boolean;
    duration: number;
    extractedFields: number;
    textExtractionTime: number;
    aiParsingTime: number;
    totalTime: number;
    confidenceScore?: number;
    response: string;
    error?: string;
}> {
    const totalStartTime = Date.now();

    try {
        // Step 1: Read file
        const buffer = fs.readFileSync(resumePath);
        console.log(`   📄 File loaded: ${path.basename(resumePath)} (${(buffer.length / 1024).toFixed(1)}KB)`);

        // Step 2: Extract text from file (like the real import flow)
        const fileParser = new FileParserService();
        const textStartTime = Date.now();
        const extractedText = await fileParser.extractText(buffer, fileType);
        const textExtractionTime = Date.now() - textStartTime;

        console.log(`   📝 Text extracted: ${extractedText.length} characters (${textExtractionTime}ms)`);

        if (!extractedText || extractedText.length < 100) {
            throw new Error('Extracted text is too short or empty');
        }

        // Step 3: Parse with AI (using the actual AIParserService)
        const aiParser = new AIParserService({
            provider: 'ollama' as any,
            model: modelName,
        });

        const aiStartTime = Date.now();
        const aiResponse = await aiParser.extractResumeData(extractedText);
        const aiParsingTime = Date.now() - aiStartTime;

        const totalTime = Date.now() - totalStartTime;

        // Count extracted fields
        let extractedFields = 0;
        const extraction = aiResponse.extraction;

        if (extraction.personalInfo?.fullName) extractedFields++;
        if (extraction.personalInfo?.email) extractedFields++;
        if (extraction.personalInfo?.phone) extractedFields++;
        if (extraction.skills && extraction.skills.length > 0) extractedFields++;
        if (extraction.experience && extraction.experience.length > 0) extractedFields++;
        if (extraction.education && extraction.education.length > 0) extractedFields++;

        return {
            success: true,
            duration: totalTime,
            extractedFields,
            textExtractionTime,
            aiParsingTime,
            totalTime,
            confidenceScore: aiResponse.confidence,
            response: JSON.stringify(extraction, null, 2).substring(0, 500),
        };
    } catch (error) {
        const totalTime = Date.now() - totalStartTime;
        return {
            success: false,
            duration: totalTime,
            extractedFields: 0,
            textExtractionTime: 0,
            aiParsingTime: 0,
            totalTime,
            response: '',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

async function checkOllamaRunning(): Promise<boolean> {
    try {
        const response = await fetch('http://localhost:11434/api/tags', {
            signal: AbortSignal.timeout(3000),
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function listInstalledModels(): Promise<string[]> {
    try {
        const response = await fetch('http://localhost:11434/api/tags');
        const data = await response.json() as { models: Array<{ name: string }> };
        return data.models.map(m => m.name.split(':')[0]);
    } catch (error) {
        return [];
    }
}

async function pullModel(modelName: string): Promise<boolean> {
    console.log(`   📥 Pulling ${modelName}...`);
    try {
        const response = await fetch('http://localhost:11434/api/pull', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: modelName }),
        });

        if (!response.ok) {
            return false;
        }

        // Stream the response to show progress
        const reader = response.body?.getReader();
        if (!reader) return false;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = new TextDecoder().decode(value);
            const lines = text.split('\n').filter(l => l.trim());

            for (const line of lines) {
                try {
                    const json = JSON.parse(line);
                    if (json.status) {
                        process.stdout.write(`\r   📥 ${json.status}...`);
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }
        }

        console.log('\r   ✓ Model pulled successfully');
        return true;
    } catch (error) {
        console.log(`\r   ✗ Failed to pull model: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
    }
}

async function testModel(modelName: string, autoPull: boolean = false): Promise<TestResult> {
    const result: TestResult = {
        model: modelName,
        available: false,
    };

    console.log(`\n${'='.repeat(70)}`);
    console.log(`Testing: ${modelName}`);
    console.log('='.repeat(70));

    // Check if model is available
    const installedModels = await listInstalledModels();
    const modelBase = modelName.split(':')[0];
    const isInstalled = installedModels.includes(modelBase) || installedModels.some(m => m.startsWith(modelBase));

    if (!isInstalled) {
        console.log(`   ⚠️  Model not installed`);

        if (autoPull) {
            const pulled = await pullModel(modelName);
            if (!pulled) {
                console.log(`   ✗ Failed to pull model. Skipping tests.`);
                return result;
            }
        } else {
            console.log(`   💡 Run: ollama pull ${modelName}`);
            console.log(`   Or use --auto-pull flag to pull automatically`);
            return result;
        }
    }

    result.available = true;

    // Create provider instance
    const provider = new OllamaProvider();
    // Override model
    (provider as any).model = modelName;

    // Test 1: Simple completion
    console.log(`\n1️⃣  Simple Completion Test`);
    try {
        const startTime = Date.now();
        const response = await provider.generateCompletion([
            { role: 'system', content: 'You are a helpful assistant. Respond with exactly one word.' },
            { role: 'user', content: 'Say "Hello"' },
        ], {
            temperature: 0.1,
            maxTokens: 10,
        });
        const duration = Date.now() - startTime;

        result.simpleTest = {
            success: response.success,
            duration,
            response: response.content?.trim() || '',
            error: response.error,
        };

        if (response.success) {
            console.log(`   ✓ Success (${duration}ms)`);
            console.log(`   Response: "${response.content?.trim()}"`);
        } else {
            console.log(`   ✗ Failed: ${response.error}`);
        }
    } catch (error) {
        result.simpleTest = {
            success: false,
            duration: 0,
            response: '',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
        console.log(`   ✗ Error: ${result.simpleTest.error}`);
    }

    // Test 2: JSON response
    console.log(`\n2️⃣  JSON Response Test`);
    try {
        const startTime = Date.now();
        const response = await provider.generateCompletion([
            { role: 'system', content: 'You are a JSON generator. Always respond with valid JSON only. No other text.' },
            { role: 'user', content: 'Generate a JSON object with fields: name (string), age (number), city (string). Use example data.' },
        ], {
            temperature: 0.1,
            maxTokens: 100,
            responseFormat: 'json',
        });
        const duration = Date.now() - startTime;

        let isValidJson = false;
        if (response.success && response.content) {
            try {
                JSON.parse(response.content);
                isValidJson = true;
            } catch (e) {
                isValidJson = false;
            }
        }

        result.jsonTest = {
            success: response.success,
            duration,
            isValidJson,
            response: response.content?.substring(0, 200) || '',
            error: response.error,
        };

        if (response.success) {
            console.log(`   ✓ Success (${duration}ms)`);
            console.log(`   Valid JSON: ${isValidJson ? '✓' : '✗'}`);
            if (isValidJson) {
                console.log(`   Response: ${response.content?.substring(0, 100)}...`);
            }
        } else {
            console.log(`   ✗ Failed: ${response.error}`);
        }
    } catch (error) {
        result.jsonTest = {
            success: false,
            duration: 0,
            isValidJson: false,
            response: '',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
        console.log(`   ✗ Error: ${result.jsonTest.error}`);
    }

    // Test 3: Resume parsing (real file)
    console.log(`\n3️⃣  Resume Parsing Test (Real File)`);

    const resumeFile = await findTestResume();

    if (!resumeFile) {
        console.log(`   ⚠️  No test resume found`);
        console.log(`   💡 Place a test resume at: ${TEST_RESUME_PATHS.pdf} or ${TEST_RESUME_PATHS.docx}`);
        result.resumeTest = {
            success: false,
            duration: 0,
            extractedFields: 0,
            textExtractionTime: 0,
            aiParsingTime: 0,
            totalTime: 0,
            response: '',
            error: 'No test resume file found',
        };
    } else {
        console.log(`   📁 Using: ${resumeFile.path}`);

        try {
            const resumeResult = await testResumeParsingWithFile(
                modelName,
                resumeFile.path,
                resumeFile.type
            );

            result.resumeTest = resumeResult;

            if (resumeResult.success) {
                console.log(`   ✓ Success!`);
                console.log(`   ⏱️  Text extraction: ${resumeResult.textExtractionTime}ms`);
                console.log(`   🤖 AI parsing: ${resumeResult.aiParsingTime}ms`);
                console.log(`   📊 Total time: ${resumeResult.totalTime}ms`);
                console.log(`   📋 Extracted fields: ${resumeResult.extractedFields}/6`);
                if (resumeResult.confidenceScore) {
                    console.log(`   🎯 Confidence: ${resumeResult.confidenceScore}%`);
                }
            } else {
                console.log(`   ✗ Failed: ${resumeResult.error}`);
            }
        } catch (error) {
            result.resumeTest = {
                success: false,
                duration: 0,
                extractedFields: 0,
                textExtractionTime: 0,
                aiParsingTime: 0,
                totalTime: 0,
                response: '',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            console.log(`   ✗ Error: ${result.resumeTest.error}`);
        }
    }

    // Calculate overall score
    let score = 0;
    if (result.simpleTest?.success) score += 15;
    if (result.jsonTest?.success) score += 15;
    if (result.jsonTest?.isValidJson) score += 15;
    if (result.resumeTest?.success) score += 30; // Resume test is most important
    if (result.resumeTest?.extractedFields) score += (result.resumeTest.extractedFields * 3); // Up to 18 points
    if (result.resumeTest?.confidenceScore) {
        score += Math.round(result.resumeTest.confidenceScore / 10); // Up to 10 points
    }

    // Speed bonus (faster = better) - based on resume parsing time
    if (result.resumeTest?.totalTime) {
        const totalTime = result.resumeTest.totalTime;
        if (totalTime < 10000) score += 10; // Under 10s
        else if (totalTime < 20000) score += 7; // Under 20s
        else if (totalTime < 30000) score += 5; // Under 30s
        else if (totalTime < 60000) score += 2; // Under 60s
    }

    result.overallScore = Math.min(100, score);

    console.log(`\n📊 Overall Score: ${result.overallScore}/100`);

    return result;
}

function printSummary(results: TestResult[]) {
    console.log(`\n\n${'='.repeat(70)}`);
    console.log('📊 BENCHMARK SUMMARY');
    console.log('='.repeat(70));

    // Filter available models
    const available = results.filter(r => r.available);

    if (available.length === 0) {
        console.log('\n⚠️  No models were available for testing.');
        console.log('Install models with: ollama pull <model-name>');
        return;
    }

    // Sort by score
    const sorted = [...available].sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));

    console.log('\n🏆 Rankings:\n');
    sorted.forEach((result, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
        const avgSpeed = result.simpleTest && result.jsonTest && result.resumeTest
            ? Math.round((result.simpleTest.duration + result.jsonTest.duration + result.resumeTest.duration) / 3)
            : 0;

        console.log(`${medal} ${index + 1}. ${result.model.padEnd(25)} Score: ${result.overallScore}/100  Avg: ${avgSpeed}ms`);
    });

    // Detailed comparison table
    console.log('\n\n📋 Detailed Results:\n');
    console.log('Model'.padEnd(25) + 'Simple'.padEnd(12) + 'JSON'.padEnd(12) + 'Resume (Total/AI)'.padEnd(30) + 'Score');
    console.log('-'.repeat(90));

    sorted.forEach(result => {
        const simple = result.simpleTest?.success ? `✓ ${result.simpleTest.duration}ms` : '✗';
        const json = result.jsonTest?.success ? `✓ ${result.jsonTest.duration}ms` : '✗';
        const resume = result.resumeTest?.success
            ? `✓ ${Math.round(result.resumeTest.totalTime / 1000)}s (AI: ${Math.round(result.resumeTest.aiParsingTime / 1000)}s)`
            : '✗';

        console.log(
            result.model.padEnd(25) +
            simple.padEnd(12) +
            json.padEnd(12) +
            resume.padEnd(30) +
            `${result.overallScore}/100`
        );
    });

    // Recommendations
    console.log('\n\n💡 Recommendations:\n');

    const fastest = sorted.reduce((prev, curr) => {
        const prevTime = prev.resumeTest?.totalTime || 999999;
        const currTime = curr.resumeTest?.totalTime || 999999;
        return currTime < prevTime ? curr : prev;
    });

    const mostAccurate = sorted[0];

    console.log(`🚀 Fastest: ${fastest.model}`);
    console.log(`🎯 Most Accurate: ${mostAccurate.model}`);
    console.log(`⚖️  Best Balance: ${sorted[0].model}`);

    // Update .env recommendation
    console.log('\n\n📝 To use the best model, update your .env:\n');
    console.log(`OLLAMA_MODEL=${sorted[0].model}`);
}

async function main() {
    console.log('\n🚀 Ollama Model Benchmark\n');

    // Check for test resume
    console.log('Checking for test resume...');
    const resumeFile = await findTestResume();

    if (!resumeFile) {
        console.log('⚠️  No test resume found!');
        console.log('\n📝 Please place a test resume file at one of these locations:');
        console.log(`   - ${TEST_RESUME_PATHS.pdf}`);
        console.log(`   - ${TEST_RESUME_PATHS.docx}`);
        console.log(`   - ${path.join(TEST_DIR, 'test-resume.pdf')}`);
        console.log(`   - ${path.join(TEST_DIR, 'test-resume.docx')}`);
        console.log('\n💡 The resume parsing test will be skipped without a test file.');
        console.log('   Simple and JSON tests will still run.\n');

        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        await new Promise<void>((resolve) => {
            readline.question('Continue anyway? (y/n): ', (answer: string) => {
                readline.close();
                if (answer.toLowerCase() !== 'y') {
                    console.log('\nExiting...');
                    process.exit(0);
                }
                resolve();
            });
        });
    } else {
        console.log(`✓ Found test resume: ${resumeFile.path}\n`);
    }

    // Check if Ollama is running
    console.log('Checking Ollama status...');
    const isRunning = await checkOllamaRunning();

    if (!isRunning) {
        console.error('\n❌ Ollama is not running!');
        console.error('\nPlease start Ollama:');
        console.error('  ollama serve');
        console.error('\nOr if using macOS:');
        console.error('  brew services start ollama');
        process.exit(1);
    }

    console.log('✓ Ollama is running\n');

    // Parse arguments
    const args = process.argv.slice(2);
    const testAll = args.includes('--all');
    const autoPull = args.includes('--auto-pull');
    const specificModel = args.find(arg => arg.startsWith('--model='))?.split('=')[1];

    let modelsToTest: typeof RECOMMENDED_MODELS = [];

    if (specificModel) {
        // Test specific model
        modelsToTest = [{ name: specificModel, size: 'Unknown', description: 'Custom model' }];
    } else if (testAll) {
        // Test all recommended models
        modelsToTest = RECOMMENDED_MODELS;
    } else {
        // Test only installed models
        const installed = await listInstalledModels();
        modelsToTest = RECOMMENDED_MODELS.filter(m =>
            installed.includes(m.name.split(':')[0]) ||
            installed.some(i => i.startsWith(m.name.split(':')[0]))
        );

        if (modelsToTest.length === 0) {
            console.log('⚠️  No recommended models are installed.\n');
            console.log('Install models with:');
            console.log('  ollama pull llama3.2');
            console.log('  ollama pull mistral');
            console.log('  ollama pull qwen2.5:3b');
            console.log('\nOr run with --all to test all models (will prompt to install)');
            console.log('Or run with --auto-pull to automatically pull missing models');
            process.exit(1);
        }
    }

    console.log(`Testing ${modelsToTest.length} model(s)...\n`);

    const results: TestResult[] = [];

    for (const model of modelsToTest) {
        const result = await testModel(model.name, autoPull);
        results.push(result);
    }

    printSummary(results);

    console.log('\n✨ Benchmark complete!\n');
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
