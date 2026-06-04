function getEasterDate(year: number): Date {
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
    const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

export function isItalianHoliday(date: Date): boolean {
    const month = date.getMonth(); // 0-indexed: 0 = January, ..., 11 = December
    const day = date.getDate();
    const year = date.getFullYear();

    // Fixed Italian holidays:
    // 1 Gennaio (Capodanno)
    if (month === 0 && day === 1) return true;
    // 6 Gennaio (Epifania)
    if (month === 0 && day === 6) return true;
    // 25 Aprile (Festa della Liberazione)
    if (month === 3 && day === 25) return true;
    // 1 Maggio (Festa del Lavoro)
    if (month === 4 && day === 1) return true;
    // 2 Giugno (Festa della Repubblica)
    if (month === 5 && day === 2) return true;
    // 15 Agosto (Ferragosto / Assunzione)
    if (month === 7 && day === 15) return true;
    // 1 Novembre (Tutti i Santi)
    if (month === 10 && day === 1) return true;
    // 8 Dicembre (Immacolata Concezione)
    if (month === 11 && day === 8) return true;
    // 25 Dicembre (Natale)
    if (month === 11 && day === 25) return true;
    // 26 Dicembre (Santo Stefano)
    if (month === 11 && day === 26) return true;

    // Mobile Italian holidays (Easter Sunday and Easter Monday):
    const easter = getEasterDate(year);
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);

    if (month === easter.getMonth() && day === easter.getDate()) return true;
    if (month === easterMonday.getMonth() && day === easterMonday.getDate()) return true;

    return false;
}

export function calculateWorkingDays(startDateStr: string | Date, endDateStr: string | Date): number {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    // Normalize dates to midnight in local time to avoid timezone offsets causing skipped/extra days
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0;
    }

    if (start > end) {
        return 0;
    }

    let count = 0;
    const current = new Date(start);

    while (current <= end) {
        const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (!isWeekend && !isItalianHoliday(current)) {
            count++;
        }

        current.setDate(current.getDate() + 1);
    }

    return count;
}
