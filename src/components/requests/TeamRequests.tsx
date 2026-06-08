'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { leaveService } from '@/services/leaveService';
import { Users as UsersIcon, Search, Filter, SortAsc, XCircle, CalendarDays, Download, ExternalLink } from 'lucide-react';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { LeaveRequest, User } from '@/types';
import { useUsers, useLeaveRequests } from '@/hooks/useData';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';


export default function TeamRequests() {
    const { data: session } = useSession();
    const currentUser = session?.user;
    const { users: allUsers, isLoading: isLoadingUsers } = useUsers();
    const { leaveRequests: allRequestsRaw, isLoading: isLoadingRequests } = useLeaveRequests();

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'VACATION' | 'SICK' | 'PERSONAL'>('ALL');
    const [sortBy, setSortBy] = useState<'createdAt_desc' | 'createdAt_asc' | 'userName_asc'>('createdAt_desc');

    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

    const generateOutlookLink = (req: LeaveRequest, userName: string) => {
        let start = `${req.startDate}T09:00:00`;
        let end = `${req.endDate}T18:00:00`;

        const isPersonalHourly = req.type === 'PERSONAL' && req.startTime && req.endTime;

        if (req.type === 'VACATION') {
            if (req.startTime === '09:00' && req.endTime === '13:00') {
                end = `${req.startDate}T13:00:00`;
            } else if (req.startTime === '14:00' && req.endTime === '18:00') {
                start = `${req.startDate}T14:00:00`;
                end = `${req.startDate}T18:00:00`;
            }
        } else {
            if (req.startTime) start = `${req.startDate}T${req.startTime}:00`;
            if (req.endTime) end = `${req.endDate}T${req.endTime}:00`;
        }

        const typeLabel = getTypeLabel(req.type);
        const subject = encodeURIComponent(`${typeLabel} - ${userName}`);
        
        const dayCount = leaveService.calculateDays(req);
        const hoursCount = isPersonalHourly ? leaveService.calculateTotalHours(req) : 0;
        const durationStr = isPersonalHourly 
            ? `${hoursCount} ore (${req.startTime} - ${req.endTime})`
            : `${dayCount} giorn${dayCount === 1 ? 'o' : 'i'}`;

        const bodyText = `Dettagli Assenza:
Dipendente: ${userName}
Tipo: ${typeLabel}
Periodo: dal ${format(new Date(req.startDate), 'dd/MM/yyyy')} al ${format(new Date(req.endDate), 'dd/MM/yyyy')}
Durata: ${durationStr}
${req.reason ? `Motivazione: ${req.reason}` : ''}
${req.handoverNotes ? `Note di Handover: ${req.handoverNotes}` : ''}

Aggiunto tramite VacaPlanner`;
        const body = encodeURIComponent(bodyText);
        
        return `https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&subject=${subject}&startdt=${start}&enddt=${end}&body=${body}`;
    };

    const generateGoogleLink = (req: LeaveRequest, userName: string) => {
        let start = `${req.startDate.replace(/-/g, '')}T090000`;
        let end = `${req.endDate.replace(/-/g, '')}T180000`;

        const isPersonalHourly = req.type === 'PERSONAL' && req.startTime && req.endTime;

        if (req.type === 'VACATION') {
            if (req.startTime === '09:00' && req.endTime === '13:00') {
                end = `${req.startDate.replace(/-/g, '')}T130000`;
            } else if (req.startTime === '14:00' && req.endTime === '18:00') {
                start = `${req.startDate.replace(/-/g, '')}T140000`;
                end = `${req.startDate.replace(/-/g, '')}T180000`;
            }
        } else {
            if (req.startTime) {
                start = `${req.startDate.replace(/-/g, '')}T${req.startTime.replace(':', '')}00`;
            }
            if (req.endTime) {
                end = `${req.endDate.replace(/-/g, '')}T${req.endTime.replace(':', '')}00`;
            }
        }

        const typeLabel = getTypeLabel(req.type);
        const subject = encodeURIComponent(`${typeLabel} - ${userName}`);
        
        const dayCount = leaveService.calculateDays(req);
        const hoursCount = isPersonalHourly ? leaveService.calculateTotalHours(req) : 0;
        const durationStr = isPersonalHourly 
            ? `${hoursCount} ore (${req.startTime} - ${req.endTime})`
            : `${dayCount} giorn${dayCount === 1 ? 'o' : 'i'}`;

        const bodyText = `Dettagli Assenza:
Dipendente: ${userName}
Tipo: ${typeLabel}
Periodo: dal ${format(new Date(req.startDate), 'dd/MM/yyyy')} al ${format(new Date(req.endDate), 'dd/MM/yyyy')}
Durata: ${durationStr}
${req.reason ? `Motivazione: ${req.reason}` : ''}
${req.handoverNotes ? `Note di Handover: ${req.handoverNotes}` : ''}

Aggiunto tramite VacaPlanner`;
        const body = encodeURIComponent(bodyText);
        
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${subject}&dates=${start}/${end}&details=${body}`;
    };

    const handleDownloadICS = (req: LeaveRequest, userName: string) => {
        let start = `${req.startDate.replace(/-/g, '')}T090000`;
        let end = `${req.endDate.replace(/-/g, '')}T180000`;

        const isPersonalHourly = req.type === 'PERSONAL' && req.startTime && req.endTime;

        if (req.type === 'VACATION') {
            if (req.startTime === '09:00' && req.endTime === '13:00') {
                end = `${req.startDate.replace(/-/g, '')}T130000`;
            } else if (req.startTime === '14:00' && req.endTime === '18:00') {
                start = `${req.startDate.replace(/-/g, '')}T140000`;
                end = `${req.startDate.replace(/-/g, '')}T180000`;
            }
        } else {
            if (req.startTime) {
                start = `${req.startDate.replace(/-/g, '')}T${req.startTime.replace(':', '')}00`;
            }
            if (req.endTime) {
                end = `${req.endDate.replace(/-/g, '')}T${req.endTime.replace(':', '')}00`;
            }
        }

        const typeLabel = getTypeLabel(req.type);
        const subject = `${typeLabel} - ${userName}`;
        
        const dayCount = leaveService.calculateDays(req);
        const hoursCount = isPersonalHourly ? leaveService.calculateTotalHours(req) : 0;
        const durationStr = isPersonalHourly 
            ? `${hoursCount} ore (${req.startTime} - ${req.endTime})`
            : `${dayCount} giorn${dayCount === 1 ? 'o' : 'i'}`;

        const bodyText = `Dipendente: ${userName}\\nTipo: ${typeLabel}\\nPeriodo: dal ${format(new Date(req.startDate), 'dd/MM/yyyy')} al ${format(new Date(req.endDate), 'dd/MM/yyyy')}\\nDurata: ${durationStr}${req.reason ? `\\nMotivazione: ${req.reason}` : ''}${req.handoverNotes ? `\\nNote di Handover: ${req.handoverNotes}` : ''}\\n\\nAggiunto tramite VacaPlanner`;

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//VacaPlanner//NONSGML Calendar Event//IT',
            'BEGIN:VEVENT',
            `UID:${req.id}-calendar@vacaplanner.com`,
            `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
            `DTSTART:${start}`,
            `DTEND:${end}`,
            `SUMMARY:${subject}`,
            `DESCRIPTION:${bodyText}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${typeLabel.toLowerCase()}_${userName.toLowerCase().replace(/\s+/g, '_')}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const allRequests = useMemo(() => {
        return [...allRequestsRaw].sort((a: LeaveRequest, b: LeaveRequest) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [allRequestsRaw]);

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            VACATION: 'Ferie',
            SICK: 'Malattia',
            PERSONAL: 'Permesso',
        };
        return labels[type] || type;
    };

    const filteredAndSortedRequests = useMemo(() => {
        let result = [...allRequests];

        // 1. Filter by user name
        if (searchTerm) {
            result = result.filter(req => {
                const user = allUsers.find(u => u.id === req.userId);
                return user?.name.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }

        // 2. Filter by type
        if (typeFilter !== 'ALL') {
            result = result.filter(req => req.type === typeFilter);
        }

        // 3. Sort
        result.sort((a, b) => {
            if (sortBy === 'createdAt_desc') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            if (sortBy === 'createdAt_asc') {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }
            if (sortBy === 'userName_asc') {
                const userA = allUsers.find(u => u.id === a.userId)?.name || '';
                const userB = allUsers.find(u => u.id === b.userId)?.name || '';
                return userA.localeCompare(userB);
            }
            return 0;
        });

        return result;
    }, [allRequests, allUsers, searchTerm, typeFilter, sortBy]);

    const clearFilters = () => {
        setSearchTerm('');
        setTypeFilter('ALL');
        setSortBy('createdAt_desc');
    };

    if (!currentUser) {
        return null;
    }
    
    if (isLoadingUsers || isLoadingRequests) {
        return <div className="p-12 text-center text-neutral-500">Caricamento in corso...</div>;
    }

    return (
        <div className="p-6 lg:p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Richieste Team
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Panoramica delle ferie e permessi del team
                </p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Cerca per nome membro..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:ring-2 focus:ring-[#EB0A1E] outline-none transition-all text-sm"
                        />
                    </div>

                    {/* Filter Type */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-neutral-400 hidden sm:block" />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                            className="pl-3 pr-8 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:ring-2 focus:ring-[#EB0A1E] outline-none transition-all text-sm appearance-none cursor-pointer"
                        >
                            <option value="ALL">Tutti i tipi</option>
                            <option value="VACATION">Ferie</option>
                            <option value="SICK">Malattia</option>
                            <option value="PERSONAL">Permesso</option>
                        </select>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <SortAsc className="w-4 h-4 text-neutral-400 hidden sm:block" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="pl-3 pr-8 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:ring-2 focus:ring-[#EB0A1E] outline-none transition-all text-sm appearance-none cursor-pointer"
                        >
                            <option value="createdAt_desc">Più recenti</option>
                            <option value="createdAt_asc">Meno recenti</option>
                            <option value="userName_asc">Nome (A-Z)</option>
                        </select>
                    </div>

                    {(searchTerm || typeFilter !== 'ALL' || sortBy !== 'createdAt_desc') && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                        >
                            <XCircle className="w-4 h-4" />
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Requests List */}
            <div className="space-y-4">
                {filteredAndSortedRequests.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <UsersIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                                {searchTerm || typeFilter !== 'ALL' ? 'Nessun risultato trovato' : 'Nessuna richiesta'}
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                {searchTerm || typeFilter !== 'ALL' 
                                    ? 'Prova a cambiare i filtri di ricerca' 
                                    : 'Il team non ha ancora inserito richieste'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredAndSortedRequests.map((request) => {
                        const user = allUsers.find((u) => u.id === request.userId);
                        if (!user) return null;

                        const dayCount = leaveService.calculateDays(request);
                        const isPersonalHourly = request.type === 'PERSONAL' && request.startTime && request.endTime;
                        const hoursCount = isPersonalHourly ? leaveService.calculateTotalHours(request) : 0;

                        return (
                            <Card
                                key={request.id}
                                onClick={() => setSelectedRequest(request)}
                                className="hover:shadow-xl transition-all cursor-pointer hover:border-[#EB0A1E]/30 dark:hover:border-[#EB0A1E]/30 hover:-translate-y-0.5 duration-200"
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        {/* User Avatar */}
                                        <Image
                                            src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                                            alt={user.name}
                                            width={48}
                                            height={48}
                                            className="rounded-full ring-2 ring-gray-200 dark:ring-gray-700 shrink-0"
                                        />

                                        {/* Request Details */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {user.name}
                                                </h3>
                                                <Badge variant="default">{getTypeLabel(request.type)}</Badge>
                                            </div>

                                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                                <p>
                                                    <span className="font-medium">Dal:</span>{' '}
                                                    {format(new Date(request.startDate), 'dd MMMM yyyy', { locale: it })}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Al:</span>{' '}
                                                    {format(new Date(request.endDate), 'dd MMMM yyyy', { locale: it })}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Durata:</span>{' '}
                                                    {isPersonalHourly ? (
                                                        <>{hoursCount} {hoursCount === 1 ? 'ora' : 'ore'} <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full ml-1">({request.startTime} - {request.endTime})</span></>
                                                    ) : (
                                                        <>{dayCount} {dayCount === 1 || dayCount === 0.5 ? 'giorno' : 'giorni'}</>
                                                    )}
                                                    {request.type === 'VACATION' && request.startTime && request.endTime && (
                                                        <span className="ml-2 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded-full">
                                                            {request.startTime === '09:00' ? 'Mattina' : 'Pomeriggio'}
                                                        </span>
                                                    )}
                                                </p>
                                                {request.reason && (
                                                    <p>
                                                        <span className="font-medium">Motivazione:</span> {request.reason}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                                    Inserita il{' '}
                                                    {format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm', { locale: it })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Modal per dettagli richiesta e sincronizzazione calendario */}
            <Modal
                isOpen={selectedRequest !== null}
                onClose={() => setSelectedRequest(null)}
                title="Dettagli Richiesta e Calendario"
            >
                {selectedRequest && (() => {
                    const user = allUsers.find(u => u.id === selectedRequest.userId);
                    if (!user) return null;

                    const dayCount = leaveService.calculateDays(selectedRequest);
                    const isPersonalHourly = selectedRequest.type === 'PERSONAL' && selectedRequest.startTime && selectedRequest.endTime;
                    const hoursCount = isPersonalHourly ? leaveService.calculateTotalHours(selectedRequest) : 0;

                    return (
                        <div className="space-y-6">
                            {/* User details and type */}
                            <div className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-700/50">
                                <Image
                                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                                    alt={user.name}
                                    width={56}
                                    height={56}
                                    className="rounded-full ring-2 ring-gray-200 dark:ring-gray-700 shrink-0"
                                />
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {user.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {user.jobTitle || 'Membro del Team'} • {user.department || 'Nessun reparto'}
                                    </p>
                                    <div className="mt-1">
                                        <Badge variant="default">{getTypeLabel(selectedRequest.type)}</Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Details of the leave */}
                            <div className="space-y-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Dal</span>
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                                            {format(new Date(selectedRequest.startDate), 'dd MMMM yyyy', { locale: it })}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Al</span>
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                                            {format(new Date(selectedRequest.endDate), 'dd MMMM yyyy', { locale: it })}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                    <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Durata</span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                                        {isPersonalHourly ? (
                                            <>{hoursCount} {hoursCount === 1 ? 'ora' : 'ore'} <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full ml-1">({selectedRequest.startTime} - {selectedRequest.endTime})</span></>
                                        ) : (
                                            <>{dayCount} {dayCount === 1 || dayCount === 0.5 ? 'giorno' : 'giorni'}</>
                                        )}
                                        {selectedRequest.type === 'VACATION' && selectedRequest.startTime && selectedRequest.endTime && (
                                            <span className="ml-2 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                                                {selectedRequest.startTime === '09:00' ? 'Mattina' : 'Pomeriggio'}
                                            </span>
                                        )}
                                    </span>
                                </div>

                                {selectedRequest.reason && (
                                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                        <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Motivazione</span>
                                        <span className="text-gray-700 dark:text-gray-300">{selectedRequest.reason}</span>
                                    </div>
                                )}

                                {selectedRequest.handoverNotes && (
                                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                        <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Note di Handover (Consegne) 📝</span>
                                        <div className="mt-1 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-900/30 italic">
                                            "{selectedRequest.handoverNotes}"
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Calendar sync block */}
                            <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-[#EB0A1E]" />
                                    Aggiungi al tuo calendario
                                </h4>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Salva questa pianificazione nel tuo calendario personale per coordinarti con {user.name.split(' ')[0]}.
                                </p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <a
                                        href={generateOutlookLink(selectedRequest, user.name)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 bg-[#0078D4]/10 text-[#0078D4] hover:bg-[#0078D4]/20 hover:text-[#0078D4] dark:bg-[#0078D4]/20 dark:hover:bg-[#0078D4]/30 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                                        title="Pianifica in Outlook"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Outlook Calendar
                                    </a>
                                    <a
                                        href={generateGoogleLink(selectedRequest, user.name)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 bg-[#34A853]/10 text-[#34A853] hover:bg-[#34A853]/20 hover:text-[#34A853] dark:bg-[#34A853]/20 dark:hover:bg-[#34A853]/30 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                                        title="Pianifica in Google Calendar"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Google Calendar
                                    </a>
                                </div>
                                <button
                                    onClick={() => handleDownloadICS(selectedRequest, user.name)}
                                    className="flex items-center justify-center gap-2 w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                                    title="Scarica file .ics standard"
                                >
                                    <Download className="w-4 h-4" />
                                    Scarica File Evento (.ics)
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
}
