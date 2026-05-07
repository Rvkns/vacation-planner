import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
}

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function fixUser() {
    const firstName = process.env.TARGET_FIRST_NAME;
    const lastName = process.env.TARGET_LAST_NAME;
    const dob = process.env.TARGET_DOB;

    if (!firstName || !lastName || !dob) {
        console.error('Set TARGET_FIRST_NAME, TARGET_LAST_NAME, TARGET_DOB env vars before running.');
        process.exit(1);
    }

    const result = await sql`
        UPDATE users
        SET date_of_birth = ${dob}
        WHERE first_name = ${firstName} AND last_name = ${lastName}
        RETURNING id, first_name, last_name, date_of_birth
    `;
    console.log('Update result:', result);
}

fixUser().catch(console.error);
