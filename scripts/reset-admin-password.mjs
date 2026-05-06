import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createHash, randomBytes } from 'crypto';

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
    console.error('ERROR: DATABASE_URL non configurato. Aggiungi il file .env o esporta la variabile.');
    process.exit(1);
}

// Dynamic import of bcryptjs (CommonJS compat)
const { default: bcrypt } = await import('bcryptjs');

const sql = neon(process.env.DATABASE_URL);

async function resetAdminPassword() {
    // List all admin users
    const admins = await sql`
        SELECT id, first_name, last_name, date_of_birth
        FROM users
        WHERE role = 'ADMIN'
        ORDER BY created_at
    `;

    if (admins.length === 0) {
        console.error('Nessun utente ADMIN trovato nel database.');
        process.exit(1);
    }

    console.log('\nUtenti ADMIN trovati:');
    admins.forEach((u, i) => {
        console.log(`  [${i + 1}] ${u.first_name} ${u.last_name} (nato/a: ${u.date_of_birth})`);
    });

    // If only one admin, reset that one; otherwise take the first
    const target = admins[0];
    console.log(`\nReset password per: ${target.first_name} ${target.last_name}`);

    // Generate a secure temporary password
    const tempPassword = 'Admin-' + randomBytes(4).toString('hex').toUpperCase();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await sql`
        UPDATE users
        SET password = ${hashedPassword}, updated_at = NOW()
        WHERE id = ${target.id}
    `;

    console.log('\n✅ Password resettata con successo!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Utente  : ${target.first_name} ${target.last_name}`);
    console.log(`   Password: ${tempPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  Cambia questa password dal profilo dopo il login!');
    console.log(`   Login con: Nome="${target.first_name}", Cognome="${target.last_name}", Data="${target.date_of_birth}"\n`);
}

resetAdminPassword().catch((err) => {
    console.error('Errore:', err.message);
    process.exit(1);
});
