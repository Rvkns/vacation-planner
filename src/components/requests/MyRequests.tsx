'use client';

import { useAuth } from '@/contexts/AuthContext';
import { leaveService } from '@/services/leaveService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LeaveRequest, CreateLeaveRequest } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function MyRequests() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<CreateLeaveRequest>({
        startDate: '',
        endDate: '',
        type: 'VACATION',
        reason: '',
    });

    const loadRequests = () => {
        if (currentUser) {
            const userRequests = leaveService.getRequestsByUserId(currentUser.id);
            setRequests(userRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
    };

    useEffect(() => {
        loadRequests();
    }, [currentUser]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        leaveService.createRequest(currentUser.id, formData);
        setFormData({ startDate: '', endDate: '', type: 'VACATION', reason: '' });
        setShowForm(false);
        loadRequests();
    };

    const handleDelete = (requestId: string) => {
        if (confirm('Sei sicuro di voler cancellare questa richiesta?')) {
            leaveService.deleteRequest(requestId);
            loadRequests();
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'success' | 'warning' | 'danger'; label: string }> = {
            PENDING: { variant: 'warning', label: 'In Attesa' },
            APPROVED: { variant: 'success', label: 'Approvata' },
            REJECTED: { variant: 'danger', label: 'Rifiutata' },
        };
        const config = variants[status] || variants.PENDING;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            VACATION: 'Ferie',
            SICK: 'Malattia',
            PERSONAL: 'Permesso',
        };
        return labels[type] || type;
    };

    if (!currentUser) return null;

    return (
        <div className="p-6 lg:p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Le mie richieste
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Gestisci le tue richieste di ferie e permessi
                    </p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="w-5 h-5" />
                    Nuova Richiesta
                </Button>
            </div>

            {/* Create Form */}
            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Nuova Richiesta</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Data Inizio
                                    </label>
                                    <Input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Data Fine
                                    </label>
                                    <Input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tipo
                                </label>
                                <Select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                >
                                    <option value="VACATION">Ferie</option>
                                    <option value="SICK">Malattia</option>
                                    <option value="PERSONAL">Permesso</option>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Motivazione (opzionale)
                                </label>
                                <Textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Inserisci una motivazione..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit">Invia Richiesta</Button>
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                    Annulla
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Requests List */}
            <div className="space-y-4">
                {requests.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Calendar className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                                Nessuna richiesta ancora
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                Clicca su "Nuova Richiesta" per iniziare
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    requests.map((request) => {
                        const days = leaveService.calculateDays(request.startDate, request.endDate);

                        return (
                            <Card key={request.id} className="hover:shadow-xl transition-all">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {getTypeLabel(request.type)}
                                                </h3>
                                                {getStatusBadge(request.status)}
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
                                                    <span className="font-medium">Durata:</span> {days} {days === 1 ? 'giorno' : 'giorni'}
                                                </p>
                                                {request.reason && (
                                                    <p>
                                                        <span className="font-medium">Motivazione:</span> {request.reason}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                                    Richiesta inviata il {format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm', { locale: it })}
                                                </p>
                                            </div>
                                        </div>

                                        {request.status === 'PENDING' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(request.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        )}
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
