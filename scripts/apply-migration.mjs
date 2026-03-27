// Script to apply the ALTER TABLE migration directly to the Neon DB
// Run with: node scripts/apply-migration.mjs

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
    console.log('🔍 Checking current users table columns...');

    const columns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
    `;

    const colNames = columns.map(c => c.column_name);
    console.log('Current columns:', colNames.join(', '));

    const hasEmail = colNames.includes('email');
    const hasFirstName = colNames.includes('first_name');

    if (!hasEmail && hasFirstName) {
        console.log('✅ Migration already applied. Nothing to do.');
        return;
    }

    if (!hasEmail && !hasFirstName) {
        console.error('❌ Unexpected schema state. Please check manually.');
        return;
    }

    console.log('🚀 Applying migration: replacing email with first_name, last_name, date_of_birth...');

    // Step 1: Add new columns (nullable first)
    await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "first_name" varchar(255)`;
    console.log('  ✓ Added first_name');

    await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_name" varchar(255)`;
    console.log('  ✓ Added last_name');

    await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "date_of_birth" date`;
    console.log('  ✓ Added date_of_birth');

    // Step 2: Populate from existing name field
    await sql`
        UPDATE "users" SET
            "first_name" = split_part("name", ' ', 1),
            "last_name" = CASE
                WHEN position(' ' IN "name") > 0 
                THEN substring("name" FROM position(' ' IN "name") + 1)
                ELSE split_part("name", ' ', 1)
            END,
            "date_of_birth" = '1990-01-01'
        WHERE "first_name" IS NULL
    `;
    console.log('  ✓ Populated new columns from existing name data');

    // Step 3: Make NOT NULL
    await sql`ALTER TABLE "users" ALTER COLUMN "first_name" SET NOT NULL`;
    await sql`ALTER TABLE "users" ALTER COLUMN "last_name" SET NOT NULL`;
    await sql`ALTER TABLE "users" ALTER COLUMN "date_of_birth" SET NOT NULL`;
    console.log('  ✓ Set NOT NULL constraints');

    // Step 4: Drop email column
    await sql`ALTER TABLE "users" DROP COLUMN IF EXISTS "email"`;
    console.log('  ✓ Dropped email column');

    // Step 5: Create unique index (ignore if already exists)
    try {
        await sql`CREATE UNIQUE INDEX "users_identity_unique" ON "users" ("first_name", "last_name", "date_of_birth")`;
        console.log('  ✓ Created unique index on (first_name, last_name, date_of_birth)');
    } catch (e) {
        if (e.message?.includes('already exists')) {
            console.log('  ✓ Unique index already exists');
        } else {
            throw e;
        }
    }

    console.log('\n✅ Migration completed successfully!');

    // Verify
    const newColumns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
    `;
    console.log('New columns:', newColumns.map(c => c.column_name).join(', '));
}

applyMigration().catch(err => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
});
