'use client';

import { useAuth } from '@/contexts/AuthContext';
import { leaveService } from '@/services/leaveService';
import { userService } from '@/services/userService';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Check, X, Users as UsersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LeaveRequest } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function TeamRequests() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);

    const loadRequests = () => {
        const allRequests = leaveService.getPendingRequests();
        setRequests(allRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleApprove = (requestId: string) => {
        if (!currentUser) return;
        leaveService.updateRequestStatus(requestId, 'APPROVED', currentUser.id);
        loadRequests();
    };

    const handleReject = (requestId: string) => {
        if (!currentUser) return;
        if (confirm('Sei sicuro di voler rifiutare questa richiesta?')) {
            leaveService.updateRequestStatus(requestId, 'REJECTED', currentUser.id);
            loadRequests();
        }
    };

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
                        <X className="w-16 h-16 mx-auto text-red-500 mb-4" />
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
                    Gestisci le richieste di ferie del team
                </p>
            </div>

            {/* Requests List */}
            <div className="space-y-4">
                {requests.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <UsersIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                                Nessuna richiesta in attesa
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                Tutte le richieste sono state processate
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    requests.map((request) => {
                        const user = userService.getUserById(request.userId);
                        const days = leaveService.calculateDays(request.startDate, request.endDate);

                        if (!user) return null;

                        return (
                            <Card key={request.id} className="hover:shadow-xl transition-all">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="flex items-start gap-4 flex-1">
                                            {/* User Avatar */}
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="w-12 h-12 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
                                            />

                                            {/* Request Details */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {user.name}
                                                    </h3>
                                                    <Badge variant="warning">In Attesa</Badge>
                                                </div>

                                                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                                    <p>
                                                        <span className="font-medium">Tipo:</span> {getTypeLabel(request.type)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium">Dal:</span>{' '}
                                                        {format(new Date(request.startDate), 'dd MMMM yyyy', { locale: it })}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium">Al:</span>{' '}
                                                        {format(new Date(request.endDate), 'dd MMMM yyyy', { locale: it })}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium">Durata:</span> {days} {days === 1 ? 'giorno' : 'giorni'}
                                                    </p>
                                                    {request.reason && (
                                                        <p>
                                                            <span className="font-medium">Motivazione:</span> {request.reason}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                                        Richiesta inviata il{' '}
                                                        {format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm', { locale: it })}
                                                    </p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                                        Giorni disponibili: {user.vacationDaysTotal - user.vacationDaysUsed} su {user.vacationDaysTotal}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => handleApprove(request.id)}
                                                className="whitespace-nowrap"
                                            >
                                                <Check className="w-4 h-4" />
                                                Approva
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleReject(request.id)}
                                                className="whitespace-nowrap"
                                            >
                                                <X className="w-4 h-4" />
                                                Rifiuta
                                            </Button>
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
