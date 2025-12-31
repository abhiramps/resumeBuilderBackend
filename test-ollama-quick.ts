/**
 * Quick Ollama Model Test
 * Fast test to check which models work
 * 
 * Usage: npm run test:ollama-quick
 */

import 'dotenv/config';
import { OllamaProvider } from './src/config/llm/ollama.provider';

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

async function listInstalledModels(): Promise<Array<{ name: string; size: string }>> {
    try {
        const response = await fetch('http://localhost:11434/api/tags');
        const data = await response.json() as { models: Array<{ name: string; size: number }> };
        return data.models.map(m => ({
            name: m.name,
            size: `${(m.size / 1024 / 1024 / 1024).toFixed(1)}GB`,
        }));
    } catch (error) {
        return [];
    }
}

async function quickTest(modelName: string): Promise<{ success: boolean; duration: number; error?: string }> {
    try {
        const provider = new OllamaProvider();
        (provider as any).model = modelName;

        const startTime = Date.now();
        const response = await provider.generateCompletion([
            { role: 'user', content: 'Say "OK"' },
        ], {
            temperature: 0.1,
            maxTokens: 5,
        });
        const duration = Date.now() - startTime;

        return {
            success: response.success,
            duration,
            error: response.error,
        };
    } catch (error) {
        return {
            success: false,
            duration: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

async function main() {
    console.log('\n🚀 Quick Ollama Model Test\n');

    // Check if Ollama is running
    console.log('Checking Ollama status...');
    const isRunning = await checkOllamaRunning();

    if (!isRunning) {
        console.error('\n❌ Ollama is not running!');
        console.error('\nPlease start Ollama:');
        console.error('  ollama serve');
        process.exit(1);
    }

    console.log('✓ Ollama is running\n');

    // List installed models
    console.log('📦 Installed Models:\n');
    const models = await listInstalledModels();

    if (models.length === 0) {
        console.log('⚠️  No models installed!');
        console.log('\nInstall a model:');
        console.log('  ollama pull llama3.2');
        process.exit(1);
    }

    models.forEach((model, index) => {
        console.log(`${index + 1}. ${model.name.padEnd(30)} (${model.size})`);
    });

    console.log('\n🧪 Testing Models...\n');

    const results: Array<{ model: string; success: boolean; duration: number; error?: string }> = [];

    for (const model of models) {
        process.stdout.write(`Testing ${model.name}... `);
        const result = await quickTest(model.name);
        results.push({ model: model.name, ...result });

        if (result.success) {
            console.log(`✓ ${result.duration}ms`);
        } else {
            console.log(`✗ ${result.error}`);
        }
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 Summary');
    console.log('='.repeat(70) + '\n');

    const working = results.filter(r => r.success);
    const fastest = working.reduce((prev, curr) =>
        curr.duration < prev.duration ? curr : prev
        , working[0]);

    console.log(`✓ Working models: ${working.length}/${results.length}`);

    if (fastest) {
        console.log(`🚀 Fastest: ${fastest.model} (${fastest.duration}ms)`);
        console.log(`\n💡 Recommended .env setting:\n`);
        console.log(`OLLAMA_MODEL=${fastest.model.split(':')[0]}`);
    }

    console.log('\n✨ Quick test complete!\n');
    console.log('For detailed benchmarks, run: npm run test:ollama-models\n');
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
