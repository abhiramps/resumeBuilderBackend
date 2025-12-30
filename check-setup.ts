/**
 * Environment Setup Checker
 * 
 * Verifies that all required dependencies and environment variables
 * are properly configured for AI resume import.
 */

import * as fs from 'fs';
import * as path from 'path';

console.log('🔍 Checking AI Resume Import Setup...\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: Node version
console.log('1️⃣  Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion >= 18) {
    console.log(`   ✅ Node.js ${nodeVersion} (OK)\n`);
} else {
    console.log(`   ❌ Node.js ${nodeVersion} (Need 18+)\n`);
    hasErrors = true;
}

// Check 2: Required npm packages
console.log('2️⃣  Checking npm packages...');
const requiredPackages = [
    'pdf-parse',
    'mammoth',
    'openai',
    'express',
    'dotenv',
    '@prisma/client',
];

for (const pkg of requiredPackages) {
    const pkgPath = path.join(__dirname, 'node_modules', pkg);
    if (fs.existsSync(pkgPath)) {
        console.log(`   ✅ ${pkg}`);
    } else {
        console.log(`   ❌ ${pkg} (missing - run: npm install)`);
        hasErrors = true;
    }
}
console.log();

// Check 3: .env file
console.log('3️⃣  Checking .env file...');
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('   ❌ .env file not found\n');
    hasErrors = true;
} else {
    console.log('   ✅ .env file exists\n');

    // Check 4: Environment variables
    console.log('4️⃣  Checking environment variables...');

    // Load .env manually
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
            envVars[match[1].trim()] = match[2].trim();
        }
    });

    // Required variables
    const requiredVars = [
        { name: 'OPENAI_API_KEY', critical: true },
        { name: 'DATABASE_URL', critical: true },
        { name: 'SUPABASE_URL', critical: true },
        { name: 'SUPABASE_KEY', critical: true },
    ];

    for (const { name, critical } of requiredVars) {
        const value = envVars[name];
        if (!value || value.includes('your_') || value.includes('YOUR_')) {
            if (critical) {
                console.log(`   ❌ ${name} (not set or placeholder)`);
                hasErrors = true;
            } else {
                console.log(`   ⚠️  ${name} (not set or placeholder)`);
                hasWarnings = true;
            }
        } else {
            // Mask sensitive values
            const masked = value.length > 20
                ? value.substring(0, 10) + '...' + value.substring(value.length - 5)
                : value.substring(0, 5) + '...';
            console.log(`   ✅ ${name} (${masked})`);
        }
    }

    // Optional variables with defaults
    const optionalVars = [
        { name: 'AI_MODEL', default: 'gpt-4o-mini' },
        { name: 'AI_TIMEOUT', default: '20000' },
        { name: 'AI_MAX_RETRIES', default: '2' },
        { name: 'MAX_FILE_SIZE', default: '10485760' },
        { name: 'IMPORT_RATE_LIMIT', default: '5' },
    ];

    console.log('\n   Optional (with defaults):');
    for (const { name, default: defaultValue } of optionalVars) {
        const value = envVars[name] || defaultValue;
        console.log(`   ℹ️  ${name} = ${value}`);
    }
    console.log();
}

// Check 5: Test files
console.log('5️⃣  Checking test utilities...');
const testFiles = [
    'test-pdf-import.ts',
    'create-test-pdf.ts',
    'check-setup.ts',
];

for (const file of testFiles) {
    if (fs.existsSync(path.join(__dirname, file))) {
        console.log(`   ✅ ${file}`);
    } else {
        console.log(`   ⚠️  ${file} (missing)`);
        hasWarnings = true;
    }
}
console.log();

// Check 6: Source files
console.log('6️⃣  Checking source files...');
const sourceFiles = [
    'src/services/file-parser.service.ts',
    'src/services/ai-parser.service.ts',
    'src/services/import.service.ts',
    'src/handlers/import-ai.ts',
];

for (const file of sourceFiles) {
    if (fs.existsSync(path.join(__dirname, file))) {
        console.log(`   ✅ ${file}`);
    } else {
        console.log(`   ❌ ${file} (missing)`);
        hasErrors = true;
    }
}
console.log();

// Check 7: Prisma
console.log('7️⃣  Checking Prisma...');
const prismaClient = path.join(__dirname, 'node_modules', '.prisma', 'client');
if (fs.existsSync(prismaClient)) {
    console.log('   ✅ Prisma client generated\n');
} else {
    console.log('   ⚠️  Prisma client not generated (run: npm run prisma:generate)\n');
    hasWarnings = true;
}

// Summary
console.log('━'.repeat(60));
console.log('📊 Summary\n');

if (hasErrors) {
    console.log('❌ Setup has ERRORS - fix these before testing:');
    console.log('   1. Run: npm install');
    console.log('   2. Copy .env.example to .env');
    console.log('   3. Add your OPENAI_API_KEY to .env');
    console.log('   4. Add your Supabase credentials to .env');
    console.log('   5. Run: npm run prisma:generate\n');
    process.exit(1);
} else if (hasWarnings) {
    console.log('⚠️  Setup has warnings but should work');
    console.log('   Consider fixing warnings for best experience\n');
    process.exit(0);
} else {
    console.log('✅ All checks passed! Setup is ready.\n');
    console.log('Next steps:');
    console.log('   1. Create test PDF: ts-node create-test-pdf.ts');
    console.log('   2. Test import: ts-node test-pdf-import.ts test-resume.pdf');
    console.log('   3. Start backend: npm run dev');
    console.log('   4. Test via UI: http://localhost:3000\n');
    process.exit(0);
}
