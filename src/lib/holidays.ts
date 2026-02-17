
import { addDays, getDate, getMonth, getYear, isSameDay } from 'date-fns';

export interface Holiday {
    date: Date;
    name: string;
    localName: string;
}

// Fixed holidays in Italy
const fixedHolidays = [
    { month: 0, day: 1, name: 'New Year\'s Day', localName: 'Capodanno' },
    { month: 0, day: 6, name: 'Epiphany', localName: 'Epifania' },
    { month: 3, day: 25, name: 'Liberation Day', localName: 'Festa della Liberazione' },
    { month: 4, day: 1, name: 'Labour Day', localName: 'Festa del Lavoro' },
    { month: 5, day: 2, name: 'Republic Day', localName: 'Festa della Repubblica' },
    { month: 7, day: 15, name: 'Assumption of Mary', localName: 'Ferragosto' },
    { month: 10, day: 1, name: 'All Saints\' Day', localName: 'Ognissanti' },
    { month: 11, day: 8, name: 'Immaculate Conception', localName: 'Immacolata Concezione' },
    { month: 11, day: 25, name: 'Christmas Day', localName: 'Natale' },
    { month: 11, day: 26, name: 'St. Stephen\'s Day', localName: 'Santo Stefano' },
];

// Calculate Easter Sunday (Western)
// Content taken from a standard algorithm for Easter calculation (Meeus/Jones/Butcher)
function getEaster(year: number): Date {
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
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month, day);
}

export function getHolidays(year: number): Holiday[] {
    const holidays: Holiday[] = [];

    // Add fixed holidays
    fixedHolidays.forEach((h) => {
        holidays.push({
            date: new Date(year, h.month, h.day),
            name: h.name,
            localName: h.localName,
        });
    });

    // Add Easter and Easter Monday (Pasquetta)
    const easter = getEaster(year);
    const easterMonday = addDays(easter, 1);

    holidays.push({
        date: easter,
        name: 'Easter Sunday',
        localName: 'Pasqua',
    });

    holidays.push({
        date: easterMonday,
        name: 'Easter Monday',
        localName: 'Pasquetta',
    });

    // Sort by date
    return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function isHoliday(date: Date, holidays: Holiday[]): Holiday | undefined {
    return holidays.find((h) => isSameDay(h.date, date));
}

// Helper to get holidays for a range of years
export function getHolidaysForRange(startYear: number, endYear: number): Holiday[] {
    let allHolidays: Holiday[] = [];
    for (let year = startYear; year <= endYear; year++) {
        allHolidays = [...allHolidays, ...getHolidays(year)];
    }
    return allHolidays;
}
