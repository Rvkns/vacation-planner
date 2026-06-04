// Script to reconcile and sync user vacation/personal hours balance with actual approved requests
// Run with: node scripts/sync-vacation-days.mjs

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file manually
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
    // Rely on environment variables already set
}

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set in .env');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// --- Italian Holiday & Working Days Calculation Logic (copied from src/lib/dateUtils.ts) ---

function getEasterDate(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

function isItalianHoliday(date) {
    const month = date.getMonth();
    const day = date.getDate();
    const year = date.getFullYear();

    if (month === 0 && day === 1) return true; // Capodanno
    if (month === 0 && day === 6) return true; // Epifania
    if (month === 3 && day === 25) return true; // Liberazione
    if (month === 4 && day === 1) return true; // Lavoro
    if (month === 5 && day === 2) return true; // Repubblica
    if (month === 7 && day === 15) return true; // Ferragosto
    if (month === 10 && day === 1) return true; // Tutti i Santi
    if (month === 11 && day === 8) return true; // Immacolata
    if (month === 11 && day === 25) return true; // Natale
    if (month === 11 && day === 26) return true; // S. Stefano

    const easter = getEasterDate(year);
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);

    if (month === easter.getMonth() && day === easter.getDate()) return true;
    if (month === easterMonday.getMonth() && day === easterMonday.getDate()) return true;

    return false;
}

function calculateWorkingDays(startDateStr, endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    if (start > end) return 0;

    let count = 0;
    const current = new Date(start);

    while (current <= end) {
        const dayOfWeek = current.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (!isWeekend && !isItalianHoliday(current)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }

    return count;
}

function calculateTotalHours(request) {
    if (!request.start_time || !request.end_time) return 0;
    const [startH, startM] = request.start_time.split(':').map(Number);
    const [endH, endM] = request.end_time.split(':').map(Number);
    const diffHours = (endH + endM / 60) - (startH + startM / 60);
    return diffHours > 0 ? diffHours : 0;
}

async function syncBalances() {
    console.log('🚀 Starting vacation and personal hours database reconciliation...');

    // Fetch all users
    const users = await sql`SELECT id, name, first_name, last_name, vacation_days_total, vacation_days_used, personal_hours_total, personal_hours_used FROM users`;
    console.log(`📊 Found ${users.length} users in the database.`);

    for (const user of users) {
        console.log(`\n👤 Analyzing balance for: ${user.name} (ID: ${user.id})`);

        // Fetch all approved requests for this user
        const requests = await sql`
            SELECT id, type, start_date, end_date, start_time, end_time, status 
            FROM leave_requests 
            WHERE user_id = ${user.id} AND status = 'APPROVED'
        `;

        let calculatedVacationUsed = 0;
        let calculatedPersonalHoursUsed = 0;

        for (const req of requests) {
            if (req.type === 'VACATION') {
                let days = 0;
                if (req.start_time && req.end_time) {
                    days = 0.5; // Half-day vacation
                } else {
                    days = calculateWorkingDays(req.start_date, req.end_date);
                }
                calculatedVacationUsed += days;
            } else {
                // SICK, PERSONAL, or other leave types count against personal hours
                let hours = 0;
                if (req.start_time && req.end_time) {
                    hours = calculateTotalHours(req);
                } else {
                    const days = calculateWorkingDays(req.start_date, req.end_date);
                    hours = days * 8;
                }
                calculatedPersonalHoursUsed += Math.round(hours);
            }
        }

        const currentVacationUsed = parseFloat(user.vacation_days_used);
        const currentPersonalUsed = parseInt(user.personal_hours_used, 10);

        console.log(`   - Vacation Days: Current in DB = ${currentVacationUsed} | Calculated from Approved Requests = ${calculatedVacationUsed}`);
        console.log(`   - Personal Hours: Current in DB = ${currentPersonalUsed} | Calculated from Approved Requests = ${calculatedPersonalHoursUsed}`);

        if (currentVacationUsed !== calculatedVacationUsed || currentPersonalUsed !== calculatedPersonalHoursUsed) {
            console.log(`   🔄 Updating database balance to match actual approved requests...`);
            await sql`
                UPDATE users 
                SET vacation_days_used = ${calculatedVacationUsed},
                    personal_hours_used = ${calculatedPersonalHoursUsed},
                    updated_at = NOW()
                WHERE id = ${user.id}
            `;
            console.log(`   ✅ Successfully updated!`);
        } else {
            console.log(`   ✅ Balance is already in sync.`);
        }
    }

    console.log('\n🎉 Reconciliation completed successfully!');
}

syncBalances().catch(err => {
    console.error('❌ Error during synchronization:', err);
    process.exit(1);
});
