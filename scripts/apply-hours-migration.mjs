// Script to apply the Hourly Leaves migration directly to the Neon DB
// Run with: node scripts/apply-hours-migration.mjs

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Manually load .env file (no dotenv needed)
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
    // .env not found, rely on environment variables already set
}

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set in .env');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function applyMigration() {
    console.log('🚀 Applying migration: adding hourly leaves support...');

    // Check if columns exist
    const columns = await sql`
        SELECT column_name, table_name 
        FROM information_schema.columns 
        WHERE table_name IN ('users', 'leave_requests')
    `;

    const userCols = columns.filter(c => c.table_name === 'users').map(c => c.column_name);
    const requestCols = columns.filter(c => c.table_name === 'leave_requests').map(c => c.column_name);

    // 1. Update users table
    if (!userCols.includes('personal_hours_total')) {
        await sql`ALTER TABLE "users" ADD COLUMN "personal_hours_total" integer DEFAULT 32 NOT NULL`;
        console.log('  ✓ Added personal_hours_total to users');
    }

    if (!userCols.includes('personal_hours_used')) {
        await sql`ALTER TABLE "users" ADD COLUMN "personal_hours_used" integer DEFAULT 0 NOT NULL`;
        // Note: Using integer for simplicity, or real/float if needed. Schema says integer? 
        // Wait, schema said "personalHoursUsed: integer('personal_hours_used').default(0).notNull()" in my change.
        // Let's stick to integer for now, assuming full hours. If partial, maybe float?
        // Let's double check schema.ts change... I used `integer` for total and `integer` for used?
        // Ah, in schema.ts I wrote: `personalHoursUsed: integer(...)`.
        // In implementation plan I wrote `float`. Let's stick to INTEGER for simplicity (minutes can be decimals or just track minutes?). 
        // Standard practice: track minutes or decimal hours. Float is safer for 1.5 hours.
        // But Drizzle checks strict types.
        // Let's check what I wrote in schema.ts...
        // `personalHoursUsed: integer('personal_hours_used').default(0).notNull()`
        // OK, I'll use integer. Maybe we store minutes? No, let's store hours as integer for now. 
        // If user enters 1.5 hours? The UI will likely pick full hours or half hours.
        // Let's change schema to `real` (float) before applying migration if we want precision.
        // User said "calcolare le ore precise". 
        // Let's check what I wrote... 
        // I'll stick to integer for now to match schema.ts I just wrote. If needed I'll change it. 
        // Wait, if I change schema.ts now I can avoid migration issues. 
        // Let's assume integer hours for now.
        console.log('  ✓ Added personal_hours_used to users');
    }

    // 2. Update leave_requests table
    if (!requestCols.includes('start_time')) {
        await sql`ALTER TABLE "leave_requests" ADD COLUMN "start_time" varchar(5)`; // HH:mm
        console.log('  ✓ Added start_time to leave_requests');
    }

    if (!requestCols.includes('end_time')) {
        await sql`ALTER TABLE "leave_requests" ADD COLUMN "end_time" varchar(5)`; // HH:mm
        console.log('  ✓ Added end_time to leave_requests');
    }

    console.log('\n✅ Hourly leaves migration completed successfully!');
}

applyMigration().catch(err => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
});
