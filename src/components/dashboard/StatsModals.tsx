
'use client';

import Modal from '@/components/ui/Modal';
import { LeaveRequest, User } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import Image from 'next/image';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Vacation Stats Modal ---
interface VacationStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    used: number;
}

export function VacationStatsModal({ isOpen, onClose, total, used }: VacationStatsModalProps) {
    const remaining = total - used;
    const data = [
        { name: 'Usate', value: used, color: '#3b82f6' }, // blue-500
        { name: 'Rimanenti', value: remaining, color: '#e5e7eb' }, // gray-200
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Dettaglio Ferie">
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="text-center mt-4 space-y-2">
                <p className="text-lg font-medium">
                    Hai usato <span className="font-bold text-blue-600">{used}</span> giorni su <span className="font-bold">{total}</span>.
                </p>
                <p className="text-sm text-gray-500">
                    Ti rimangono {remaining} giorni da pianificare! 🌴
                </p>
            </div>
        </Modal>
    );
}

// --- Request Stats Modal ---
interface RequestStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    requests: LeaveRequest[];
}

export function RequestStatsModal({ isOpen, onClose, requests }: RequestStatsModalProps) {
    const statusCounts = {
        APPROVED: 0,
        PENDING: 0,
        REJECTED: 0,
    };

    requests.forEach(r => {
        if (statusCounts[r.status] !== undefined) {
            statusCounts[r.status]++;
        }
    });

    const data = [
        { name: 'Approvate', value: statusCounts.APPROVED, fill: '#22c55e' }, // green-500
        { name: 'In Attesa', value: statusCounts.PENDING, fill: '#f59e0b' }, // amber-500
        { name: 'Rifiutate', value: statusCounts.REJECTED, fill: '#ef4444' }, // red-500
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Stato Richieste">
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="text-center mt-4">
                <p className="text-sm text-gray-500">
                    Panoramica dello stato di tutte le tue richieste inviate.
                </p>
            </div>
        </Modal>
    );
}

// --- Team Management Modal ---
interface TeamManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    currentUserRole?: string;
}

export function TeamManagementModal({ isOpen, onClose, users, currentUserRole }: TeamManagementModalProps) {
    const router = useRouter();
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    // Filter out current user from the list if desired, or show everyone.
    // For now showing everyone.

    const handleRoleUpdate = async (userId: string, newRole: 'USER' | 'MANAGER' | 'ADMIN') => {
        if (!confirm(`Sei sicuro di voler cambiare il ruolo in ${newRole}?`)) return;

        setUpdatingUserId(userId);
        try {
            const res = await fetch(`/api/users/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });

            if (res.ok) {
                router.refresh(); // Refresh to update user list in parent
            } else {
                alert('Errore durante l\'aggiornamento del ruolo');
            }
        } catch (error) {
            console.error(error);
            alert('Errore di connessione');
        } finally {
            setUpdatingUserId(null);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestione Team">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-white shrink-0 ring-2 ring-gray-100 dark:ring-gray-700">
                                <Image
                                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                                    alt={user.name}
                                    width={40}
                                    height={40}
                                />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white leading-tight">
                                    {user.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {user.role === 'ADMIN' && <ShieldAlert className="w-3 h-3 text-red-500" />}
                                    {user.role === 'MANAGER' && <ShieldCheck className="w-3 h-3 text-purple-500" />}
                                    {user.role === 'USER' && <Shield className="w-3 h-3 text-gray-400" />}
                                    <span className="text-xs text-gray-500 font-medium lowercase first-letter:uppercase">
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions - Only visible if current user is Manager/Admin (logic can be stricter) */}
                        <div className="flex gap-2">
                            {user.role === 'USER' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-8 text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                                    onClick={() => handleRoleUpdate(user.id, 'MANAGER')}
                                    disabled={updatingUserId === user.id}
                                >
                                    Promuovi
                                </Button>
                            )}
                            {user.role === 'MANAGER' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-8 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                                    onClick={() => handleRoleUpdate(user.id, 'USER')}
                                    disabled={updatingUserId === user.id}
                                >
                                    Degrada
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-400">
                Solo i Manager possono modificare i ruoli.
            </div>
        </Modal>
    );
}
