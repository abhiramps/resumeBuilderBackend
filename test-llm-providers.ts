/**
 * Test script for LLM providers
 * Run with: npm run test:llm-providers
 */

import 'dotenv/config';
import { LLMFactory, LLMProvider } from './src/config/llm';

async function testProvider(provider: LLMProvider) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing ${provider.toUpperCase()} Provider`);
    console.log('='.repeat(60));

    try {
        const factory = LLMFactory.getInstance();

        // Check availability
        console.log(`\n1. Checking availability...`);
        const isAvailable = await factory.isProviderAvailable(provider);
        console.log(`   ✓ Available: ${isAvailable}`);

        if (!isAvailable) {
            console.log(`   ✗ Provider not available. Skipping tests.`);
            return;
        }

        // Get provider instance
        console.log(`\n2. Getting provider instance...`);
        const llmProvider = factory.getProvider(provider);
        console.log(`   ✓ Provider: ${llmProvider.getProviderName()}`);

        // Test simple completion
        console.log(`\n3. Testing simple completion...`);
        const response = await llmProvider.generateCompletion([
            {
                role: 'system',
                content: 'You are a helpful assistant. Respond with exactly one word.',
            },
            {
                role: 'user',
                content: 'Say "Hello"',
            },
        ], {
            temperature: 0.1,
            maxTokens: 10,
        });

        if (response.success) {
            console.log(`   ✓ Success!`);
            console.log(`   Response: "${response.content?.trim()}"`);
            console.log(`   Usage: ${JSON.stringify(response.usage)}`);
        } else {
            console.log(`   ✗ Failed: ${response.error}`);
        }

        // Test JSON response
        console.log(`\n4. Testing JSON response...`);
        const jsonResponse = await llmProvider.generateCompletion([
            {
                role: 'system',
                content: 'You are a JSON generator. Always respond with valid JSON only.',
            },
            {
                role: 'user',
                content: 'Generate a JSON object with fields: name (string), age (number). Use example data.',
            },
        ], {
            temperature: 0.1,
            maxTokens: 100,
            responseFormat: 'json',
        });

        if (jsonResponse.success) {
            console.log(`   ✓ Success!`);
            try {
                const parsed = JSON.parse(jsonResponse.content || '{}');
                console.log(`   Parsed JSON:`, parsed);
            } catch (e) {
                console.log(`   ⚠ Response is not valid JSON:`, jsonResponse.content);
            }
        } else {
            console.log(`   ✗ Failed: ${jsonResponse.error}`);
        }

        console.log(`\n✅ ${provider.toUpperCase()} tests completed!`);
    } catch (error) {
        console.error(`\n❌ ${provider.toUpperCase()} tests failed:`, error instanceof Error ? error.message : error);
    }
}

async function main() {
    console.log('\n🚀 LLM Provider Test Suite\n');

    const factory = LLMFactory.getInstance();
    const currentProvider = factory.getCurrentProvider();

    console.log(`Current provider from env: ${currentProvider}`);
    console.log(`LLM_PROVIDER=${process.env.LLM_PROVIDER || 'not set'}`);

    // Test current provider
    await testProvider(currentProvider);

    // Optionally test all providers
    const testAll = process.argv.includes('--all');
    if (testAll) {
        console.log('\n\n📋 Testing all providers...\n');
        const providers: LLMProvider[] = ['openai', 'claude', 'ollama', 'gemini'];

        for (const provider of providers) {
            if (provider !== currentProvider) {
                await testProvider(provider);
            }
        }
    }

    // Show available providers
    console.log(`\n${'='.repeat(60)}`);
    console.log('Available Providers Summary');
    console.log('='.repeat(60));

    const available = await factory.getAvailableProviders();
    console.log(`\nAvailable providers: ${available.join(', ') || 'none'}`);

    if (available.length === 0) {
        console.log('\n⚠️  No providers are available!');
        console.log('Please configure at least one provider in your .env file.');
        console.log('See LLM_PROVIDER_SETUP.md for instructions.');
    }

    console.log('\n✨ Test suite completed!\n');
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
