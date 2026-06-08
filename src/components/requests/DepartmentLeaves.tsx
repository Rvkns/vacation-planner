'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { leaveService } from '@/services/leaveService';
import { 
    Table as TableIcon, 
    FileSpreadsheet, 
    Printer, 
    ChevronLeft, 
    ChevronRight, 
    Filter, 
    Users,
    Info
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval, 
    isSameDay, 
    isWeekend, 
    addMonths, 
    subMonths,
    getDate,
    getDay
} from 'date-fns';
import { it } from 'date-fns/locale';
import { LeaveRequest, User } from '@/types';
import { useUsers, useLeaveRequests } from '@/hooks/useData';
import { getHolidays, isHoliday } from '@/lib/holidays';
import Image from 'next/image';

export default function DepartmentLeaves() {
    const { data: session } = useSession();
    const currentUser = session?.user;
    
    const { users: allUsers, isLoading: isLoadingUsers } = useUsers();
    const { leaveRequests: allRequests, isLoading: isLoadingRequests } = useLeaveRequests();

    // Date and filter states
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    // Find current user's department to use as initial default, otherwise 'ALL'
    const userDbInfo = useMemo(() => {
        if (!currentUser || !allUsers.length) return null;
        return allUsers.find(u => u.id === currentUser.id);
    }, [currentUser, allUsers]);

    const [selectedDepartment, setSelectedDepartment] = useState<string>('INITIAL');

    // Handle initial department setting
    const activeDepartment = useMemo(() => {
        if (selectedDepartment === 'INITIAL') {
            return userDbInfo?.department || 'ALL';
        }
        return selectedDepartment;
    }, [selectedDepartment, userDbInfo]);

    // List of unique departments from users, plus 'ALL'
    const departments = useMemo(() => {
        const list = new Set<string>();
        allUsers.forEach(u => {
            if (u.department) list.add(u.department);
        });
        return ['ALL', ...Array.from(list)];
    }, [allUsers]);

    // Calendar navigation
    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const handleCurrentMonth = () => setCurrentMonth(new Date());

    // Month details
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = useMemo(() => {
        return eachDayOfInterval({ start: monthStart, end: monthEnd });
    }, [monthStart, monthEnd]);

    const holidays = useMemo(() => {
        return getHolidays(currentMonth.getFullYear());
    }, [currentMonth]);

    // Filter users by department
    const filteredUsers = useMemo(() => {
        if (activeDepartment === 'ALL') {
            return [...allUsers].sort((a, b) => a.name.localeCompare(b.name));
        }
        return allUsers
            .filter(u => u.department === activeDepartment)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [allUsers, activeDepartment]);

    // Helper: translate leave type
    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            VACATION: 'Ferie',
            SICK: 'Malattia',
            PERSONAL: 'Permesso',
        };
        return labels[type] || type;
    };

    const getTypeColorClass = (type: string) => {
        const colors: Record<string, string> = {
            VACATION: 'bg-green-500/20 border-green-500/40 text-green-700 dark:text-green-400',
            SICK: 'bg-red-500/20 border-red-500/40 text-red-700 dark:text-red-400',
            PERSONAL: 'bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-400',
        };
        return colors[type] || 'bg-gray-500/20 text-gray-700';
    };

    // Find if a specific user has an approved request on a specific day
    const getDayStatus = (userId: string, day: Date) => {
        return allRequests.find(req => {
            if (req.userId !== userId) return false;
            // Check if status is APPROVED (or auto-approved VACATION)
            if (req.status !== 'APPROVED' && req.status !== 'PENDING') return false; 
            
            const reqStart = new Date(req.startDate);
            const reqEnd = new Date(req.endDate);
            reqStart.setHours(0,0,0,0);
            reqEnd.setHours(0,0,0,0);
            const checkDay = new Date(day);
            checkDay.setHours(0,0,0,0);

            return checkDay >= reqStart && checkDay <= reqEnd;
        });
    };

    // Helper: get day of week abbreviation in Italian
    const getDayOfWeekLabel = (day: Date) => {
        const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
        return days[getDay(day)];
    };

    // Export to Excel (CSV)
    const handleExportCSV = () => {
        const headers = [
            'Dipendente',
            'Ruolo',
            'Dipartimento',
            ...daysInMonth.map(d => format(d, 'dd/MM/yyyy'))
        ];

        const rows = filteredUsers.map(user => {
            const userRow = [
                user.name,
                user.jobTitle || 'Membro del Team',
                user.department || 'Nessuno'
            ];

            daysInMonth.forEach(day => {
                const holiday = isHoliday(day, holidays);
                const isWk = isWeekend(day);
                const status = getDayStatus(user.id, day);

                if (status) {
                    const isHalfDay = status.type === 'VACATION' && status.startTime && status.endTime;
                    if (isHalfDay) {
                        userRow.push(`${getTypeLabel(status.type)} (1/2 Giorno: ${status.startTime === '09:00' ? 'Mattina' : 'Pomeriggio'})`);
                    } else if (status.type === 'PERSONAL' && status.startTime && status.endTime) {
                        userRow.push(`${getTypeLabel(status.type)} (${leaveService.calculateTotalHours(status)} ore: ${status.startTime}-${status.endTime})`);
                    } else {
                        userRow.push(getTypeLabel(status.type));
                    }
                } else if (holiday) {
                    userRow.push(`Festività: ${holiday.localName}`);
                } else if (isWk) {
                    userRow.push('Weekend');
                } else {
                    userRow.push('Lavoro');
                }
            });

            return userRow;
        });

        // Use semicolon as separator for better Italian/Excel compatibility
        const csvContent = [
            headers.join(';'),
            ...rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(';'))
        ].join('\r\n');

        // Add UTF-8 BOM byte sequence so Excel correctly displays Italian accents
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const filename = `piano_ferie_${activeDepartment.toLowerCase().replace(/\s+/g, '_')}_${format(currentMonth, 'yyyy_MM')}.csv`;
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Print page
    const handlePrint = () => {
        window.print();
    };

    if (isLoadingUsers || isLoadingRequests) {
        return <div className="p-12 text-center text-neutral-500">Caricamento in corso...</div>;
    }

    return (
        <div className="p-6 lg:p-8 space-y-8 print-area max-w-full overflow-hidden">
            {/* Styles for printing landscape and hiding elements */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: landscape;
                        margin: 0.5cm;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    aside, .sidebar, header, nav, button, select, .filter-bar, .print-hide {
                        display: none !important;
                    }
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print-full-width {
                        width: 100% !important;
                        max-width: 100% !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .print-table {
                        font-size: 10px !important;
                        border-collapse: collapse !important;
                        width: 100% !important;
                    }
                    .print-table th, .print-table td {
                        border: 1px solid #c7c7c7 !important;
                        padding: 2px 4px !important;
                    }
                    .print-table td.weekend {
                        background-color: #f3f4f6 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .print-table td.holiday {
                        background-color: #ffe4e6 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .print-table td.vacation {
                        background-color: #d1fae5 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>

            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print-hide">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <TableIcon className="w-8 h-8 text-[#EB0A1E]" />
                        Piano Ferie Reparti
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Panoramica tabellare e pianificazione mensile dei dipendenti
                    </p>
                </div>
                
                {/* Export Buttons */}
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <Button 
                        onClick={handleExportCSV}
                        variant="outline"
                        className="flex-1 sm:flex-initial gap-2 border-green-200 hover:bg-green-50 dark:border-green-900 dark:hover:bg-green-900/10 text-green-700 dark:text-green-400"
                        title="Esporta in Excel (.csv)"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Esporta Excel
                    </Button>
                    <Button 
                        onClick={handlePrint}
                        variant="outline"
                        className="flex-1 sm:flex-initial gap-2 border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                        title="Stampa o Salva come PDF"
                    >
                        <Printer className="w-4 h-4" />
                        Esporta PDF / Stampa
                    </Button>
                </div>
            </div>

            {/* Filters bar */}
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 print-hide filter-bar">
                {/* Department Filter */}
                <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 shrink-0">Reparto:</span>
                    <select
                        value={activeDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="pl-3 pr-8 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:ring-2 focus:ring-[#EB0A1E] outline-none transition-all text-sm appearance-none cursor-pointer w-full md:w-56"
                    >
                        {departments.map((dept) => (
                            <option key={dept} value={dept}>
                                {dept === 'ALL' ? 'Tutti i reparti 👥' : dept}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Calendar switcher */}
                <div className="flex items-center justify-between md:justify-end gap-4">
                    <div className="flex items-center gap-1.5 bg-neutral-100/80 dark:bg-neutral-800/80 p-1 rounded-xl shadow-sm border border-neutral-200/50 dark:border-neutral-700/50">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePrevMonth}
                            className="hover:bg-neutral-200 dark:hover:bg-neutral-700 w-8 h-8 p-0 rounded-lg text-neutral-600 dark:text-neutral-300"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <button
                            onClick={handleCurrentMonth}
                            className="px-3 py-1 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:text-[#EB0A1E] transition-colors"
                        >
                            Oggi
                        </button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleNextMonth}
                            className="hover:bg-neutral-200 dark:hover:bg-neutral-700 w-8 h-8 p-0 rounded-lg text-neutral-600 dark:text-neutral-300"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                    <span className="font-bold text-lg text-neutral-800 dark:text-neutral-200 capitalize min-w-[150px] text-right">
                        {format(currentMonth, 'MMMM yyyy', { locale: it })}
                    </span>
                </div>
            </div>

            {/* Grid display card */}
            <Card className="border-none shadow-xl overflow-hidden bg-white dark:bg-neutral-900 print-full-width">
                <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Users className="w-5 h-5 text-neutral-500" />
                                {activeDepartment === 'ALL' ? 'Tutti i Dipendenti' : `Membri di: ${activeDepartment}`}
                            </CardTitle>
                            <CardDescription className="print-hide">
                                Visualizzazione Gantt mensile. Passa con il mouse sulle celle per vedere le note o le motivazioni delle assenze.
                            </CardDescription>
                        </div>
                        <div className="hidden print:block text-xs font-semibold text-neutral-500">
                            Piano Ferie Mensile: {format(currentMonth, 'MMMM yyyy', { locale: it })} (Reparto: {activeDepartment === 'ALL' ? 'Tutti' : activeDepartment})
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto print:overflow-visible custom-scrollbar">
                    {filteredUsers.length === 0 ? (
                        <div className="p-12 text-center text-neutral-500">
                            Nessun dipendente trovato per il reparto selezionato.
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse print-table">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/30">
                                    {/* Left header column for names */}
                                    <th className="p-4 font-semibold text-xs text-neutral-400 uppercase tracking-wider sticky left-0 bg-neutral-50 dark:bg-neutral-950 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)] min-w-[220px] max-w-[220px] border-r border-neutral-100 dark:border-neutral-800">
                                        Membro
                                    </th>
                                    {/* Month day columns */}
                                    {daysInMonth.map((day) => {
                                        const isWk = isWeekend(day);
                                        const holiday = isHoliday(day, holidays);
                                        return (
                                            <th 
                                                key={day.toString()} 
                                                className={`p-2.5 font-bold text-center text-[10px] min-w-[36px] border-r border-neutral-100 dark:border-neutral-800/50 ${
                                                    isWk 
                                                        ? 'bg-neutral-100/50 dark:bg-neutral-800/30 text-neutral-400' 
                                                        : holiday 
                                                            ? 'bg-rose-50 dark:bg-rose-950/10 text-rose-500' 
                                                            : 'text-neutral-500 dark:text-neutral-400'
                                                }`}
                                            >
                                                <div className="uppercase tracking-tighter text-[8px] font-medium">{getDayOfWeekLabel(day)}</div>
                                                <div className="text-xs">{format(day, 'd')}</div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr 
                                        key={user.id} 
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50/30 dark:hover:bg-neutral-800/10 transition-colors"
                                    >
                                        {/* Sticky Member name */}
                                        <td className="p-4 sticky left-0 bg-white dark:bg-neutral-900 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-r border-neutral-100 dark:border-neutral-800 flex items-center gap-3 min-w-[220px] max-w-[220px]">
                                            <Image
                                                src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                                                alt={user.name}
                                                width={32}
                                                height={32}
                                                className="rounded-full ring-2 ring-neutral-100 dark:ring-neutral-800 shrink-0"
                                            />
                                            <div className="truncate">
                                                <p className="font-semibold text-sm text-neutral-850 dark:text-white truncate">
                                                    {user.name}
                                                </p>
                                                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
                                                    {user.jobTitle || 'Team Member'}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Status cells for each day */}
                                        {daysInMonth.map((day) => {
                                            const isWk = isWeekend(day);
                                            const holiday = isHoliday(day, holidays);
                                            const request = getDayStatus(user.id, day);

                                            let cellClass = 'p-1.5 border-r border-neutral-100 dark:border-neutral-800/30 text-center text-[10px] relative group/cell min-w-[36px]';
                                            let innerContent = null;
                                            let tooltipContent = null;

                                            if (request) {
                                                const isHalfDay = request.type === 'VACATION' && request.startTime && request.endTime;
                                                const isHourly = request.type === 'PERSONAL' && request.startTime && request.endTime;
                                                const totalHours = isHourly ? leaveService.calculateTotalHours(request) : 0;

                                                cellClass += ` vacation ${getTypeColorClass(request.type)} font-bold`;

                                                if (isHalfDay) {
                                                    innerContent = <div className="text-[9px] scale-90">{request.startTime === '09:00' ? '½ M' : '½ P'}</div>;
                                                } else if (isHourly) {
                                                    innerContent = <div className="text-[9px] scale-90">{totalHours}h</div>;
                                                } else {
                                                    innerContent = <div className="text-[9px] scale-90">{request.type === 'VACATION' ? 'F' : request.type === 'SICK' ? 'M' : 'P'}</div>;
                                                }

                                                tooltipContent = (
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:flex flex-col bg-neutral-900 text-white text-[11px] p-3 rounded-lg shadow-xl z-35 min-w-[200px] border border-neutral-800 pointer-events-none">
                                                        <div className="font-bold flex items-center justify-between gap-2 border-b border-neutral-800 pb-1 mb-1">
                                                            <span>{getTypeLabel(request.type)}</span>
                                                            <span className="text-[9px] opacity-70">
                                                                {request.status === 'APPROVED' ? 'Approvato' : 'In attesa'}
                                                            </span>
                                                        </div>
                                                        <p><span className="opacity-60">Periodo:</span> {format(new Date(request.startDate), 'dd/MM')} - {format(new Date(request.endDate), 'dd/MM')}</p>
                                                        {isHalfDay && <p><span className="opacity-60">Orario:</span> Mezza giornata ({request.startTime === '09:00' ? 'Mattina' : 'Pomeriggio'})</p>}
                                                        {isHourly && <p><span className="opacity-60">Orario:</span> {request.startTime} - {request.endTime} ({totalHours}h)</p>}
                                                        {request.reason && <p className="truncate"><span className="opacity-60">Motivazione:</span> {request.reason}</p>}
                                                        {request.handoverNotes && <p className="truncate italic mt-1 border-t border-neutral-850 pt-1 text-[10px] text-amber-400">"{request.handoverNotes}"</p>}
                                                    </div>
                                                );
                                            } else if (holiday) {
                                                cellClass += ' holiday bg-rose-100/40 dark:bg-rose-950/10 text-rose-500';
                                                innerContent = <div className="text-[8px] opacity-65 cursor-help" title={holiday.localName}>Fest</div>;
                                            } else if (isWk) {
                                                cellClass += ' weekend bg-neutral-50 dark:bg-neutral-800/10';
                                            }

                                            return (
                                                <td key={day.toString()} className={cellClass}>
                                                    {innerContent}
                                                    {tooltipContent}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>

            {/* Bottom info section */}
            <div className="bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-105 dark:border-neutral-800/80 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 print-hide">
                <div className="flex items-center gap-2 font-medium">
                    <Info className="w-4 h-4 text-[#EB0A1E] shrink-0" />
                    <span>Legenda Stato Assenze:</span>
                </div>
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30 text-green-700 dark:text-green-400 text-[10px] font-bold flex items-center justify-center shrink-0">F</span>
                        <span>Ferie Intere (F) o Mezze Giornate (½ M / ½ P)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0">P</span>
                        <span>Permessi Giornalieri (P) o Orari (es. 2h / 4h)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30 text-red-700 dark:text-red-400 text-[10px] font-bold flex items-center justify-center shrink-0">M</span>
                        <span>Malattia (M)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-rose-100/40 border border-rose-200/50 text-rose-500 text-[10px] font-bold flex items-center justify-center shrink-0">Fest</span>
                        <span>Festività Italiane</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
