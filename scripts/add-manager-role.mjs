// Script to add 'MANAGER' to the user_role enum directly in the Neon DB
// Run with: node scripts/add-manager-role.mjs

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Manually load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

try {
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
                const key = trimmed.slice(0, eqIdx).trim();
                const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
                process.env[key] = val;
            }
        }
    }
} catch {
    // .env not found, rely on environment variables
}

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set in .env');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function addManagerRole() {
    console.log('🚀 Adding MANAGER to user_role enum...');

    try {
        // Use ALTER TYPE to add the enum value
        await sql`ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'MANAGER'`;
        console.log('  ✓ Added MANAGER to user_role enum successfully (or it already existed)');
    } catch (error) {
        // Fallback for older Postgres versions (without IF NOT EXISTS)
        if (error.code === '42710') { // duplicate_object
            console.log('  ⚠ MANAGER already exists in user_role enum');
        } else {
            // Try without IF NOT EXISTS if syntax error
            try {
                await sql`ALTER TYPE "user_role" ADD VALUE 'MANAGER'`;
                console.log('  ✓ Added MANAGER to user_role enum successfully');
            } catch (retryError) {
                if (retryError.code === '42710') {
                    console.log('  ⚠ MANAGER already exists in user_role enum');
                } else {
                    throw retryError;
                }
            }
        }
    }

    console.log('\n✅ Role update completed!');
}

addManagerRole().catch(err => {
    console.error('❌ Update failed:', err.message);
    process.exit(1);
});
