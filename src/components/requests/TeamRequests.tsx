'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { leaveService } from '@/services/leaveService';
import { Users as UsersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { LeaveRequest, User } from '@/types';
import Image from 'next/image';

export default function TeamRequests() {
    const { data: session } = useSession();
    const currentUser = session?.user;
    const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser || currentUser.role !== 'ADMIN') return;

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

    if (!currentUser || currentUser.role !== 'ADMIN') {
        return (
            <div className="p-6 lg:p-8">
                <Card>
                    <CardContent className="p-12 text-center">
                        <UsersIcon className="w-16 h-16 mx-auto text-red-500 mb-4" />
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                            Accesso Negato
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Solo i manager possono accedere a questa sezione
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
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

            {/* Requests List */}
            <div className="space-y-4">
                {allRequests.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <UsersIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                                Nessuna richiesta
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                Il team non ha ancora inserito richieste
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    allRequests.map((request) => {
                        const user = allUsers.find((u) => u.id === request.userId);
                        if (!user) return null;

                        const dayCount = leaveService.calculateDays(request);

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
                                                    {dayCount} {dayCount === 1 || dayCount === 0.5 ? 'giorno' : 'giorni'}
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
