'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { leaveService } from '@/services/leaveService';
import { Users as UsersIcon, Search, Filter, SortAsc, XCircle } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { LeaveRequest, User } from '@/types';
import Image from 'next/image';

export default function TeamRequests() {
    const { data: session } = useSession();
    const currentUser = session?.user;
    const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    
    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'VACATION' | 'SICK' | 'PERSONAL'>('ALL');
    const [sortBy, setSortBy] = useState<'createdAt_desc' | 'createdAt_asc' | 'userName_asc'>('createdAt_desc');

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;

            try {
                const [requestsRes, usersRes] = await Promise.all([
                    fetch('/api/leave-requests'),
                    fetch('/api/users'),
                ]);

                if (requestsRes.ok) {
                    const data = await requestsRes.json();
                    setAllRequests(data.sort((a: LeaveRequest, b: LeaveRequest) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    ));
                }

                if (usersRes.ok) {
                    setAllUsers(await usersRes.json());
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [currentUser]);

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
                            <Card key={request.id} className="hover:shadow-xl transition-all">
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
        </div>
    );
}
